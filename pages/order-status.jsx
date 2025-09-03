"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FiTruck,
  FiCheckCircle,
  FiPackage,
  FiXCircle,
  FiSearch,
  FiAlertCircle,
  FiUser,
  FiMapPin,
  FiPhone,
  FiMail,
  FiBox,
  FiShoppingCart 
} from "react-icons/fi";
import { motion } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import Image from "next/image";

const statusSteps = [
  { status: "Pending", icon: FiShoppingCart, color: "text-gray-400" },
  { status: "Processing", icon: FiPackage, color: "text-blue-500" },
  { status: "Ready for Packed", icon: FiBox, color: "text-purple-500" },
  { status: "Ready for Shipping", icon: FiTruck, color: "text-indigo-500" },
  { status: "Shipped", icon: FiCheckCircle, color: "text-green-500" },
];

export default function OrderStatus() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    // Check if a tracking ID is in the URL query
    const id = router.query.id;
    if (id) {
      setTrackingId(id);
      fetchOrder(id);
    }
  }, [router.query.id]);

  const fetchOrder = async (id) => {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const ordersCollection = collection(db, `artifacts/${appId}/public/data/orders`);
      const q = query(ordersCollection, where("trackingId", "==", id.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Order not found. Please check your tracking ID.");
      } else {
        const orderData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setOrder(orderData);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("An error occurred while fetching your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trackingId) {
      // Navigate to the same page with the tracking ID in the URL
      router.push(`/order-status?id=${trackingId}`);
    }
  };
  
  const getStatusIndex = (currentStatus) => {
    return statusSteps.findIndex(step => step.status === currentStatus);
  };

  const currentStatusIndex = getStatusIndex(order?.status);
  const isCancelled = order?.status === "Cancelled";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 md:p-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Track Your Order
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter your tracking ID"
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.964l3-2.673z"></path>
              </svg>
            ) : (
              <>
                <FiSearch /> Search
              </>
            )}
          </button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin text-indigo-600 h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.964l3-2.673z"></path>
            </svg>
            <p className="text-lg text-gray-600 font-medium">Fetching order details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg mb-8 flex items-center gap-4">
            <FiAlertCircle className="w-8 h-8 flex-shrink-0" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        )}

        {order && (
          <div className="space-y-8">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-indigo-700">Order #{order.id.substring(0, 8)}</h2>
                <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm text-indigo-600">
                  {order.status}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                Tracking ID: <span className="text-indigo-600 font-mono">{order.trackingId}</span>
              </p>
              <p className="text-sm text-gray-500">
                Placed on: {order.createdAt?.toDate().toLocaleDateString()}
              </p>
            </div>

            {/* Status Timeline */}
            <div className="relative flex justify-between items-center my-8">
              {!isCancelled && (
                <>
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 transform -translate-y-1/2">
                    <div className="h-1 bg-green-500 transition-all duration-500 ease-in-out" style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}></div>
                  </div>
                  {statusSteps.map((step, index) => (
                    <div
                      key={step.status}
                      className={`relative flex flex-col items-center z-10`}
                    >
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform border-2 ${
                          index <= currentStatusIndex ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                        }`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: index === currentStatusIndex ? 1.2 : 1 }}
                      >
                        <step.icon
                          className={`w-6 h-6 ${
                            index <= currentStatusIndex ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </motion.div>
                      <span
                        className={`mt-2 text-center text-xs sm:text-sm font-medium transition-colors duration-300 ${
                          index <= currentStatusIndex ? "text-indigo-600 font-bold" : "text-gray-500"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
              {isCancelled && (
                <div className="w-full text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mb-4">
                    <FiXCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600">Order Cancelled</h3>
                  <p className="text-gray-500 mt-2">This order has been cancelled.</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
              {/* Customer Details */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser /> Customer Information
                </h3>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li className="flex items-center gap-2"><FiUser /> <span className="font-semibold">Name:</span> {order.customerDetails?.fullName}</li>
                  <li className="flex items-center gap-2"><FiMail /> <span className="font-semibold">Email:</span> {order.customerDetails?.email}</li>
                  <li className="flex items-center gap-2"><FiPhone /> <span className="font-semibold">Phone:</span> {order.customerDetails?.phoneNumber}</li>
                  <li className="flex items-center gap-2"><FiPhone /> <span className="font-semibold">WhatsApp:</span> {order.customerDetails?.whatsappNumber}</li>
                  <li className="flex items-center gap-2"><FiMapPin /> <span className="font-semibold">Address:</span> {order.customerDetails?.address}, {order.customerDetails?.city}, {order.customerDetails?.province}</li>
                </ul>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiPackage /> Order Summary
                </h3>
                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                  {order.products?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.images?.[0] || "/placeholder.png"}
                          alt={item.title}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} | Price: PKR {parseFloat(item.price).toFixed(2)}
                        </p>
                        {item.variants && item.variants.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.variants.map(v => `${v.size} ${v.color}`).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-indigo-600">PKR {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
