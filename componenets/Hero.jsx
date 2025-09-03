// pages/index.js
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  "/assets/slider/slide1.jpg",
  "/assets/slider/slide2.jpg",
  "/assets/slider/slide3.jpg",
];

export default function Home() {
  const [current, setCurrent] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000); // 5 sec per slide
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative overflow-hidden">
      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={slides[current]}
            alt={`Slide ${current + 1}`}
            initial={{ scale: 1., opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="w-full h-auto object-cover"
          />
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full ${
              current === index ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
