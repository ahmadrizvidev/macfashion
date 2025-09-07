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

export default function CollectionProducts() {
  const [collections, setCollections] = useState({
    Mens: [],
    Womens: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, "products");

        const wantedCollections = ["Mens", "Womens Winter Collection"];
        let newCollections = {};

        for (const name of wantedCollections) {
          const q = query(colRef, where("collection", "==", name));
          const snapshot = await getDocs(q);
          const productsWithReviews = await fetchProductsWithReviews(snapshot);
          newCollections[name] = productsWithReviews.slice(0, 6);
        }

        setCollections(newCollections);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
      setLoading(false);
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-100 py-16">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {Object.entries(collections).map(([name, products]) => (
        <section key={name} className="py-12">
          <div className="container mx-auto px-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                {name}
              </h2>
              <Link
                href={`/collections/${name.toLowerCase()}`}
                className="text-indigo-600 font-semibold hover:text-indigo-800 transition duration-300"
              >
                Shop All
              </Link>
            </div>

            {/* Product Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="block h-full"
                  >
                    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 overflow-hidden cursor-pointer flex flex-col h-full">
                      <div className="relative w-full aspect-[3/4] rounded-t-2xl overflow-hidden">
                        <Image
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="p-2 mb-2 h-14">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 hover:text-indigo-600 transition overflow-hidden line-clamp-2">
                            {product.title}
                          </h3>
                        </div>
                        <div className="flex-grow flex flex-col justify-end">
                          <div className="mt-2 flex items-center text-gray-500 text-sm">
                            <FaStar className="text-yellow-400 mr-1" />
                            <span>
                              {product.reviewsCount > 0
                                ? `${product.reviewsCount} reviews`
                                : "No reviews yet"}
                            </span>
                          </div>
                          <div className="mt-3 flex items-baseline space-x-2">
                            {product.oldPrice && (
                              <span className="line-through text-gray-400 font-medium text-xs md:text-sm">
                                {formatPrice(product.oldPrice)}
                              </span>
                            )}
                            <span className="text-red-600 font-extrabold text-lg md:text-xl">
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
              <p className="text-gray-500 text-center">
                No products found for {name}.
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
