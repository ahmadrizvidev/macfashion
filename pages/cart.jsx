import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiXCircle,
  FiShoppingCart,
  FiArrowRight,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import Link from "next/link";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
    setLoading(false);
  }, []);

  const updateQuantity = (id, newQuantity, selectedCategory, selectedColor) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const itemIndex = cart.findIndex(
      (item) =>
        item.id === id &&
        item.selectedCategory === selectedCategory &&
        item.selectedColor === selectedColor
    );

    if (itemIndex !== -1) {
      if (newQuantity <= 0) {
        cart.splice(itemIndex, 1);
      } else {
        cart[itemIndex].quantity = newQuantity;
      }
      setCartItems(cart);
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  };

  const removeItem = (id, selectedCategory, selectedColor) => {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = cart.filter(
      (item) =>
        !(
          item.id === id &&
          item.selectedCategory === selectedCategory &&
          item.selectedColor === selectedColor
        )
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    router.push("/checkout");
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 lg:py-12 min-h-screen">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
        Your Cart 🛒
      </h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl text-center"
        >
          <FiShoppingCart className="w-24 h-24 text-gray-300 mb-6" />
          <p className="text-xl text-gray-600 mb-4 font-semibold">
            Your cart is currently empty.
          </p>
          <p className="text-md text-gray-500 mb-6">
            Explore our products and find something you love!
          </p>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 font-bold group"
          >
            Start Shopping
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.selectedCategory}-${item.selectedColor}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col md:flex-row items-center gap-4 p-4 border rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        item.images && item.images[0]
                          ? item.images[0]
                          : "/placeholder.png"
                      }
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 112px, 128px"
                      style={{ objectFit: "cover" }}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      {item.selectedCategory && `Category: ${item.selectedCategory}`}
                      {item.selectedCategory && item.selectedColor && ` | `}
                      {item.selectedColor && `Color: ${item.selectedColor}`}
                    </p>
                    <p className="text-2xl font-extrabold text-indigo-600 mt-2">
                      PKR {item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1,
                          item.selectedCategory,
                          item.selectedColor
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity + 1,
                          item.selectedCategory,
                          item.selectedColor
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      removeItem(
                        item.id,
                        item.selectedCategory,
                        item.selectedColor
                      )
                    }
                    className="mt-4 md:mt-0 md:ml-4 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <FiXCircle className="w-6 h-6" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full lg:w-auto bg-white rounded-3xl shadow-xl p-6 sticky top-8 h-fit"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">
              Order Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between font-medium text-gray-700">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>PKR {calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-gray-700">
                <span>Shipping</span>
                <span>PKR 0</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center font-bold text-2xl text-gray-900">
                <span>Total</span>
                <span>PKR {calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
            >
              Proceed to Checkout
            </button>
            <Link
              href="/"
              className="mt-4 block text-center text-sm text-indigo-600 hover:underline"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}