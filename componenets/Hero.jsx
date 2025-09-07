import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

const slides = [
  "/assets/slider/slide1.jpg",
  "/assets/slider/slide2.jpg",
  "/assets/slider/slide3.jpg",
];

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const firstImageRef = useRef(null);

  // Auto-slide every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Set hero height based on first image
  useEffect(() => {
    const img = firstImageRef.current;
    if (img && img.complete) {
      setHeroHeight(img.naturalHeight / img.naturalWidth * window.innerWidth);
    }
  }, []);

  const handleImageLoad = (e) => {
    if (current === 0) {
      setHeroHeight(e.target.naturalHeight / e.target.naturalWidth * window.innerWidth);
    }
  };

  return (
    <div className="w-full relative overflow-hidden">
      <div
        className="relative w-full"
        style={{ height: heroHeight || "auto", maxHeight: "90vh" }}
      >
        {slides.map((src, index) => (
          <motion.img
            key={index}
            ref={index === 0 ? firstImageRef : null}
            src={src}
            alt={`Slide ${index + 1}`}
            onLoad={handleImageLoad}
            initial={false}
            animate={{
              opacity: current === index ? 1 : 0,
              x: current === index ? 0 : 30,
              scale: current === index ? 1 : 1.03,
            }}
            transition={{
              duration: 1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="absolute top-0 left-0 w-full object-cover"
          />
        ))}
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              current === index
                ? "bg-white scale-110 shadow-md"
                : "bg-gray-500/70 hover:scale-105"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
