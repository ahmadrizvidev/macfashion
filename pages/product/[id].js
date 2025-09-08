// components/ProductDetails.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { FiShoppingCart, FiCreditCard, FiMessageSquare, FiClock, FiAlertTriangle } from "react-icons/fi";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [error, setError] = useState(null); // New state for error messages

  // State for selected variants
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  function calculateTimeLeft() {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    const difference = future - now;

    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { minutes: 0, seconds: 0 };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const prodData = docSnap.data();
          setProduct(prodData);
          if (prodData.category) fetchRelatedProducts(prodData.category);
          fetchReviews(id);
        } else {
          console.error("Product not found");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const fetchReviews = async (productId) => {
    try {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId)
      );
      const querySnapshot = await getDocs(q);
      setReviews(querySnapshot.docs.map((doc) => doc.data()));
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const submitReview = async () => {
    if (rating === 0 || comment.trim() === "") {
      setError("Please provide a rating and a comment.");
      return;
    }
    setError(null);
    try {
      await addDoc(collection(db, "reviews"), {
        productId: id,
        rating,
        comment,
        name: "Anonymous",
        email: "anonymous@example.com",
        date: new Date().toISOString(),
      });
      setRating(0);
      setComment("");
      setShowReviewPopup(false);
      fetchReviews(id);
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  const fetchRelatedProducts = async (category) => {
    if (!category) return;
    try {
      const q = query(
        collection(db, "products"),
        where("category", "==", category)
      );
      const querySnapshot = await getDocs(q);
      const related = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.id !== id)
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (err) {
      console.error("Failed to fetch related products:", err);
    }
  };

  const addToCart = () => {
    setError(null);
    const hasCategoryVariants = product.variants?.some(v => v.size);
    const hasColorVariants = product.variants?.some(v => v.color);

    if (hasCategoryVariants && !selectedCategory) {
      setError("Please select a size before adding to cart.");
      return;
    }
    if (hasColorVariants && !selectedColor) {
      setError("Please select a color before adding to cart.");
      return;
    }

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const productWithVariants = {
      ...product,
      id,
      quantity: 1,
      selectedCategory,
      selectedColor
    };

    // Check if the product already exists with the same variant
    const existingItemIndex = cart.findIndex(
      (item) => item.id === id && item.selectedColor === selectedColor && item.selectedCategory === selectedCategory
    );

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push(productWithVariants);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/cart");
  };

  const handleBuyNow = () => {
    setError(null);
    const hasCategoryVariants = product.variants?.some(v => v.size);
    const hasColorVariants = product.variants?.some(v => v.color);

    if (hasCategoryVariants && !selectedCategory) {
      setError("Please select a category before proceeding to checkout.");
      return;
    }
    if (hasColorVariants && !selectedColor) {
      setError("Please select a color before proceeding to checkout.");
      return;
    }

    const productForCheckout = [{
      ...product,
      id,
      quantity: 1,
      selectedCategory,
      selectedColor
    }];
    localStorage.setItem("checkoutItems", JSON.stringify(productForCheckout));
    router.push("/checkout");
  };
 const handleWhatsAppOrder = () => {
    const message = `I would like to order the product: ${product?.title}\nPrice: ${product?.price}\nProduct Link: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/923052732104?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      </div>
    );
  }

  if (!product) {
    return <p className="text-center py-12 text-xl">Product not found.</p>;
  }

  // Extract unique categories and colors
  const uniqueCategories = product.variants?.length > 0
    ? [...new Set(product.variants.map(v => v.size || "Default"))]
    : [];

  const uniqueColors = product.variants?.length > 0
    ? [...new Set(product.variants.map(v => v.color).filter(c => c))]
    : [];

  const media = [
    ...(product.images?.length > 0 ? product.images : ["/placeholder.png"]),
    ...(product.video ? [product.video] : []),
  ];

  const isVideo = (src) =>
    src.endsWith(".mp4") || (src.startsWith("https://") && src.includes("youtube"));

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Product Details Section */}
      <div className="bg-white pt-6 pb-12 shadow-sm md:shadow-lg rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-10">
          {/* Left Media */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="w-full h-auto min-h-[400px] aspect-video relative rounded-xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
              {isVideo(media[selectedMediaIndex]) ? (
                <video
                  src={media[selectedMediaIndex]}
                  controls
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Image
                  src={media[selectedMediaIndex]}
                  alt={product.title}
                  fill
                  style={{ objectFit: "contain" }}
                  className="rounded-xl"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                />
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
              {media.map((m, idx) => (
                <div
                  key={idx}
                  className={`w-24 h-24 border-2 rounded-lg cursor-pointer flex-shrink-0 flex items-center justify-center overflow-hidden transition-colors ${
                    selectedMediaIndex === idx
                      ? "border-indigo-600 shadow-md"
                      : "border-gray-300 hover:border-indigo-400"
                  }`}
                  onClick={() => setSelectedMediaIndex(idx)}
                >
                  {isVideo(m) ? (
                    <video src={m} className="w-full h-full object-cover" />
                  ) : (
                    <Image
                      src={m}
                      alt={`Thumbnail ${idx + 1}`}
                      width={96}
                      height={96}
                      style={{ objectFit: "cover" }}
                      className="rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Info */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{product.title}</h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">{product.description}</p>

            <div className="flex items-center gap-4">
              {product.oldPrice && (
                <span className="line-through text-gray-400 text-xl">PKR {product.oldPrice}</span>
              )}
              <span className="text-red-600 font-bold text-3xl">PKR {product.price}</span>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 p-3 rounded-lg font-bold">
              <FiClock className="w-6 h-6 animate-pulse" />
              <span className="text-sm">Limited time offer! Ends in</span>
              <span className="text-lg">
                {timeLeft.minutes.toString().padStart(2, '0')}:{timeLeft.seconds.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Limited Stock Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="flex items-center gap-2 bg-red-100 text-red-700 p-3 rounded-lg font-bold shadow-sm"
            >
              <FiAlertTriangle className="w-5 h-5" />
              <span className="text-sm">Only a few left! Get yours before they're gone.</span>
            </motion.div>

            {/* New Error Message UI */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center gap-3"
              >
                <FiAlertTriangle className="w-6 h-6" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {/* Variant Selection UI */}
            {uniqueCategories.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-700">Size:</span>
                <div className="flex flex-wrap gap-2">
                  {uniqueCategories.map((category) => (
                    <button
                      key={category}
                      className={`px-4 py-2 rounded-lg transition-colors border-2 ${
                        selectedCategory === category
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
                      }`}
                      onClick={() => {
                          setSelectedCategory(category);
                          setError(null);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

       {uniqueColors.length > 0 && (
  <div className="flex flex-col gap-2">
    <span className="font-semibold text-gray-700">Color:</span>
    <div className="flex flex-wrap gap-2">
      {uniqueColors.map((color) => (
        <button
          key={color}
          className={`px-4 py-2 rounded-lg transition-colors border-2 ${
            selectedColor === color
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300"
          }`}
          onClick={() => {
            setSelectedColor(color);
            setError(null);
          }}
        >
          {color}
        </button>
      ))}
    </div>
  </div>
)}


            {/* Vertical CTA Buttons */}
            <div className="flex flex-col gap-4 mt-4">
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg font-semibold shadow-lg"
                onClick={handleBuyNow}
              >
                <FiCreditCard /> Buy Now
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-500 transition-colors text-lg font-semibold shadow-lg"
                onClick={addToCart}
              >
                <FiShoppingCart /> Add to Cart
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-400 transition-colors text-lg font-semibold shadow-lg"
                onClick={handleWhatsAppOrder}
              >
                <FiMessageSquare /> Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-16">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-2xl text-gray-900">
              Customer Reviews ({reviews.length})
            </h2>
            <button
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
              onClick={() => setShowReviewPopup(true)}
            >
              Add a Review
            </button>
          </div>
          <div className="mt-6 space-y-6">
            {reviews.length === 0 && (
              <p className="text-center text-gray-500 py-4">No reviews yet. Be the first to add one!</p>
            )}
            {reviews.map((r, idx) => (
              <div
                key={idx}
                className="flex flex-col border border-gray-200 rounded-xl p-6 bg-gray-50 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {r.name || r.email}
                  </h4>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg
                        key={s}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 transition-colors ${
                          s <= r.rating ? "fill-yellow-400" : "fill-gray-300"
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(r.date).toLocaleDateString()}
                </p>
                <p className="text-gray-700 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Popup */}
      {showReviewPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-8 relative shadow-xl">
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              Add Your Review
            </h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`cursor-pointer text-4xl transition-colors ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="Write your review here..."
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                onClick={() => {
                    setShowReviewPopup(false);
                    setError(null);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
                onClick={submitReview}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <div
                key={rp.id}
                className="bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-transform transform hover:scale-105"
                onClick={() => router.push(`/products/${rp.id}`)}
              >
                <div className="w-full h-48 relative rounded-lg overflow-hidden">
                  <Image
                    src={rp.images && rp.images[0] ? rp.images[0] : "/placeholder.png"}
                    alt={rp.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-lg"
                  />
                </div>
                <h3 className="font-semibold text-lg mt-4 text-gray-800 truncate">
                  {rp.title}
                </h3>
                <p className="text-red-600 font-bold text-xl mt-1">PKR {rp.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}