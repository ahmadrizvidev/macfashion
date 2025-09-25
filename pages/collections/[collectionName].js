"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  FaSpinner,
  FaShoppingBag,
  FaSortAmountDown,
  FaSortAmountUp,
  FaSearch,
  FaTimes,
  FaExpand,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/firebase";
import Image from "next/image";

const PRODUCTS_PER_PAGE = 6;

// Fabric names data organized by collection type
const FABRIC_NAMES = {
  mensSummer: ["Cotton", "Soft Cotton", "Wash & Wear", "Boski", "Linen"],
  mensWinter: ["Cotton", "Wool Blend", "Velvet", "Corduroy"],
  womensSummer: ["Lawn", "Cotton", "Linen", "Silk", "Chiffon"],
  womensWinter: ["Khaddar", "Wool", "Velvet", "Tweed"]
};

const fromUrl = (str) =>
  str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Skeleton Loader Component
const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="w-full aspect-[3/4] bg-gray-300" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-4 bg-gray-300 rounded w-1/2" />
      <div className="h-6 bg-gray-300 rounded w-1/3 mt-2" />
    </div>
  </div>
);

// Optimized Image Component
const OptimizedImage = ({ src, alt, className }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || !src) {
    return (
      <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center`}>
        <FaShoppingBag className="text-4xl text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

// Smart Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
      <div className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200"
        >
          <FaChevronLeft className="text-sm" />
          Previous
        </button>

        <div className="flex gap-1">
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                currentPage === page
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-110"
                  : page === '...'
                  ? "bg-transparent text-gray-400 cursor-default"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl border border-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200"
        >
          Next
          <FaChevronRight className="text-sm" />
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Total {totalPages} pages
      </div>
    </div>
  );
};

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const urlCollection = params?.collectionName || "";
  const collectionName = fromUrl(urlCollection);

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("lowToHigh");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Group products by fabric and filter out empty/undefined fabrics
  const productsByFabric = useMemo(() => {
    const grouped = {};
    
    allProducts.forEach(product => {
      // Filter out products with empty, undefined, or "Uncategorized" fabric
      const fabric = product.fabric?.trim() || "";
      if (!fabric || fabric.toLowerCase() === "uncategorized") return;
      
      if (!grouped[fabric]) {
        grouped[fabric] = [];
      }
      grouped[fabric].push(product);
    });
    
    // Sort fabrics by product count (descending)
    return Object.fromEntries(
      Object.entries(grouped).sort(([,a], [,b]) => b.length - a.length)
    );
  }, [allProducts]);

  // Get available fabrics (excluding empty/uncategorized)
  const availableFabrics = useMemo(() => {
    return Object.keys(productsByFabric).filter(fabric => 
      fabric && fabric.toLowerCase() !== "uncategorized"
    );
  }, [productsByFabric]);

  // Get products with valid fabric for "All Fabrics" view
  const productsWithValidFabric = useMemo(() => {
    return allProducts.filter(product => {
      const fabric = product.fabric?.trim() || "";
      return fabric && fabric.toLowerCase() !== "uncategorized";
    });
  }, [allProducts]);

  // Filter products based on search and fabric
  const filteredProducts = useMemo(() => {
    let filtered = selectedFabric === "all" ? productsWithValidFabric : allProducts;

    if (selectedFabric !== "all") {
      filtered = filtered.filter(product => 
        product.fabric === selectedFabric
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.fabric?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    return filtered.sort((a, b) => {
      const priceA = parseFloat(a.price || 0);
      const priceB = parseFloat(b.price || 0);
      return sortOrder === "lowToHigh" ? priceA - priceB : priceB - priceA;
    });
  }, [allProducts, productsWithValidFabric, searchQuery, selectedFabric, sortOrder]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFabric, searchQuery, sortOrder]);

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      try {
        setLoading(true);
        const productsCollectionRef = collection(db, "products");
        const q = query(
          productsCollectionRef, 
          where("collection", "==", collectionName)
        );
        const snapshot = await getDocs(q);

        const productsData = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        setAllProducts(productsData);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch collection products:", err);
      } finally {
        setLoading(false);
      }
    };

    if (collectionName) fetchCollectionProducts();
  }, [collectionName]);

  const handleCardClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  const clearFilters = () => {
    setSelectedFabric("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Skeleton Header */}
          <div className="text-center mb-8 animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-gray-300 rounded w-1/4 mx-auto" />
          </div>

          {/* Skeleton Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {collectionName}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Discover {productsWithValidFabric.length} premium products across {availableFabrics.length} fabrics
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products or fabrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Fabric Filter Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedFabric("all")}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                selectedFabric === "all"
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-200"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-gray-200"
              }`}
            >
              All Fabrics ({availableFabrics.length})
            </button>
            {availableFabrics.map((fabric) => (
              <button
                key={fabric}
                onClick={() => setSelectedFabric(fabric)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  selectedFabric === fabric
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-200"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-gray-200"
                }`}
              >
                {fabric} ({productsByFabric[fabric]?.length || 0})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Active Filters */}
        {(selectedFabric !== "all" || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center items-center gap-4 mb-6 flex-wrap"
          >
            <span className="text-sm text-gray-600">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {selectedFabric !== "all" && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  Fabric: {selectedFabric}
                  <button onClick={() => setSelectedFabric("all")}>
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Products Display */}
        <AnimatePresence mode="wait">
          {selectedFabric === "all" ? (
            // All Fabrics View - Show 3 products per fabric
            <motion.div
              key="all-fabrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {availableFabrics.length > 0 ? (
                availableFabrics.map((fabric, fabricIndex) => {
                  const fabricProducts = productsByFabric[fabric] || [];
                  const displayProducts = fabricProducts.slice(0, 3);

                  return (
                    <motion.section
                      key={fabric}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: fabricIndex * 0.1 }}
                      className="bg-white rounded-3xl shadow-xl p-6 lg:p-8"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {fabric} Collection
                          </h2>
                          <p className="text-gray-600">
                            {fabricProducts.length} premium products available
                          </p>
                        </div>
                        {fabricProducts.length > 3 && (
                          <button
                            onClick={() => setSelectedFabric(fabric)}
                            className="mt-4 lg:mt-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <FaExpand />
                            View All {fabricProducts.length} Products
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayProducts.map((product, index) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                            onClick={() => handleCardClick(product.id)}
                          >
                            <div className="relative w-full aspect-[3/4] overflow-hidden">
                              <OptimizedImage
                                src={product.images?.[0]}
                                alt={product.title}
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                <span className="text-sm font-medium bg-blue-500 px-2 py-1 rounded">
                                  View Details
                                </span>
                              </div>
                            </div>

                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                {product.title}
                              </h3>
                              <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                                PKR {parseFloat(product.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-3xl shadow-xl"
                >
                  <FaShoppingBag className="text-6xl text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    No products with valid fabric information found in this collection.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Single Fabric View with Pagination
            <motion.div
              key="single-fabric"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Single Fabric Header */}
                <div className="flex gap-2 items-center justify-center mb-5">
                        <button
                      onClick={() => setSelectedFabric("all")}
                      className="bg-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition-all duration-300"
                    >
                      Back to All Fabrics
                    </button>
                    </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-3xl shadow-xl"
                >
                  <FaShoppingBag className="text-6xl text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    No products found in {selectedFabric} fabric.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  >
                    Back to All Fabrics
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {paginatedProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="group cursor-pointer bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        onClick={() => handleCardClick(product.id)}
                      >
                        <div className="relative w-full aspect-[3/4] overflow-hidden">
                          <OptimizedImage
                            src={product.images?.[0]}
                            alt={product.title}
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h3>
                          <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                            PKR {parseFloat(product.price || 0).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Smart Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}