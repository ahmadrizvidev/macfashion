"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const CartManager = ({ 
  variant = "default", // "default", "compact", "floating"
  className = "",
  onCheckout = null
}) => {
  const { cartItems, getCartTotal, getCartItemsCount, updateQuantity, removeFromCart } = useCart();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = getCartItemsCount();
  const totalAmount = getCartTotal();

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "compact":
        return {
          container: "p-3",
          button: "px-3 py-2 text-sm",
          item: "p-2",
          text: "text-sm"
        };
      case "floating":
        return {
          container: "p-6",
          button: "px-6 py-4 text-base",
          item: "p-4",
          text: "text-base"
        };
      default:
        return {
          container: "p-4",
          button: "px-6 py-3 text-base",
          item: "p-3",
          text: "text-base"
        };
    }
  };

  const styles = getVariantStyles();

  // Don't render if no items in cart
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const handleQuantityUpdate = (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId);
    } else {
      updateQuantity(cartId, newQuantity);
    }
  };

  const handleRemoveItem = (cartId) => {
    removeFromCart(cartId);
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout(cartItems);
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cart Header */}
      <div className={`${styles.container} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaShoppingCart className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Your Cart</h3>
              <p className="text-sm text-gray-600">
                {totalItems} item{totalItems !== 1 ? 's' : ''} • PKR {totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.cartId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${styles.item} border-b border-gray-100 last:border-none flex items-center gap-3`}
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>PKR {item.price}</span>
                      {item.selectedCategory && (
                        <span>• {item.selectedCategory}</span>
                      )}
                      {item.selectedColor && (
                        <span>• {item.selectedColor}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuantityUpdate(item.cartId, item.quantity - 1)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <FaMinus className="w-3 h-3 text-gray-600" />
                    </button>
                    
                    <span className="px-2 py-1 text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleQuantityUpdate(item.cartId, item.quantity + 1)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <FaPlus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.cartId)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                  >
                    <FaTrash className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Checkout Button */}
            <div className={`${styles.container} border-t border-gray-200`}>
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Proceed to Checkout (PKR {totalAmount.toLocaleString()})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed State - Quick Checkout */}
      {!isExpanded && (
        <div className={`${styles.container} border-t border-gray-200`}>
          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Proceed to Checkout (PKR {totalAmount.toLocaleString()})
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CartManager;
