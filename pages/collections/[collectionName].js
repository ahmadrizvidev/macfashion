"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { FaSpinner, FaShoppingBag, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/firebase";
import Link from "next/link";

// Define the number of products per page
const PRODUCTS_PER_PAGE = 30;

// Convert kebab-case URL back to normal string (for display only)
const fromUrl = (str) =>
  str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const urlCollection = params?.collectionName || "";
  const collectionName = fromUrl(urlCollection);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("lowToHigh"); // 'lowToHigh' or 'highToLow'

  const fetchCollectionProducts = async () => {
    try {
      setLoading(true);
      const productsCollectionRef = collection(db, "products");
      const snapshot = await getDocs(productsCollectionRef);

      // Filter products **case-insensitively** for collection
      const productsData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (p) =>
            p.collection &&
            p.collection.toLowerCase() === collectionName.toLowerCase()
        );

      // Simulate a network delay to prevent UI flickers on fast connections
      await new Promise(resolve => setTimeout(resolve, 500));

      setProducts(productsData);
      setCurrentPage(1); // Reset to the first page when a new collection is loaded
    } catch (err) {
      console.error("Failed to fetch collection products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionName) fetchCollectionProducts();
  }, [collectionName]);

  // Use useMemo for sorted and paginated products to improve performance
  const sortedAndPaginatedProducts = useMemo(() => {
    // Sort products based on the current sort order
    const sortedProducts = [...products].sort((a, b) => {
      const priceA = parseFloat(a.price || 0);
      const priceB = parseFloat(b.price || 0);
      return sortOrder === "lowToHigh" ? priceA - priceB : priceB - priceA;
    });

    // Calculate pagination
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, endIndex);
  }, [products, currentPage, sortOrder]);

  // Calculate the total number of pages
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const handleCardClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center items-center min-h-screen bg-indigo-50"
      >
        <FaSpinner className="animate-spin text-6xl text-indigo-600" />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header and Sorting Controls */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-4">
              {collectionName}
            </h1>
            <p className="text-xs sm:text-lg text-gray-600">
              {products.length} products
            </p>
          </div>

          {products.length > 0 && (
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
              <span className="text-sm sm:text-base text-gray-700 font-semibold">Sort by Price:</span>
              <button
                onClick={() => setSortOrder("lowToHigh")}
                className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  sortOrder === "lowToHigh"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Low to High
                <FaSortAmountDown />
              </button>
              <button
                onClick={() => setSortOrder("highToLow")}
                className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  sortOrder === "highToLow"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                High to Low
                <FaSortAmountUp />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="wait">
          {products.length === 0 ? (
            <motion.div
              key="no-products"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center py-16"
            >
              <FaShoppingBag className="text-6xl text-gray-300 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-500">
                This collection doesn't have any products yet.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {sortedAndPaginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                  onClick={() => handleCardClick(product.id)}
                >
                  {/* Product Image */}
                  <div className="relative w-full h-80 bg-gray-200">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaShoppingBag className="text-4xl sm:text-5xl text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-2">
                        {product.title}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center mt-2 sm:mt-4">
                      <p className="text-lg sm:text-2xl font-bold text-red-600">
                        PKR {parseFloat(product.price || 0).toFixed(0)}
                      </p>
                      {/* Removed individual "View Details" link to make the entire card clickable */}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === index + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}