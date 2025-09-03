// components/cart.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FiXCircle, FiShoppingCart, FiArrowRight } from "react-icons/fi";
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
    <div className="max-w-7xl mx-auto p-6 md:p-12 min-h-screen flex flex-col">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Cart</h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg text-center"
        >
          <FiShoppingCart className="w-24 h-24 text-gray-300 mb-6" />
          <p className="text-xl text-gray-600 mb-4">
            Your cart is currently empty.
          </p>
          <Link
            href="/"
            className="text-indigo-600 hover:underline flex items-center gap-2 font-semibold"
          >
            Start Shopping <FiArrowRight />
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="flex-grow bg-white rounded-xl shadow-lg p-6 space-y-6">
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.selectedCategory}-${item.selectedColor}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={
                        item.images && item.images[0]
                          ? item.images[0]
                          : "/placeholder.png"
                      }
                      alt={item.title}
                      fill
                      sizes="96px"
                      style={{ objectFit: "cover" }}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                      PKR {item.price.toLocaleString()}
                    </p>
                    {/* Display selected variants */}
                    {(item.selectedCategory || item.selectedColor) && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        {item.selectedCategory && (
                          <span>Category: {item.selectedCategory}</span>
                        )}
                        {item.selectedCategory && item.selectedColor && <span> | </span>}
                        {item.selectedColor && (
                          <span>Color: {item.selectedColor}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity - 1,
                          item.selectedCategory,
                          item.selectedColor
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-medium">
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
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      +
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
                    className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
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
            className="w-full lg:w-1/3 bg-white rounded-xl shadow-lg p-6 sticky top-8 h-fit"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
              className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-500 transition-colors font-semibold text-lg"
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