"use client";

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
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart,
  FiCreditCard,
  FiMessageSquare,
  FiClock,
  FiAlertTriangle,
  FiStar,
  FiX,
} from "react-icons/fi";
import AddToCartButton from "../../componenets/AddToCartButton";
import BuyNowButton from "../../componenets/BuyNowButton";

// FB Pixel functions
import {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
} from "../../lib/fbpixel";

// Meta Pixel (Global site tag)
const metaPixelScript = () => {
  if (typeof window !== "undefined" && !window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = "https://connect.facebook.net/en_US/fbevents.js";
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script");
    window.fbq("init", "1715629979139193"); // Your Pixel ID
    window.fbq("track", "PageView");
  }
};

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
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  function calculateTimeLeft() {
    const now = new Date();
    const future = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + 1,
      0,
      0
    );
    const difference = future - now;

    if (difference > 0) {
      return {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      return { minutes: 0, seconds: 0 };
    }
  }

  // Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  // Initialize Meta Pixel and fetch product
  useEffect(() => {
    metaPixelScript();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const prodData = docSnap.data();
          // Add the id to the product data
          setProduct({ ...prodData, id });
          if (prodData.collection) fetchRelatedProducts(prodData.collection);
          fetchReviews(id);

          // FB Pixel ViewContent
          trackViewContent({ ...prodData, id });
          if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "ViewContent", {
              content_name: prodData.title,
              content_ids: [id],
              content_type: "product",
              value: prodData.price,
              currency: "PKR",
            });
          }
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

  const fetchRelatedProducts = async (collectionName) => {
    if (!collectionName) return;
    try {
      setRelatedProductsLoading(true);
      const q = query(
        collection(db, "products"),
        where("collection", "==", collectionName)
      );
      const querySnapshot = await getDocs(q);
      const related = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.id !== id)
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (err) {
      console.error("Failed to fetch related products:", err);
    } finally {
      setRelatedProductsLoading(false);
    }
  };

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

  // WhatsApp order
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

  const uniqueCategories =
    product.variants?.length > 0
      ? [...new Set(product.variants.map((v) => v.size || "Default"))]
      : [];
  const uniqueColors =
    product.variants?.length > 0
      ? [...new Set(product.variants.map((v) => v.color).filter((c) => c))]
      : [];

  const media = [
    ...(product.images?.length > 0 ? product.images : ["/placeholder.png"]),
    ...(product.video ? [product.video] : []),
  ];

  const isVideo = (src) =>
    src.endsWith(".mp4") || (src.startsWith("https://") && src.includes("youtube"));

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Product top section */}
      <div className="bg-white pt-6 pb-12 shadow-sm md:shadow-lg rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-10">
          {/* Media gallery */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <div className="w-full h-auto min-h-[400px] aspect-video relative rounded-xl overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
              {isVideo(media[selectedMediaIndex]) ? (
                <video
                  src={media[selectedMediaIndex]}
                  controls
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <motion.div
                        className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    </div>
                  )}
                  <Image
                    src={media[selectedMediaIndex]}
                    alt={product.title}
                    fill
                    style={{ objectFit: "contain" }}
                    className={`rounded-xl transition-opacity duration-500 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    placeholder="blur"
                    blurDataURL="/placeholder.png"
                    onLoadingComplete={() => setImageLoaded(true)}
                  />
                </>
              )}
            </div>
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

          {/* Product details */}
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {product.title}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {product.description}
            </p>
            <div className="flex items-center gap-4">
              {product.oldPrice && (
                <span className="line-through text-gray-400 text-xl">
                  PKR {product.oldPrice}
                </span>
              )}
              <span className="text-red-600 font-bold text-3xl">
                PKR {product.price}
              </span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 p-3 rounded-lg font-bold">
              <FiClock className="w-6 h-6 animate-pulse" />
              <span className="text-sm">Limited time offer! Ends in</span>
              <span className="text-lg">
                {timeLeft.minutes.toString().padStart(2, "0")}:
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Stock alert */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="flex items-center gap-2 bg-red-100 text-red-700 p-3 rounded-lg font-bold shadow-sm"
            >
              <FiAlertTriangle className="w-5 h-5" />
              <span className="text-sm">
                Only a few left! Get yours before they're gone.
              </span>
            </motion.div>

            {/* Error message */}
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

            {/* Variants */}
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

            {/* Action buttons */}
            <div className="flex flex-col gap-4 mt-4">
              <BuyNowButton
                product={product}
                selectedCategory={selectedCategory}
                selectedColor={selectedColor}
                variant="default"
                showQuantityControls={true}
                className="flex-1"
                onBuyNowSuccess={() => {
                  console.log("Buy now successful!");
                  setError(null); // Clear any previous errors
                }}
                onBuyNowError={(error) => {
                  setError("Failed to process buy now. Please try again.");
                  console.error("Buy now error:", error);
                }}
              />
              <AddToCartButton
                product={product}
                selectedCategory={selectedCategory}
                selectedColor={selectedColor}
                variant="default"
                redirect={false}
                className="flex-1"
                onAddSuccess={() => {
                  // Optional: Show success message or redirect
                  console.log("Product added to cart successfully!");
                  setError(null); // Clear any previous errors
                }}
                onAddError={(error) => {
                  setError("Failed to add product to cart. Please try again.");
                  console.error("Add to cart error:", error);
                }}
              />
              
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-0">
                </div>
              )}
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

      {/* Reviews section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-16">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-2xl text-gray-900">Reviews</h2>
            <button
              className="text-indigo-600 font-semibold hover:underline"
              onClick={() => setShowReviewPopup(true)}
            >
              Add Review
            </button>
          </div>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="border-b border-gray-200 pb-4 last:border-none"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <FiStar key={i} className="text-yellow-500" />
                    ))}
                    {[...Array(5 - rev.rating)].map((_, i) => (
                      <FiStar key={i} className="text-gray-300" />
                    ))}
                  </div>
                  <p className="text-gray-700">{rev.comment}</p>
                  <span className="text-gray-400 text-sm">{rev.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-20">
        <h3 className="text-2xl font-bold mb-6 text-gray-900">
          Related Products
        </h3>
        
        {relatedProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => {
                  // Show loading state before navigation
                  setRelatedProductsLoading(true);
                  router.push(`/product/${p.id}`);
                }}
              >
                <div className="w-full aspect-square relative rounded-lg overflow-hidden">
                  <Image
                    src={p.images?.[0] || "/placeholder.png"}
                    alt={p.title}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <h4 className="mt-2 font-semibold text-gray-800">{p.title}</h4>
                <p className="text-red-600 font-bold">PKR {p.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No related products found.</p>
          </div>
        )}
      </div>

      {/* Review popup */}
      <AnimatePresence>
        {showReviewPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-xl p-6 md:p-8 w-full max-w-md relative"
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowReviewPopup(false)}
              >
                <FiX className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Add a Review
              </h3>
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <FiStar
                    key={i}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                      i <= rating ? "text-yellow-500" : "text-gray-300"
                    }`}
                    onClick={() => setRating(i)}
                  />
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
              />
              <button
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold w-full hover:bg-indigo-500 transition-colors"
                onClick={submitReview}
              >
                Submit Review
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
