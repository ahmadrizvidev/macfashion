"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaCheck, FaSpinner, FaCreditCard } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const CheckoutButton = ({ 
  variant = "default", // "default", "floating", "compact"
  disabled = false,
  className = "",
  onCheckoutSuccess = null,
  onCheckoutError = null
}) => {
  const { cartItems, getCartTotal, getCartItemsCount, isLoading } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const totalItems = getCartItemsCount();
  const totalAmount = getCartTotal();

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          button: "px-4 py-2 text-sm rounded-lg",
          icon: "text-sm",
          text: "text-sm"
        };
      case "floating":
        return {
          button: "px-6 py-4 text-base rounded-full shadow-lg hover:shadow-xl",
          icon: "text-lg",
          text: "text-base font-semibold"
        };
      default:
        return {
          button: "px-8 py-4 text-lg rounded-xl",
          icon: "text-lg",
          text: "text-lg font-semibold"
        };
    }
  };

  const styles = getVariantStyles();

  const handleCheckout = async (e) => {
    // Prevent event propagation and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Enhanced debounce: prevent rapid clicking (1000ms delay)
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      console.log("Checkout blocked - too soon");
      return;
    }
    setLastClickTime(now);

    if (!cartItems || cartItems.length === 0 || isProcessing || disabled) {
      console.log("Checkout blocked:", { 
        hasItems: cartItems?.length > 0, 
        isProcessing, 
        disabled,
        itemCount: cartItems?.length 
      });
      return;
    }

    console.log("Processing checkout:", {
      itemCount: cartItems.length,
      totalAmount,
      totalItems
    });

    setIsProcessing(true);
    
    try {
      // Store all cart items for checkout
      localStorage.setItem("checkoutItems", JSON.stringify(cartItems));

      // FB Pixel InitiateCheckout
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "InitiateCheckout", {
          content_type: "product",
          value: totalAmount,
          currency: "PKR",
          num_items: totalItems,
        });
      }

      setShowSuccess(true);
      if (onCheckoutSuccess) onCheckoutSuccess();
      
      // Navigate to checkout after a brief delay
      setTimeout(() => {
        router.push("/checkout");
      }, 500);

    } catch (error) {
      console.error("Error processing checkout:", error);
      if (onCheckoutError) onCheckoutError(error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(false);
      }, 1000);
    }
  };

  // Don't render if no items in cart
  if (!cartItems || cartItems.length === 0 || isLoading) {
    return null;
  }

  return (
    <motion.div
      className={`${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cart Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <FaShoppingCart className="text-indigo-600" />
            <span>{totalItems} item{totalItems !== 1 ? 's' : ''} in cart</span>
          </span>
          <span className="font-semibold text-indigo-800">
            Total: PKR {totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <motion.button
        onClick={handleCheckout}
        disabled={disabled || isProcessing}
        className={`
          ${styles.button} ${styles.text}
          relative overflow-hidden font-medium
          bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600
          hover:from-green-700 hover:via-emerald-700 hover:to-teal-700
          text-white border-0 
          transform transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-xl hover:shadow-green-500/25
          disabled:opacity-50 disabled:cursor-not-allowed 
          disabled:transform-none disabled:shadow-none
          focus:outline-none focus:ring-4 focus:ring-green-300/50
          active:scale-95
          backdrop-blur-sm
          before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-transparent before:via-white/10 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%]
          before:transition-transform before:duration-700
          w-full
        `}
        whileHover={{ 
          scale: disabled ? 1 : 1.05,
          boxShadow: "0 20px 25px -5px rgba(34, 197, 94, 0.25)"
        }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"
          initial={{ x: "-100%" }}
          animate={{ x: showSuccess ? "0%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />

        {/* Button Content */}
        <span className="relative flex items-center justify-center gap-3">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaSpinner className={`${styles.icon} animate-spin`} />
                <span>Processing...</span>
              </motion.div>
            ) : showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaCheck className={`${styles.icon} text-white`} />
                <span>Redirecting...</span>
              </motion.div>
            ) : (
              <motion.div
                key="checkout"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaCreditCard className={`${styles.icon}`} />
                <span>Proceed to Checkout</span>
              </motion.div>
            )}
          </AnimatePresence>
        </span>

        {/* Ripple Effect */}
        <motion.div
          className="absolute inset-0 bg-white opacity-0 rounded-xl"
          animate={{
            scale: showSuccess ? [0, 2] : 0,
            opacity: showSuccess ? [0.3, 0] : 0,
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Floating success animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              ✓ Redirecting to checkout!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center text-sm text-green-600 font-medium mt-2"
          >
            ✓ Redirecting to checkout...
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CheckoutButton;
