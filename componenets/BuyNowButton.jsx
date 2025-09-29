"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaCheck, FaSpinner, FaPlus, FaMinus, FaCreditCard } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { trackInitiateCheckout } from "../lib/fbpixel";

const BuyNowButton = ({ 
  product, 
  selectedCategory = null, 
  selectedColor = null,
  quantity = 1,
  variant = "default", // "default", "compact", "floating"
  disabled = false,
  className = "",
  showQuantityControls = true, // Enable quantity controls by default
  onBuyNowSuccess = null,
  onBuyNowError = null
}) => {
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(quantity);
  const [lastClickTime, setLastClickTime] = useState(0);

  const cartId = `${product?.id}-${selectedCategory || 'default'}-${selectedColor || 'default'}`;
  const itemInCart = isInCart(product?.id, selectedCategory, selectedColor);
  const cartQuantity = getItemQuantity(product?.id, selectedCategory, selectedColor);

  useEffect(() => {
    setCurrentQuantity(quantity);
  }, [quantity]);

  const handleBuyNow = async (e) => {
    // Prevent event propagation and default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Enhanced debounce: prevent rapid clicking (1000ms delay)
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      console.log("Buy now blocked - too soon");
      return;
    }
    setLastClickTime(now);

    if (!product || isProcessing || disabled) {
      console.log("Buy now blocked:", { 
        hasProduct: !!product, 
        isProcessing, 
        disabled,
        productId: product?.id,
        productTitle: product?.title 
      });
      return;
    }

    console.log("Processing buy now:", {
      productId: product.id,
      productTitle: product.title,
      quantity: currentQuantity,
      selectedCategory,
      selectedColor,
      itemInCart
    });

    setIsProcessing(true);
    
    try {
      // Always add/update the product in cart first
      const success = await addToCart(product, {
        quantity: currentQuantity,
        selectedCategory,
        selectedColor,
        redirect: false
      });

      if (!success) {
        throw new Error("Failed to add product to cart");
      }

      // Check if this is a "BUY NOW" action (product already in cart) or "ADD TO CART" (new product)
      const updatedCartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      const wasItemInCart = itemInCart;
      
      setShowSuccess(true);
      if (onBuyNowSuccess) onBuyNowSuccess();
      
      // Only redirect to checkout if this was a "BUY NOW" action (item was already in cart)
      if (wasItemInCart) {
        setTimeout(() => {
          const allCartItems = JSON.parse(localStorage.getItem("cart") || "[]");
          
          if (allCartItems.length > 0) {
            // Store all cart items for checkout
            localStorage.setItem("checkoutItems", JSON.stringify(allCartItems));

            // FB Pixel InitiateCheckout
            if (typeof window !== "undefined" && window.fbq) {
              const totalValue = allCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
              const totalItems = allCartItems.reduce((total, item) => total + item.quantity, 0);
              
              window.fbq("track", "InitiateCheckout", {
                content_type: "product",
                value: totalValue,
                currency: "PKR",
                num_items: totalItems,
              });
            }

            // Navigate to checkout
            router.push("/checkout");
          }
        }, 500);
      }
      // If it was "ADD TO CART" (new item), just stay on page - no redirect

    } catch (error) {
      console.error("Error processing buy now:", error);
      if (onBuyNowError) onBuyNowError(error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(false);
      }, 1000);
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

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Quantity Controls - Always show for better UX */}
      {showQuantityControls && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            {itemInCart && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                In Cart ({cartQuantity})
              </span>
            )}
          </div>
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={(e) => handleQuantityChange(currentQuantity - 1, e)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentQuantity <= 1}
            >
              <FaMinus className="text-xs" />
            </button>
            
            <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center border-x border-gray-300">
              {currentQuantity}
            </span>
            
            <button
              onClick={(e) => handleQuantityChange(currentQuantity + 1, e)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Buy Now Button */}
      <motion.button
        onClick={handleBuyNow}
        disabled={disabled || isProcessing}
        className={`
          ${styles.button} ${styles.text}
          relative overflow-hidden font-medium
          ${itemInCart 
            ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700' 
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700'
          }
          text-white border-0 
          transform transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-xl ${itemInCart ? 'hover:shadow-green-500/25' : 'hover:shadow-indigo-500/25'}
          disabled:opacity-50 disabled:cursor-not-allowed 
          disabled:transform-none disabled:shadow-none
          focus:outline-none focus:ring-4 ${itemInCart ? 'focus:ring-green-300/50' : 'focus:ring-indigo-300/50'}
          active:scale-95
          backdrop-blur-sm
          before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-transparent before:via-white/10 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%]
          before:transition-transform before:duration-700
        `}
        whileHover={{ 
          scale: disabled ? 1 : 1.05,
          boxShadow: itemInCart 
            ? "0 20px 25px -5px rgba(34, 197, 94, 0.25)" 
            : "0 20px 25px -5px rgba(99, 102, 241, 0.25)"
        }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Animation */}
        <motion.div
          className={`absolute inset-0 ${itemInCart ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}
          initial={{ x: "-100%" }}
          animate={{ x: showSuccess ? "0%" : "-100%" }}
          transition={{ duration: 0.5 }}
        />

        {/* Button Content */}
        <span className="relative flex items-center justify-center gap-2">
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
                <span>{itemInCart ? 'Processing...' : 'Adding...'}</span>
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
                <span>{itemInCart ? 'Redirecting...' : 'Added!'}</span>
              </motion.div>
            ) : itemInCart ? (
              <motion.div
                key="buy-now"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaCreditCard className={`${styles.icon}`} />
                <span>Buy Now ({currentQuantity})</span>
              </motion.div>
            ) : (
              <motion.div
                key="add-to-cart"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <FaShoppingCart className={`${styles.icon}`} />
                <span>Add to Cart ({currentQuantity})</span>
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
              ✓ {itemInCart ? 'Redirecting to checkout!' : 'Added to cart!'}
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
            ✓ {itemInCart ? 'Redirecting to checkout...' : 'Added to cart successfully!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyNowButton;
