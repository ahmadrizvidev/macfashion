// components/Collections.js
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const collections = [
  {
    title: "Mens",
    image: "https://plus.unsplash.com/premium_photo-1691030256214-dc57034ec935?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    href: "/collections/men",
  },
  {
    title: "Womens",
    image: "/assets/women.jpg",
    href: "/collections/womens-winter-collection",
  },
  {
    title: "Kids",
    image: "https://plus.unsplash.com/premium_photo-1675183713626-81e6de4552e1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    href: "/collections/kids",
  },
];

// Animation Variants
const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 80, rotate: -2 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      delay: i * 0.25,
      duration: 0.8,
      ease: [0.25, 0.8, 0.25, 1], // smooth spring-like easing
    },
  }),
};

export default function Collections() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-4xl font-extrabold text-center mb-14 tracking-wide text-gray-900"
        >
          Explore Our Collections
        </motion.h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {collections.map((col, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
              className="group relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-[480px] w-full overflow-hidden">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 text-center p-8">
                <h3 className="text-white text-3xl font-bold tracking-wide drop-shadow-md">
                  {col.title}
                </h3>
                <Link
                  href={col.href}
                  className="mt-3 inline-block bg-white text-gray-900 font-medium px-5 py-2 rounded-full shadow-md group-hover:bg-gray-900 group-hover:text-white transition"
                >
                  Shop Now →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
