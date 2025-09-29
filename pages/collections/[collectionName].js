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
import BuyNowButton from "../../componenets/BuyNowButton";
import CartManager from "../../componenets/CartManager";
import { useCart } from "../../context/CartContext";

const PRODUCTS_PER_PAGE = 12;

// Collections that don't have fabric filters - use exact names
const NON_FABRIC_COLLECTIONS = ["Tracksuit", "Bed Sheet", "Mens Shawl"];

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
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8">
      <div className="text-sm text-gray-600 whitespace-nowrap">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 text-sm"
        >
          <FaChevronLeft className="text-xs sm:text-sm" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex gap-1">
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold transition-all duration-300 text-sm sm:text-base ${
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
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <FaChevronRight className="text-xs sm:text-sm" />
        </button>
      </div>

      <div className="text-sm text-gray-600 whitespace-nowrap hidden sm:block">
        {totalPages} pages total
      </div>
    </div>
  );
};

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const urlCollection = params?.collectionName || "";
  const collectionName = fromUrl(urlCollection);
  const { cartItems, getCartTotal, getCartItemsCount } = useCart();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("lowToHigh");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Check if current collection is a non-fabric collection - FIXED LOGIC
  const isNonFabricCollection = useMemo(() => {
    // Convert both to lowercase for case-insensitive comparison
    const currentCollection = collectionName.toLowerCase().trim();
    
    return NON_FABRIC_COLLECTIONS.some(nonFabric => 
      currentCollection === nonFabric.toLowerCase().trim()
    );
  }, [collectionName]);

  // Reset filters when collection changes
  useEffect(() => {
    setSelectedFabric("all");
    setSearchQuery("");
    setCurrentPage(1);
    setSortOrder("lowToHigh");
  }, [collectionName]);

  // Group products by fabric and filter out empty/undefined fabrics
  const productsByFabric = useMemo(() => {
    if (isNonFabricCollection) return {};
    
    const grouped = {};
    
    allProducts.forEach(product => {
      const fabric = product.fabric?.trim() || "";
      if (!fabric || fabric.toLowerCase() === "uncategorized") return;
      
      if (!grouped[fabric]) {
        grouped[fabric] = [];
      }
      grouped[fabric].push(product);
    });
    
    return Object.fromEntries(
      Object.entries(grouped).sort(([,a], [,b]) => b.length - a.length)
    );
  }, [allProducts, isNonFabricCollection]);

  // Get available fabrics (excluding empty/uncategorized)
  const availableFabrics = useMemo(() => {
    if (isNonFabricCollection) return [];
    return Object.keys(productsByFabric).filter(fabric => 
      fabric && fabric.toLowerCase() !== "uncategorized"
    );
  }, [productsByFabric, isNonFabricCollection]);

  // Get products with valid fabric for "All Fabrics" view
  const productsWithValidFabric = useMemo(() => {
    if (isNonFabricCollection) return allProducts;
    
    return allProducts.filter(product => {
      const fabric = product.fabric?.trim() || "";
      return fabric && fabric.toLowerCase() !== "uncategorized";
    });
  }, [allProducts, isNonFabricCollection]);

  // Filter products based on search and fabric - FIXED SORTING
  const filteredProducts = useMemo(() => {
    let filtered = isNonFabricCollection ? allProducts : productsWithValidFabric;

    if (!isNonFabricCollection && selectedFabric !== "all") {
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

    // FIXED: Proper price sorting with safe number conversion
    return [...filtered].sort((a, b) => {
      // Safely convert prices to numbers, default to 0 if invalid
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      
      return sortOrder === "lowToHigh" ? priceA - priceB : priceB - priceA;
    });
  }, [allProducts, productsWithValidFabric, searchQuery, selectedFabric, sortOrder, isNonFabricCollection]);

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

  // Debug logging to check collection detection - FIXED: Moved after availableFabrics declaration
  useEffect(() => {
    console.log('Collection Name:', collectionName);
    console.log('Is Non-Fabric Collection:', isNonFabricCollection);
    console.log('Available Fabrics:', availableFabrics);
    console.log('All Products Count:', allProducts.length);
    console.log('Filtered Products Count:', filteredProducts.length);
    console.log('Sort Order:', sortOrder);
    
    // Debug price sorting
    if (filteredProducts.length > 0) {
      console.log('Sample prices:', filteredProducts.slice(0, 3).map(p => ({
        title: p.title,
        price: p.price,
        parsedPrice: parseFloat(p.price) || 0
      })));
    }
  }, [collectionName, isNonFabricCollection, availableFabrics, allProducts, filteredProducts, sortOrder]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle checkout with all cart items
  const handleCheckout = (cartItems) => {
    // Store all cart items for checkout
    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));

    // FB Pixel InitiateCheckout
    if (typeof window !== "undefined" && window.fbq) {
      const totalValue = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
      
      window.fbq("track", "InitiateCheckout", {
        content_type: "product",
        value: totalValue,
        currency: "PKR",
        num_items: totalItems,
      });
    }

    // Navigate to checkout
    router.push("/checkout");
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
     

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isNonFabricCollection 
                  ? `Search ${collectionName.toLowerCase()} products...` 
                  : "Search products or fabrics..."
                }
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

        {/* Cart Manager - Shows when cart has items */}
        <div className="max-w-4xl mx-auto mb-8">
          <CartManager
            variant="default"
            className="mx-auto"
            onCheckout={handleCheckout}
          />
        </div>

        {/* Fabric Filter Chips - Only show for fabric collections */}
        {!isNonFabricCollection && availableFabrics.length > 0 && (
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
        )}

        {/* Active Filters */}
        {(selectedFabric !== "all" || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center items-center gap-4 mb-6 flex-wrap"
          >
            <span className="text-sm text-gray-600">Active filters:</span>
            <div className="flex flex-wrap gap-2">
              {!isNonFabricCollection && selectedFabric !== "all" && (
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
          {isNonFabricCollection || selectedFabric === "all" ? (
            // All Products View - For non-fabric collections or "All Fabrics" view
            <motion.div
              key="all-products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Sort Options */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-gray-600">
                  Showing {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSortOrder(sortOrder === "lowToHigh" ? "highToLow" : "lowToHigh")}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-200"
                  >
                    {sortOrder === "lowToHigh" ? <FaSortAmountDown /> : <FaSortAmountUp />}
                    Price {sortOrder === "lowToHigh" ? "Low to High" : "High to Low"}
                  </button>
                </div>
              </div>

              {/* Products Grid with Pagination */}
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
                    {searchQuery 
                      ? `No products found matching "${searchQuery}"`
                      : `No products found in ${collectionName} collection.`
                    }
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  >
                    Clear Filters
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
                        className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col"
                      >
                        <div 
                          className="cursor-pointer flex-grow"
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
                            <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-2">
                              PKR {parseFloat(product.price || 0).toLocaleString()}
                            </p>
                            {!isNonFabricCollection && product.fabric && (
                              <p className="text-sm text-gray-600 mt-1">
                                Fabric: {product.fabric}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="px-4 pb-4">
                          <BuyNowButton 
                            product={product}
                            variant="compact"
                            showQuantityControls={true}
                            className="w-full"
                          />
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

              {/* Sort Options for Single Fabric View */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="text-gray-600">
                  Showing {filteredProducts.length} products in {selectedFabric}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSortOrder(sortOrder === "lowToHigh" ? "highToLow" : "lowToHigh")}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-200"
                  >
                    {sortOrder === "lowToHigh" ? <FaSortAmountDown /> : <FaSortAmountUp />}
                    Price {sortOrder === "lowToHigh" ? "Low to High" : "High to Low"}
                  </button>
                </div>
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
                        className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col"
                      >
                        <div 
                          className="cursor-pointer flex-grow"
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
                            <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-2">
                              PKR {parseFloat(product.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="px-4 pb-4">
                          <BuyNowButton 
                            product={product}
                            variant="compact"
                            showQuantityControls={true}
                            className="w-full"
                          />
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