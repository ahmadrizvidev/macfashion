"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trackAddToCart } from "../lib/fbpixel";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("cart", JSON.stringify(cartItems));
        // Trigger real-time updates across components
        setCartUpdateTrigger(prev => prev + 1);
        
        // Dispatch custom event for cross-component updates
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { 
              cartItems, 
              itemCount: cartItems.reduce((total, item) => total + item.quantity, 0),
              total: cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
            } 
          }));
        }
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [cartItems, isLoading]);

  // Real-time cart sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart" && e.newValue) {
        try {
          const newCart = JSON.parse(e.newValue);
          setCartItems(newCart);
        } catch (error) {
          console.error("Error syncing cart from storage:", error);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  const addToCart = (product, options = {}) => {
    const { 
      quantity = 1, 
      selectedCategory = null, 
      selectedColor = null,
      redirect = false 
    } = options;

    // Validate product
    if (!product || !product.id) {
      console.error("Invalid product data:", { product, hasId: !!product?.id });
      return false;
    }

    console.log("CartContext: Adding product to cart:", {
      productId: product.id,
      productTitle: product.title,
      quantity,
      selectedCategory,
      selectedColor
    });

    // Create a unique product with variants
    const productWithVariants = {
      ...product,
      quantity,
      selectedCategory,
      selectedColor,
      cartId: `${product.id}-${selectedCategory || 'default'}-${selectedColor || 'default'}`,
    };

    return new Promise((resolve) => {
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(
          item => item.cartId === productWithVariants.cartId
        );

        let updatedItems;
        if (existingItemIndex !== -1) {
          // Update existing item quantity
          updatedItems = [...prevItems];
          updatedItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          updatedItems = [...prevItems, productWithVariants];
        }

        // FB Pixel tracking (async to prevent blocking)
        setTimeout(() => {
          try {
            if (typeof trackAddToCart === 'function') {
              trackAddToCart(productWithVariants, quantity, selectedCategory, selectedColor);
            }

            if (typeof window !== "undefined" && window.fbq) {
              window.fbq("track", "AddToCart", {
                content_name: product.title,
                content_ids: [product.id],
                content_type: "product",
                value: product.price * quantity,
                currency: "PKR",
                quantity,
                category: selectedCategory,
                color: selectedColor,
              });
            }
          } catch (error) {
            console.error("Tracking error:", error);
          }
        }, 0);

        return updatedItems;
      });

      // Redirect to cart if specified
      if (redirect && typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/cart";
        }, 500);
      }

      resolve(true);
    });
  };

  const removeFromCart = (cartId) => {
    return new Promise((resolve) => {
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter(item => item.cartId !== cartId);
        
        // Trigger real-time updates
        setTimeout(() => {
          try {
            if (typeof window !== "undefined" && window.fbq) {
              window.fbq("track", "RemoveFromCart", {
                content_type: "product",
                currency: "PKR",
              });
            }
          } catch (error) {
            console.error("Tracking error:", error);
          }
        }, 0);
        
        return updatedItems;
      });
      resolve(true);
    });
  };

  const updateQuantity = (cartId, newQuantity) => {
    return new Promise((resolve) => {
      if (newQuantity <= 0) {
        removeFromCart(cartId).then(() => resolve(true));
        return;
      }

      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          item.cartId === cartId ? { ...item, quantity: newQuantity } : item
        );
        
        // Trigger real-time updates
        setTimeout(() => {
          try {
            if (typeof window !== "undefined" && window.fbq) {
              window.fbq("track", "UpdateCart", {
                content_type: "product",
                currency: "PKR",
              });
            }
          } catch (error) {
            console.error("Tracking error:", error);
          }
        }, 0);
        
        return updatedItems;
      });
      resolve(true);
    });
  };

  const clearCart = () => {
    return new Promise((resolve) => {
      setCartItems([]);
      
      // Trigger real-time updates
      setTimeout(() => {
        try {
          if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "ClearCart", {
              content_type: "product",
              currency: "PKR",
            });
          }
        } catch (error) {
          console.error("Tracking error:", error);
        }
      }, 0);
      
      resolve(true);
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId, selectedCategory = null, selectedColor = null) => {
    const cartId = `${productId}-${selectedCategory || 'default'}-${selectedColor || 'default'}`;
    return cartItems.some(item => item.cartId === cartId);
  };

  const getItemQuantity = (productId, selectedCategory = null, selectedColor = null) => {
    const cartId = `${productId}-${selectedCategory || 'default'}-${selectedColor || 'default'}`;
    const item = cartItems.find(item => item.cartId === cartId);
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isInCart,
    getItemQuantity,
    cartUpdateTrigger, // For triggering re-renders
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
