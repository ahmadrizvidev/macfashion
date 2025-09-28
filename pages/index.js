"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Carousel from "@/componenets/Hero";
import Collections from "@/componenets/Collections";
import SummerTracksuits from "@/componenets/Productshow";
import HomeCollections from "@/componenets/HomeCollections";
import NewsLetter from "@/componenets/newsletter";
import CollectionsShowcase from "./collections/index";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show preloader for 4 seconds
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Professional Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            {/* Animated Logo */}
            {/* Simple Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shadow-lg border">
                <span className="text-xl font-bold text-gray-800">M</span>
              </div>
            </motion.div>

            {/* Simple Loading */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full mb-4"
            />

            {/* Store Name */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-xl font-semibold text-gray-800">Macstore</h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div style={{ display: loading ? "none" : "block" }}>
        <div className={`${geistSans.variable} font-sans`}>
          <Carousel />
          {/* <CollectionsShowcase /> */}
          <Collections />
          <SummerTracksuits />
          <HomeCollections />
          <NewsLetter />
        </div>
      </div>
    </>
  );
}
