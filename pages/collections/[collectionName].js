"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { FaSpinner, FaShoppingBag } from "react-icons/fa";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
import Link from "next/link";

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

      setProducts(productsData);
    } catch (err) {
      console.error("Failed to fetch collection products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionName) fetchCollectionProducts();
  }, [collectionName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-indigo-50">
        <FaSpinner className="animate-spin text-6xl text-indigo-600" />
      </div>
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
          <p className="text-xs sm:text-lg text-gray-600">{products.length} products</p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <FaShoppingBag className="text-6xl text-gray-300 mb-4 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">No Products Found</h3>
            <p className="text-gray-500">This collection doesn't have any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, index) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
