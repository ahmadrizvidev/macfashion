"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function CollectionSection({ title, products, link }) {
  if (!products || products.length === 0)
    return <p className="text-center py-12">No products found.</p>;

  return (
    <section className="py-12 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center px-6 md:px-12">
        <h2 className="text-2xl md:text-3xl font-bold tracking-wide">{title}</h2>
        <Link
          href={link}
          className="text-sm font-medium text-gray-700 hover:text-black transition"
        >
          View all
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-6 md:px-12 mt-8">
        {products.map((product) => (
          <motion.div
            key={product.id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 duration-300 flex flex-col"
            whileHover={{ scale: 1.03 }}
          >
            <Link href={`/product/${product.id}`} className="flex flex-col flex-1">
              {/* Image */}
              <div className="relative w-full aspect-[3/4] rounded-t-xl overflow-hidden flex-shrink-0">
                <Image
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.title}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                  sizes="(max-width: 768px) 100vw,
                         (max-width: 1200px) 50vw,
                         33vw"
                />
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 line-clamp-2">
                    {product.title}
                  </h3>
                  {product.reviews && (
                    <p className="text-yellow-500 text-xs mt-1">
                      ⭐ {product.reviews} reviews
                    </p>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {product.oldPrice && (
                    <span className="line-through text-gray-400 text-sm">
                      {product.oldPrice}
                    </span>
                  )}
                  <span className="text-red-600 font-bold text-lg">
                    {product.price}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
