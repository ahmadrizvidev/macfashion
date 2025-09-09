"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/router";
import {
    FiCheckCircle,
    FiPackage,
    FiShoppingCart,
    FiCreditCard,
    FiUser,
    FiPhone,
    FiMail,
    FiMapPin,
    FiHome,
    FiAlertCircle,
    FiChevronRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import Image from "next/image";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

// A helper function to generate a short, unique ID
function generateTrackingId() {
    const timestamp = Date.now().toString(36);
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${randomString}`.toUpperCase();
}

// Memoized FormField component to prevent re-rendering
const FormField = memo(({ label, type, name, value, onChange, placeholder, required, icon: Icon }) => (
    <div className="relative group">
        <label className="block text-sm font-medium text-gray-700 mb-1 group-focus-within:text-indigo-600 transition-colors duration-200">
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" aria-hidden="true" />
            </div>
            {type === "textarea" ? (
                <textarea
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    rows="3"
                    className="mt-1 block w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 ease-in-out text-black"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="mt-1 block w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 ease-in-out text-black"
                />
            )}
        </div>
    </div>
));

FormField.displayName = 'FormField';

export default function Checkout() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState([]);
    const [formData, setFormData] = useState({
        fullName: "",
        whatsappNumber: "",
        email: "",
        phoneNumber: "",
        city: "",
        province: "",
        address: "",
        paymentMethod: "COD",
    });
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formError, setFormError] = useState("");
    const [trackingId, setTrackingId] = useState(null);
    const [isBuyNow, setIsBuyNow] = useState(false);

    useEffect(() => {
        let items = JSON.parse(localStorage.getItem("checkoutItems") || "[]");

        if (items.length > 0) {
            setIsBuyNow(true);
        } else {
            items = JSON.parse(localStorage.getItem("cart") || "[]");
            setIsBuyNow(false);
        }

        setCartItems(items);
    }, []);

    const subtotalPKR = cartItems.reduce(
        (acc, item) => acc + item.quantity * parseFloat(item.price),
        0
    );
    const shippingFee = subtotalPKR >= 2500 ? 0 : 220;
    const finalTotalPKR = subtotalPKR + shippingFee;

    const handleChange = useCallback((e) => {
        setFormData(prevFormData => ({
            ...prevFormData,
            [e.target.name]: e.target.value
        }));
        setFormError("");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const requiredFields = ["fullName", "whatsappNumber", "email", "phoneNumber", "city", "province", "address"];
        const allFieldsFilled = requiredFields.every(field => formData[field].trim() !== "");

        if (!allFieldsFilled) {
            setFormError("Please fill out all required fields.");
            return;
        }

        setIsProcessing(true);
        const newTrackingId = generateTrackingId();

        const orderData = {
            customerDetails: formData,
            products: cartItems.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                images: item.images,
                variants: item.variants || [],
                selectedCategory: item.selectedCategory,
                selectedColor: item.selectedColor
            })),
            subtotal: subtotalPKR,
            shipping: shippingFee,
            totalAmount: finalTotalPKR,
            trackingId: newTrackingId,
            status: "Pending",
            createdAt: serverTimestamp(),
        };

        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const ordersCollection = collection(db, `artifacts/${appId}/public/data/orders`);
            await addDoc(ordersCollection, orderData);

            if (isBuyNow) {
                localStorage.removeItem("checkoutItems");
            } else {
                localStorage.removeItem("cart");
            }

            setOrderPlaced(true);
            setTrackingId(newTrackingId);
        } catch (error) {
            console.error("Error placing order:", error);
            setFormError("Failed to place order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white p-12 rounded-xl shadow-xl text-center max-w-lg w-full"
                >
                    <FiCheckCircle className="mx-auto w-24 h-24 text-green-500 mb-6" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Order Placed Successfully!
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">
                        Thank you for your purchase. Your unique tracking ID is:
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-xl md:text-2xl font-semibold text-indigo-600 tracking-wide mb-6">
                        {trackingId}
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Please save this ID to check your order status.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push(`/order-status?id=${trackingId}`)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-500 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                            View Order Status <FiChevronRight />
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <FiShoppingCart className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">
                    Your cart is empty. Please add items before checking out.
                </p>
                <button
                    className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-500 transition-colors font-semibold"
                    onClick={() => router.push("/")}
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-hidden p-6 md:p-12 min-h-screen w-[100vw]">
            <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-900 tracking-tight">
                Checkout
            </h1>
            <div className="flex flex-col md:flex-row gap-8 bg-white p-8 rounded-2xl shadow-xl">
                <div className="w-full md:w-1/2">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                        <FiCreditCard className="text-indigo-600" /> Shipping & Payment
                    </h2>
                    {formError && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center gap-3">
                            <FiAlertCircle className="w-6 h-6" />
                            <p className="font-medium">{formError}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="Full Name"
                                type="text"
                                name="fullName"
                                placeholder="e.g., John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                icon={FiUser}
                            />
                            <FormField
                                label="WhatsApp Number"
                                type="tel"
                                name="whatsappNumber"
                                placeholder="e.g., 03xx-xxxxxxx"
                                value={formData.whatsappNumber}
                                onChange={handleChange}
                                required
                                icon={FiPhone}
                            />
                        </div>
                        <FormField
                            label="Email Address"
                            type="email"
                            name="email"
                            placeholder="e.g., example@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            icon={FiMail}
                        />
                        <FormField
                            label="Phone Number"
                            type="tel"
                            name="phoneNumber"
                            placeholder="e.g., 03xx-xxxxxxx"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                            icon={FiPhone}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                label="City"
                                type="text"
                                name="city"
                                placeholder="e.g., Lahore"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                icon={FiMapPin}
                            />
                            <FormField
                                label="Province"
                                type="text"
                                name="province"
                                placeholder="e.g., Punjab"
                                value={formData.province}
                                onChange={handleChange}
                                required
                                icon={FiMapPin}
                            />
                        </div>
                        <FormField
                            label="Address"
                            type="textarea"
                            name="address"
                            placeholder="e.g., House No. 123, Street 456, DHA Phase 7"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            icon={FiHome}
                        />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Payment Method
                            </h3>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="cod"
                                    name="paymentMethod"
                                    value="COD"
                                    checked={formData.paymentMethod === "COD"}
                                    onChange={handleChange}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="cod" className="ml-2 text-gray-700">
                                    Cash on Delivery
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="w-full md:w-1/2 md:order-last">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-3">
                        <FiPackage className="text-indigo-600" /> Order Summary
                    </h2>
                    <div className="space-y-4 border-b border-gray-200 pb-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                                        <Image
                                            src={item.images?.[0] || "/placeholder.png"}
                                            alt={item.title}
                                            fill
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium truncate">
                                            {item.title}
                                        </p>
                                        {item.selectedCategory && (
                                            <p className="text-gray-500 text-sm">Category: {item.selectedCategory}</p>
                                        )}
                                        {item.selectedColor && (
                                            <p className="text-gray-500 text-sm">Color: {item.selectedColor}</p>
                                        )}
                                        <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <span className="font-semibold text-gray-900">
                                    PKR {(item.quantity * parseFloat(item.price)).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 pt-4 text-gray-700">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">PKR {subtotalPKR.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span className="font-semibold">
                                {shippingFee === 0 ? "Free" : `PKR ${shippingFee}`}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-3">
                            <span>Total:</span>
                            <span className="text-indigo-600">PKR {finalTotalPKR.toFixed(2)}</span>
                        </div>
                    </div>
                    <motion.button
                        onClick={handleSubmit}
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-8 w-full bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-500 transition-colors text-lg font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Processing..." : <><FiCreditCard /> Place Order</>}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
