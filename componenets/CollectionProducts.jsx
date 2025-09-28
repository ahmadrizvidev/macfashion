"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { FaStar, FaSpinner } from "react-icons/fa";
import AddToCartButton from "./AddToCartButton";

// Memoized price formatter
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Preload images for better performance
const preloadImage = (src) => {
  if (typeof window !== 'undefined' && src) {
    const img = new window.Image();
    img.src = src;
  }
};

// Function to get actual reviews count for a product
const getReviewsCount = async (productId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("productId", "==", productId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return 0;
  }
};

// Batch fetch reviews for all products to reduce Firestore reads
const fetchReviewsForProducts = async (products) => {
  try {
    // Get all product IDs
    const productIds = products.map(product => product.id);
    
    // Fetch all reviews for these product IDs in a single query
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("productId", "in", productIds));
    const querySnapshot = await getDocs(q);
    
    // Count reviews per product
    const reviewsCountMap = {};
    querySnapshot.forEach((doc) => {
      const review = doc.data();
      if (review.productId) {
        reviewsCountMap[review.productId] = (reviewsCountMap[review.productId] || 0) + 1;
      }
    });
    
    return reviewsCountMap;
  } catch (error) {
    console.error("Error batch fetching reviews:", error);
    return {};
  }
};

export default function CollectionProducts({ collectionName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Optimized product fetcher with actual reviews
  const fetchProducts = useCallback(async () => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const colRef = collection(db, "products");
      const q = query(
        colRef, 
        where("collection", "==", collectionName),
        limit(6)
      );
      
      const snapshot = await getDocs(q);
      const productsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        reviewsCount: 0 // Initialize with 0, will be updated
      }));

      // Fetch actual reviews count for all products in batch
      const reviewsCountMap = await fetchReviewsForProducts(productsList);
      
      // Update products with actual review counts
      const productsWithReviews = productsList.map(product => ({
        ...product,
        reviewsCount: reviewsCountMap[product.id] || 0
      }));

      setProducts(productsWithReviews);
      
      // Preload images in background
      productsWithReviews.forEach(product => {
        if (product.images?.[0]) {
          preloadImage(product.images[0]);
        }
      });
    } catch (err) {
      console.error(`Failed to fetch products for ${collectionName}:`, err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchProducts();
      }
    };

    const timer = setTimeout(loadData, 50);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchProducts]);

  // Show skeleton loader instead of spinner for better UX
  if (loading) {
    return (
      <section className="w-full py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="w-full aspect-[3/4] bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 capitalize">
            {collectionName}
          </h2>
          <Link
            href={`/collections/${collectionName.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-indigo-600 font-semibold hover:text-indigo-800 transition duration-200 text-sm md:text-base"
            prefetch={false}
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full group"
            >
              <Link
                href={`/product/${product.id}`}
                className="block flex-grow"
                prefetch={false}
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title || "Product image"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                    priority={index < 2}
                  />
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex-grow flex flex-col justify-end mt-2">
                    <div className="flex items-center text-gray-500 text-xs mb-1">
                      <FaStar className="text-yellow-400 mr-1" />
                      <span>
                        {product.reviewsCount === 0 
                          ? "No reviews yet" 
                          : `${product.reviewsCount} review${product.reviewsCount !== 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1 mb-3">
                      {product.oldPrice && (
                        <span className="line-through text-gray-400 font-medium text-xs">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                      <span className="text-red-600 font-bold text-base">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3">
                <AddToCartButton 
                  product={product}
                  variant="compact"
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}