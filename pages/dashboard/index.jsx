import { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaTrash, FaPen, FaUpload, FaPlus, FaTimes, FaBars, FaSpinner, FaEye, FaEdit, FaCheck } from "react-icons/fa";
import { FiDollarSign, FiCalendar, FiPackage, FiShoppingCart, FiUser, FiEdit } from "react-icons/fi";
import { motion } from "framer-motion";
import { db, storage } from "../../lib/firebase";

// Use the app ID to create a unique path for data
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Function to upload files to Firebase Storage
const uploadToFirebase = async (file) => {
  const storageRef = ref(storage, `artifacts/${appId}/uploads/${file.name}_${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const initialOrderCountRef = useRef(0);
  const [orderSubTab, setOrderSubTab] = useState("pending"); // New state for sub-tabs

  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
  });

  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    collection: "",
    variants: [],
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);

  // --- Fetch products and orders ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsCollectionRef = collection(db, 'products');
      const snapshot = await getDocs(productsCollectionRef);
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const ordersCollectionRef = collection(db, `artifacts/${appId}/public/data/orders`);
      const q = query(ordersCollectionRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const currentOrderCount = fetchedOrders.length;
      if (initialOrderCountRef.current === 0) {
        initialOrderCountRef.current = currentOrderCount;
      } else {
        const newOrders = currentOrderCount - initialOrderCountRef.current;
        if (newOrders > 0) {
          setNewOrdersCount(newOrders);
        }
      }

      setOrders(fetchedOrders);
      calculateStats(fetchedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setLoading(true);
    try {
      const orderDocRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);
      await updateDoc(orderDocRef, {
        status: status,
        updatedAt: serverTimestamp(),
      });
      alert(`Order status updated to ${status}!`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Failed to update order status.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allOrders) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = allOrders.reduce((acc, order) => acc + order.totalAmount, 0);

    const thisMonthRevenue = allOrders.reduce((acc, order) => {
      const orderDate = order.createdAt?.toDate();
      if (orderDate && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        return acc + order.totalAmount;
      }
      return acc;
    }, 0);

    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    const lastMonthRevenue = allOrders.reduce((acc, order) => {
      const orderDate = order.createdAt?.toDate();
      if (orderDate && orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear()) {
        return acc + order.totalAmount;
      }
      return acc;
    }, 0);

    setStats({
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      setNewStatus(selectedOrder.status || "Pending");
    }
  }, [selectedOrder]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setIsSidebarOpen(false);
    if (tabName === "orders") {
      setNewOrdersCount(0);
      initialOrderCountRef.current = orders.length;
    }
  };

  // --- Media Handlers ---
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isNew: true,
    }));
    setImages((prev) => [...prev, ...previews]);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setVideo({ file, url: URL.createObjectURL(file), isNew: true });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  // --- Product CRUD Operations ---
  const resetForm = () => {
    setEditingProduct(null);
    setNewProduct({
      title: "",
      price: "",
      description: "",
      collection: "",
      variants: [],
    });
    setImages([]);
    setVideo(null);
  };

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.price || !newProduct.collection) {
      alert("Title, Price, and Collection are required.");
      return;
    }
    setLoading(true);
    try {
      const uploadedImages = await Promise.all(images.map((img) => uploadToFirebase(img.file)));
      const uploadedVideo = video ? await uploadToFirebase(video.file) : null;

      const productsCollectionRef = collection(db, 'products');
      await addDoc(productsCollectionRef, {
        ...newProduct,
        images: uploadedImages,
        video: uploadedVideo,
        createdAt: serverTimestamp(),
      });
      alert("Product added successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Failed to add product:", err);
      alert("Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      title: product.title,
      price: product.price,
      description: product.description,
      collection: product.collection,
      variants: product.variants || [],
    });
    setImages(product.images?.map((url) => ({ url, isNew: false })) || []);
    setVideo(product.video ? { url: product.video, isNew: false } : null);
    setActiveTab("products");
  };

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    setLoading(true);
    try {
      const newImagesToUpload = images.filter((img) => img.isNew);
      const uploadedNewImages = await Promise.all(newImagesToUpload.map((img) => uploadToFirebase(img.file)));
      const existingImages = images.filter((img) => !img.isNew).map((img) => img.url);
      const finalImages = [...existingImages, ...uploadedNewImages];

      let finalVideoUrl = video?.url || null;
      if (video?.isNew) {
        finalVideoUrl = await uploadToFirebase(video.file);
      }

      const productDocRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productDocRef, {
        ...newProduct,
        images: finalImages,
        video: finalVideoUrl,
      });
      alert("Product updated successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Failed to update product:", err);
      alert("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    try {
      const productDocRef = doc(db, 'products', id);
      await deleteDoc(productDocRef);
      fetchProducts();
      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Failed to delete product:", err);
      alert("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  // --- Variant Handlers ---
  const addVariant = () => {
    setNewProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: "", color: "" }],
    }));
  };

  const updateVariant = (index, field, value) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index][field] = value;
    setNewProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const removeVariant = (index) => {
    const updatedVariants = newProduct.variants.filter((_, i) => i !== index);
    setNewProduct((prev) => ({ ...prev, variants: updatedVariants }));
  };

  const getStatusBadge = (status) => {
    const baseStyle = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "Pending":
        return `${baseStyle} bg-yellow-100 text-yellow-800`;
      case "Processing":
        return `${baseStyle} bg-blue-100 text-blue-800`;
      case "Ready for Packed":
        return `${baseStyle} bg-purple-100 text-purple-800`;
      case "Ready for Shipping":
        return `${baseStyle} bg-indigo-100 text-indigo-800`;
      case "Shipped":
        return `${baseStyle} bg-green-100 text-green-800`;
      case "Cancelled":
        return `${baseStyle} bg-red-100 text-red-800`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-800`;
    }
  };

  const pendingOrders = orders.filter(o => ["Pending", "Processing", "Ready for Packed", "Ready for Shipping"].includes(o.status));
  const completedOrders = orders.filter(o => ["Shipped", "Cancelled"].includes(o.status));

  return (
    <div className="flex min-h-screen font-sans bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform bg-indigo-800 text-white p-6 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:w-64 flex flex-col`}
      >
        <button
          className="lg:hidden absolute top-4 right-4 text-white text-2xl"
          onClick={() => setIsSidebarOpen(false)}
        >
          <FaTimes />
        </button>
        <h1 className="text-3xl font-extrabold mb-12 text-center text-indigo-100">
          Admin Panel
        </h1>
        <nav className="flex flex-col gap-3 flex-1">
          <button
            className={`py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 ${
              activeTab === "home"
                ? "bg-indigo-900 text-white shadow-lg"
                : "hover:bg-indigo-700 text-indigo-100"
            }`}
            onClick={() => handleTabClick("home")}
          >
            Dashboard Home
          </button>
          <button
            className={`py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 ${
              activeTab === "products"
                ? "bg-indigo-900 text-white shadow-lg"
                : "hover:bg-indigo-700 text-indigo-100"
            }`}
            onClick={() => handleTabClick("products")}
          >
            Add Product
          </button>
          <button
            className={`py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 ${
              activeTab === "manage"
                ? "bg-indigo-900 text-white shadow-lg"
                : "hover:bg-indigo-700 text-indigo-100"
            }`}
            onClick={() => handleTabClick("manage")}
          >
            Manage Products
          </button>
          <button
            className={`relative py-3 px-4 rounded-lg text-left font-medium transition-colors duration-200 ${
              activeTab === "orders"
                ? "bg-indigo-900 text-white shadow-lg"
                : "hover:bg-indigo-700 text-indigo-100"
            }`}
            onClick={() => handleTabClick("orders")}
          >
            Orders
            {newOrdersCount > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full animate-bounce">
                {newOrdersCount}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <button
          className="lg:hidden text-indigo-800 text-2xl mb-4"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FaBars />
        </button>

        {/* Home Tab */}
        {activeTab === "home" && (
          <div className="space-y-8">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Welcome, Admin 👋
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Revenue Card */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FiDollarSign className="text-5xl text-blue-500 mb-2" />
                <p className="text-gray-500 font-semibold mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600">PKR {stats.totalRevenue.toFixed(2)}</p>
              </motion.div>

              {/* This Month's Revenue Card */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FiCalendar className="text-5xl text-green-500 mb-2" />
                <p className="text-gray-500 font-semibold mb-1">This Month</p>
                <p className="text-3xl font-bold text-green-600">PKR {stats.thisMonthRevenue.toFixed(2)}</p>
              </motion.div>

              {/* Last Month's Revenue Card */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FiCalendar className="text-5xl text-purple-500 mb-2" />
                <p className="text-gray-500 font-semibold mb-1">Last Month</p>
                <p className="text-3xl font-bold text-purple-600">PKR {stats.lastMonthRevenue.toFixed(2)}</p>
              </motion.div>

              {/* Total Orders Card */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FiShoppingCart className="text-5xl text-indigo-500 mb-2" />
                <p className="text-gray-500 font-semibold mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-indigo-600">{orders.length}</p>
              </motion.div>
            </div>
          </div>
        )}

        ---

        {/* Add/Edit Product Tab */}
        {activeTab === "products" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Title"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={newProduct.title}
                onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                disabled={loading}
              />
              <input
                type="number"
                placeholder="Price"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                disabled={loading}
              />
            </div>
            <textarea
              placeholder="Description"
              rows="4"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              disabled={loading}
            />
            <select
              value={newProduct.collection || ""}
              onChange={(e) => setNewProduct({ ...newProduct, collection: e.target.value })}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              disabled={loading}
            >
              <option value="">Select Collection</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>

            {/* Variants Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-lg font-semibold text-gray-700">Variants</label>
                <button
                  onClick={addVariant}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-200 flex items-center gap-2"
                  disabled={loading}
                >
                  <FaPlus /> Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {newProduct.variants.map((variant, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 bg-gray-100 p-4 rounded-lg items-center">
                    <input
                      type="text"
                      placeholder="Size (e.g., S, M, L)"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-1 focus:ring-indigo-400"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, "size", e.target.value)}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      placeholder="Color (e.g., Red, Blue)"
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-1 focus:ring-indigo-400"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, "color", e.target.value)}
                      disabled={loading}
                    />
                    <button
                      onClick={() => removeVariant(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex-shrink-0"
                      disabled={loading}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Media Upload Section */}
            <div>
              <label className="text-lg font-semibold text-gray-700 block mb-3">
                Product Media
              </label>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <label className="cursor-pointer flex-1 w-full flex items-center justify-center p-4 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200 text-center">
                  <input type="file" multiple onChange={handleImageUpload} className="hidden" disabled={loading} />
                  <FaUpload className="mr-2" /> Upload Images
                </label>
                <label className="cursor-pointer flex-1 w-full flex items-center justify-center p-4 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 transition-colors duration-200 text-center">
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={loading} />
                  <FaUpload className="mr-2" /> Upload Video
                </label>
              </div>

              {/* Media Previews */}
              <div className="flex flex-wrap gap-4 mt-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={`Product Image ${idx + 1}`}
                      className="w-32 h-32 object-cover rounded-lg shadow-md"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ))}
                {video && (
                  <div className="relative group">
                    <video
                      className="w-full max-w-sm h-auto rounded-lg shadow-md"
                      controls
                      src={video.url}
                    />
                    <button
                      onClick={removeVideo}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={editingProduct ? saveEditProduct : addProduct}
              className={`w-full text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-colors duration-200 transform hover:scale-105 ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 inline-block" />
                  Loading...
                </>
              ) : (
                editingProduct ? "Save Changes" : "Add Product"
              )}
            </button>
          </div>
        )}

        ---

        {/* Manage Products Tab */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Manage Products
            </h2>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                <span className="ml-4 text-xl font-semibold text-indigo-600">Loading Products...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-stretch transform transition-transform duration-300 hover:scale-105"
                  >
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg text-gray-900">{p.title}</h3>
                    <p className="text-red-600 font-extrabold text-xl mt-1">
                      PKR {p.price}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">{p.collection}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        className={`flex-1 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        onClick={() => editProduct(p)}
                        disabled={loading}
                      >
                        <FaPen /> Edit
                      </button>
                      <button
                        className={`flex-1 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${loading ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
                        onClick={() => deleteProduct(p.id)}
                        disabled={loading}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        ---

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Recent Orders</h2>

            {/* New Sub-Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 font-semibold text-lg transition-colors duration-200 ${
                  orderSubTab === "pending"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-indigo-600"
                }`}
                onClick={() => setOrderSubTab("pending")}
              >
                Pending Orders
              </button>
              <button
                className={`py-2 px-4 font-semibold text-lg transition-colors duration-200 ${
                  orderSubTab === "completed"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-gray-500 hover:text-indigo-600"
                }`}
                onClick={() => setOrderSubTab("completed")}
              >
                Completed Orders
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <FaSpinner className="animate-spin text-4xl text-indigo-600" />
                <span className="ml-4 text-xl font-semibold text-indigo-600">Loading Orders...</span>
              </div>
            ) : (
              <>
                {/* Display based on sub-tab selection */}
                {orderSubTab === "pending" && (
                  <>
                    {/* Desktop View (Table) */}
                    <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(o)}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{o.id.substring(0, 8)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.customerDetails?.fullName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.createdAt?.toDate().toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.trackingId || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(o.status)}>{o.status}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">PKR {o.totalAmount.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pendingOrders.map((o) => (
                        <div
                          key={o.id}
                          className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200 cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg truncate text-indigo-700">{o.customerDetails?.fullName}</h3>
                            <span className={getStatusBadge(o.status)}>{o.status}</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            Order ID: <span className="font-medium text-gray-800">{o.id.substring(0, 8)}</span>
                          </p>
                          <p className="text-sm text-gray-500 mb-1">
                            Tracking ID: <span className="font-medium text-gray-800">{o.trackingId || "N/A"}</span>
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            Total: PKR {o.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {orderSubTab === "completed" && (
                  <>
                    {/* Desktop View (Table) */}
                    <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completedOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(o)}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{o.id.substring(0, 8)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.customerDetails?.fullName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.createdAt?.toDate().toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{o.trackingId || "N/A"}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(o.status)}>{o.status}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">PKR {o.totalAmount.toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {completedOrders.map((o) => (
                        <div
                          key={o.id}
                          className="bg-white p-5 rounded-2xl shadow-lg border border-gray-200 cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                          onClick={() => setSelectedOrder(o)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg truncate text-indigo-700">{o.customerDetails?.fullName}</h3>
                            <span className={getStatusBadge(o.status)}>{o.status}</span>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            Order ID: <span className="font-medium text-gray-800">{o.id.substring(0, 8)}</span>
                          </p>
                          <p className="text-sm text-gray-500 mb-1">
                            Tracking ID: <span className="font-medium text-gray-800">{o.trackingId || "N/A"}</span>
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            Total: PKR {o.totalAmount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
                onClick={() => setSelectedOrder(null)}
              >
                <FaTimes size={24} />
              </button>

              <h3 className="text-3xl font-bold text-gray-900 mb-6">Order Details</h3>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <h4 className="text-xl font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <FiUser className="text-indigo-600" /> Customer Information
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Name:</strong> {selectedOrder.customerDetails?.fullName}</p>
                    <p><strong>WhatsApp:</strong> {selectedOrder.customerDetails?.whatsappNumber}</p>
                    <p><strong>Email:</strong> {selectedOrder.customerDetails?.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customerDetails?.phoneNumber}</p>
                    <p><strong>Address:</strong> {selectedOrder.customerDetails?.address}, {selectedOrder.customerDetails?.city}, {selectedOrder.customerDetails?.province}</p>
                  </div>
                </div>

                {/* Order Summary Section */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FiPackage className="text-gray-600" /> Order Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                    <p><strong>Tracking ID:</strong> {selectedOrder.trackingId || "N/A"}</p>
                    <p><strong>Status:</strong> <span className={getStatusBadge(selectedOrder.status)}>{selectedOrder.status}</span></p>
                    <p><strong>Total:</strong> PKR {selectedOrder.totalAmount?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Products Section */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FiShoppingCart className="text-gray-600" /> Products
                  </h4>
                  <ul className="space-y-4">
                    {selectedOrder.products?.map((item, index) => (
                      <li key={index} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative">
                          <img
                            src={item.images?.[0] || "/placeholder.png"}
                            alt={item.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{item.title}</h5>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-indigo-600">PKR {item.price}</p>
                          {/* Display Variants */}
                          {(item.selectedCategory || item.selectedColor) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.selectedCategory && <span>Size: {item.selectedCategory}</span>}
                              {item.selectedCategory && item.selectedColor && <span>, </span>}
                              {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status Update Form */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-xl font-bold text-yellow-800 mb-3 flex items-center gap-2">
                    <FiEdit className="text-yellow-600" /> Update Status
                  </h4>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors mb-4"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Ready for Packed">Ready for Packed</option>
                    <option value="Ready for Shipping">Ready for Shipping</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, newStatus)}
                    className={`w-full text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors duration-200 transform hover:scale-105 ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2 inline-block" />
                        Updating...
                      </>
                    ) : (
                      <><FaCheck /> Confirm Status</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}