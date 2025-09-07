"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { FiX, FiMinus, FiPlus, FiHeart } from "react-icons/fi";
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

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const shipping = cartItems.length > 0 ? 270 : 0;
  const tax = cartItems.length > 0 ? 0 : 0;
  const total = calculateSubtotal() + shipping + tax;

  const handleCheckout = () => {
    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow text-center">
          <p className="text-lg text-gray-600 mb-3">Your cart is empty</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={`Rs.{item.id}-Rs.{item.selectedCategory}-Rs.{item.selectedColor}-Rs.{index}`}
                className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white rounded-lg p-5 shadow border border-gray-100"
              >
                {/* Image */}
                <div className="relative w-28 h-28 rounded-md overflow-hidden bg-gray-100">
                  <Image
                    src={item.images?.[0] || "/placeholder.png"}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.selectedColor && (
                      <span className="flex items-center gap-1">
                        Color:
                        <span
                          className="inline-block w-4 h-4 rounded-full border"
                          style={{ backgroundColor: item.selectedColor }}
                        ></span>
                      </span>
                    )}
                  </p>
                  <p className="text-gray-900 font-bold mt-2">
                    Rs.{item.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity */}
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
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-8 text-center font-semibold">
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
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    <FiPlus />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 ml-auto">
               
                  <button
                    onClick={() =>
                      removeItem(
                        item.id,
                        item.selectedCategory,
                        item.selectedColor
                      )
                    }
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg p-6 shadow border border-gray-100 h-fit">
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs.{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Rs.{shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>Rs.{tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>Rs.{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-6 w-full bg-gray-900 text-white py-3 rounded-md font-semibold hover:bg-gray-800 transition"
            >
              Buy Now
            </button>
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-gray-700 border border-gray-300 py-3 rounded-md hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>

            {/* Payment Icons */}
        
          </div>
        </div>
      )}
    </div>
  );
}
