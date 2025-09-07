"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { FaSpinner, FaArrowRight, FaShoppingBag } from "react-icons/fa";
import { motion } from "framer-motion";
import { db } from "../../lib/firebase";
import Link from "next/link";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({ collection: "" });

  // Convert string to SEO-friendly URL (kebab-case)
  const toUrl = (str) =>
    str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const collectionsMap = {};

      // Group products by collection
      products.forEach((product) => {
        if (!product.collection) return;

        if (!collectionsMap[product.collection]) {
          collectionsMap[product.collection] = {
            name: product.collection,
            url: toUrl(product.collection),
            products: [],
            productCount: 0,
            sampleImage: null,
            priceRange: { min: Infinity, max: 0 },
          };
        }

        collectionsMap[product.collection].products.push(product);
        collectionsMap[product.collection].productCount++;

        const price = parseFloat(product.price) || 0;
        collectionsMap[product.collection].priceRange.min = Math.min(
          collectionsMap[product.collection].priceRange.min,
          price
        );
        collectionsMap[product.collection].priceRange.max = Math.max(
          collectionsMap[product.collection].priceRange.max,
          price
        );
      });

      // Pick first product with an image for each collection
      const finalCollections = Object.values(collectionsMap).map((col) => {
        const firstProductWithImage = col.products.find(
          (p) => p.images && Array.isArray(p.images) && p.images.length > 0
        );
        col.sampleImage = firstProductWithImage ? firstProductWithImage.images[0] : null;
        return col;
      });

      setCollections(finalCollections.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error("Failed to fetch collections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-6xl text-indigo-600 mb-4 text-center mx-auto" />
          <p className="text-lg sm:text-xl font-semibold text-gray-600">Loading Collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            Our Collections
          </h1>
          <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our curated collections featuring the latest trends and timeless classics
          </p>
        </motion.div>



        {/* Collections Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.name}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <Link href={`/collections/${collection.url}`}>
                <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200">
                  {collection.sampleImage ? (
                    <img
                      src={collection.images}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <FaShoppingBag className="text-4xl sm:text-5xl text-gray-400 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-25 flex items-end">
                    <div className="p-3 sm:p-6 text-white w-full">
                      <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                        {collection.name}
                      </h3>
                      <div className="flex justify-between items-center text-sm sm:text-base">
                        <span>{collection.productCount} Products</span>
                        <FaArrowRight className="text-base sm:text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Price Range</p>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600">
                      PKR{" "}
                      {collection.priceRange.min === collection.priceRange.max
                        ? collection.priceRange.min.toFixed(0)
                        : `${collection.priceRange.min.toFixed(0)} - ${collection.priceRange.max.toFixed(0)}`}
                    </p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-600 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold text-sm sm:text-base">
                    View
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
