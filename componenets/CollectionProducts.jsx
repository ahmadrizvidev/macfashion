"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { FaStar, FaSpinner } from "react-icons/fa";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getReviewsForProduct = async (productId) => {
  const reviewsCollectionRef = collection(db, "reviews");
  const q = query(reviewsCollectionRef, where("productId", "==", productId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.length;
};

const fetchProductsWithReviews = async (productsSnapshot) => {
  const productsList = productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const productsWithReviews = await Promise.all(
    productsList.map(async (product) => {
      const reviewCount = await getReviewsForProduct(product.id);
      return { ...product, reviewsCount: reviewCount };
    })
  );
  return productsWithReviews;
};

export default function CollectionProducts({ collectionName }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!collectionName) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const colRef = collection(db, "products");
        const q = query(colRef, where("collection", "==", collectionName));
        const snapshot = await getDocs(q);
        const productsWithReviews = await fetchProductsWithReviews(snapshot);
        setProducts(productsWithReviews.slice(0, 6));
      } catch (err) {
        console.error(`Failed to fetch products for ${collectionName}:`, err);
        setProducts([]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [collectionName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );
  }

  return (
    <section className="w-[100vw] py-12 bg-gray-50 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 capitalize">
            {collectionName}
          </h2>
          <Link
            href={`/collections/${collectionName.toLowerCase().replace(/\s/g, '-')}`}
            className="text-indigo-600 font-semibold hover:text-indigo-800 transition duration-300"
          >
            Shop All &rarr;
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="block group"
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full">
                  <div className="relative w-full aspect-[3/4] overflow-hidden">
                    <Image
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex-grow flex flex-col justify-end mt-2">
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span>
                          {product.reviewsCount > 0
                            ? `${product.reviewsCount} reviews`
                            : "No reviews yet"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline space-x-2">
                        {product.oldPrice && (
                          <span className="line-through text-gray-400 font-medium text-sm">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                        <span className="text-red-600 font-extrabold text-lg">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No products found for this collection.
          </p>
        )}
      </div>
    </section>
  );
}