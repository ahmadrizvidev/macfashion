"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { FaSpinner, FaShoppingBag } from "react-icons/fa";
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
  const urlCollection = params?.collectionName || "";
  const collectionName = fromUrl(urlCollection);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

      // Simulate a network delay for better UI demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));

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

  // Calculate the total number of pages
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  // Get the products for the current page
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-4">
            {collectionName}
          </h1>
          <p className="text-xs sm:text-lg text-gray-600">
            {products.length} products
          </p>
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
              {currentProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.6 }}
                >
                  {/* Product Image */}
                  <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200">
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
                      <Link
                        href={`/product/${product.id}`}
                        className="bg-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-indigo-700 text-xs sm:text-sm transition-colors duration-200"
                      >
                        View Details
                      </Link>
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