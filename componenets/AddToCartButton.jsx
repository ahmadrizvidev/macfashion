"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaCheck, FaSpinner, FaPlus, FaMinus } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const AddToCartButton = ({ 
  product, 
  selectedCategory = null, 
  selectedColor = null,
  quantity = 1,
  variant = "default", // "default", "compact", "floating"
  redirect = false,
  disabled = false,
  className = "",
  showQuantityControls = false,
  onAddSuccess = null,
  onAddError = null
}) => {
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(quantity);
  const [lastClickTime, setLastClickTime] = useState(0);

  const cartId = `${product?.id}-${selectedCategory || 'default'}-${selectedColor || 'default'}`;
  const itemInCart = isInCart(product?.id, selectedCategory, selectedColor);
  const cartQuantity = getItemQuantity(product?.id, selectedCategory, selectedColor);

  useEffect(() => {
    setCurrentQuantity(quantity);
  }, [quantity]);

  const handleAddToCart = async (e) => {
    // Prevent event propagation and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Enhanced debounce: prevent rapid clicking (1000ms delay)
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      console.log("Add to cart blocked - too soon");
      return;
    }
    setLastClickTime(now);

    if (!product || isAdding || disabled) {
      console.log("Add to cart blocked:", { 
        hasProduct: !!product, 
        isAdding, 
        disabled,
        productId: product?.id,
        productTitle: product?.title 
      });
      return;
    }

    console.log("Adding to cart:", {
      productId: product.id,
      productTitle: product.title,
      quantity: currentQuantity,
      selectedCategory,
      selectedColor
    });

    setIsAdding(true);
    
    try {
      const success = await addToCart(product, {
        quantity: currentQuantity,
        selectedCategory,
        selectedColor,
        redirect: false // Always stay on page
      });

      if (success) {
        setShowSuccess(true);
        if (onAddSuccess) onAddSuccess();
        
        // Reset success state after animation
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (onAddError) onAddError(error);
    } finally {
      // Longer delay to prevent rapid clicking
      setTimeout(() => {
        setIsAdding(false);
      }, 800);
    }
  };

  const handleQuantityChange = (newQuantity, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (newQuantity < 1) return;
    setCurrentQuantity(newQuantity);
  };

  const handleUpdateCartQuantity = (newQuantity, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (newQuantity <= 0) {
      updateQuantity(cartId, 0); // This will remove the item
    } else {
      updateQuantity(cartId, newQuantity);
    }
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          button: "px-3 py-2 text-sm rounded-lg",
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
          button: "px-6 py-3 text-base rounded-xl",
          icon: "text-base",
          text: "text-base font-medium"
        };
    }
  };

  const styles = getVariantStyles();

  if (!product) return null;

  // If item is in cart and we want to show quantity controls
  if (itemInCart && showQuantityControls) {
    return (
      <motion.div 
        className={`flex items-center gap-3 ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center bg-white border-2 border-indigo-500 rounded-lg overflow-hidden">
          <button
            onClick={(e) => handleUpdateCartQuantity(cartQuantity - 1, e)}
            className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
            disabled={cartQuantity <= 1}
          >
            <FaMinus className="text-sm" />
          </button>
          
          <span className="px-4 py-2 text-lg font-semibold text-indigo-600 min-w-[3rem] text-center">
            {cartQuantity}
          </span>
          
          <button
            onClick={(e) => handleUpdateCartQuantity(cartQuantity + 1, e)}
            className="px-3 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>
        
        <motion.div
          className="flex items-center gap-2 text-green-600 font-medium"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <FaCheck className="text-green-500" />
          <span className="text-sm">In Cart</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Quantity Controls (if enabled and not in cart) */}
      {showQuantityControls && !itemInCart && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-sm text-gray-600">Qty:</span>
          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={(e) => handleQuantityChange(currentQuantity - 1, e)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-200 transition-colors"
              disabled={currentQuantity <= 1}
            >
              <FaMinus className="text-xs" />
            </button>
            
            <span className="px-3 py-1 text-sm font-medium min-w-[2.5rem] text-center">
              {currentQuantity}
            </span>
            
            <button
              onClick={(e) => handleQuantityChange(currentQuantity + 1, e)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <motion.button
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        className={`
          ${styles.button} ${styles.text}
          relative overflow-hidden font-medium
          bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
          hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
          text-white border-0 
          transform transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25
          disabled:opacity-50 disabled:cursor-not-allowed 
          disabled:transform-none disabled:shadow-none
          focus:outline-none focus:ring-4 focus:ring-indigo-300/50
          active:scale-95
          backdrop-blur-sm
          before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-transparent before:via-white/10 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%]
          before:transition-transform before:duration-700
        `}
        whileHover={{ 
          scale: disabled ? 1 : 1.05,
          boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.25)"
        }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
          initial={{ x: "-100%" }}
          animate={{ x: showSuccess ? "0%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />

        {/* Button Content */}
        <span className="relative flex items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaSpinner className={`${styles.icon} animate-spin`} />
                <span>Adding...</span>
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
                <span>Added!</span>
              </motion.div>
            ) : itemInCart ? (
              <motion.div
                key="in-cart"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaCheck className={`${styles.icon}`} />
                <span>Add More</span>
              </motion.div>
            ) : (
              <motion.div
                key="add"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaShoppingCart className={`${styles.icon}`} />
                <span>Add to Cart</span>
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
              ✓ Added to cart!
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
            className="text-center text-sm text-green-600 font-medium"
          >
            ✓ Item added to cart successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddToCartButton;
