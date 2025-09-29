"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaStar, FaSpinner } from 'react-icons/fa';
import BuyNowButton from "./BuyNowButton";

// Function to format price in PKR
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Function to get reviews for a product
const getReviewsForProduct = async (productId) => {
  const reviewsCollectionRef = collection(db, "reviews");
  const q = query(reviewsCollectionRef, where("productId", "==", productId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length;
};

// Function to fetch product details along with review counts
const fetchProductsWithReviews = async (productsSnapshot) => {
  const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const productsWithReviews = await Promise.all(
    productsList.map(async (product) => {
      const reviewCount = await getReviewsForProduct(product.id);
      return { ...product, reviewsCount: reviewCount };
    })
  );
  return productsWithReviews;
};

export default function SummerTracksuits() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessProducts = async () => {
      try {
        const colRef = collection(db, "products");
        const snapshot = await getDocs(colRef);
        const productsWithReviews = await fetchProductsWithReviews(snapshot);
        
        // Sort products by price from low to high
        const sortedProducts = productsWithReviews.sort((a, b) => a.price - b.price);
        
        setProducts(sortedProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
      setLoading(false);
    };

    fetchAndProcessProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-100">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100">
        <p className="text-xl text-gray-600 font-semibold mb-2">No products found. 😔</p>
        <p className="text-sm text-gray-500">Please check back later.</p>
      </div>
    );
  }

  // Limit to 8 products for display
  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-16 bg-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Hot Sellings 🔥
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-12">
        {displayProducts.map((product) => (
          <motion.div
            key={product.id}
            className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col h-full group"
            whileHover={{ scale: 1.03 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href={`/product/${product.id}`} className="flex flex-col flex-grow">
              {/* Use a fixed aspect ratio for the image container */}
              <div className="relative w-full aspect-[3/4] rounded-t-2xl overflow-hidden">
                <Image
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                />
              </div>
              <div className="p-5 flex flex-col flex-grow">
                {/* Fixed height for the title container with line-clamp */}
                <div className="h-14">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition line-clamp-2">
                    {product.title}
                  </h3>
                </div>
                {/* Flex-grow to push reviews and price to the bottom */}
                <div className="flex-grow flex flex-col justify-end">
                  <div className="mt-2 flex items-center text-gray-500 text-sm">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span>
                      {product.reviewsCount > 0 ? `${product.reviewsCount} reviews` : "No reviews yet"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center space-x-3 mb-4">
                    {product.oldPrice && (
                      <span className="line-through text-gray-400 font-medium text-sm">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    <span className="text-red-600 font-extrabold text-xl">
                        {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Buy Now Button - Outside Link to prevent conflicts */}
            <div className="px-5 pb-5">
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
      
      {/* Centered "Shop All" button at the end of the section */}
      {products.length > 8 && (
        <div className="flex justify-center mt-12">
          <Link
            href="/products"
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
          >
            Shop All
          </Link>
        </div>
      )}
    </section>
  );
}