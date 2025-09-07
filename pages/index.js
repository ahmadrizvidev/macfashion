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
      {/* Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            {/* Rotating loader */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-16 h-16 border-4 border-t-green-500 border-gray-700 rounded-full"
            />
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
