"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  FaSpinner,
  FaShoppingBag,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/firebase";
import Image from "next/image";

const PRODUCTS_PER_PAGE = 12;
const FABRIC_BUTTONS_PER_PAGE = 8;

// Fabric names data organized by collection type
const FABRIC_NAMES = {
  mensSummer: [
    "Cotton",
    "Soft Cotton",
    "Hard Cotton",
    "Wash & Wear",
    "Boski",
    "Latha",
    "Malai Boski (premium, soft touch)",
    "Egyptian Cotton",
    "Linen"
  ],
  mensWinter: [
    "Cotton",
    "Soft Cotton",
    "Hard Cotton",
    "Wash & Wear",
    "Boski",
    "Latha",
    "Malai Boski (premium, soft touch)",
    "Egyptian Cotton",
    "Linen"
  ],
  womensSummer: [
    "Lawn",
    "Cotton / Cotton Cambric",
    "Voile",
    "Linen",
    "Khadi",
    "Silk (Light silk / Mulmul silk)",
    "Muslin",
    "Chiffon",
    "Organza (for festive / party wear)",
    "Net",
    "Georgette",
    "Printed / Digital Print (on lawn, cotton, silks)",
    "Khaddar"
  ],
  womensWinter: [
    "Polo Cotton",
    "Khaddar",
    "Wool / Wool blend",
    "Pashmina",
    "Velvet",
    "Marina",
    "Jacquard",
    "Karandi",
    "Woolen shawl material",
    "Embroidered Khaddar",
    "Corduroy",
    "Tweed",
    "Fleece (for linings ya ghar ke kapray)"
  ]
};

const fromUrl = (str) =>
  str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const urlCollection = params?.collectionName || "";
  const collectionName = fromUrl(urlCollection);

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("lowToHigh");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFabricDropdown, setShowFabricDropdown] = useState(false);
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [fabricButtonsPage, setFabricButtonsPage] = useState(1);

  // Get appropriate fabric options based on collection
  const getFabricOptions = useMemo(() => {
    const name = collectionName.toLowerCase();
    
    if (name.includes("mens") || name.includes("men")) {
      if (name.includes("winter")) {
        return FABRIC_NAMES.mensWinter;
      } else if (name.includes("summer")) {
        return FABRIC_NAMES.mensSummer;
      }
      return [...FABRIC_NAMES.mensSummer, ...FABRIC_NAMES.mensWinter];
    } else if (name.includes("womens") || name.includes("women") || name.includes("ladies")) {
      if (name.includes("winter")) {
        return FABRIC_NAMES.womensWinter;
      } else if (name.includes("summer")) {
        return FABRIC_NAMES.womensSummer;
      }
      return [...FABRIC_NAMES.womensSummer, ...FABRIC_NAMES.womensWinter];
    }
    
    // Default: combine all fabrics
    return [
      ...FABRIC_NAMES.mensSummer,
      ...FABRIC_NAMES.mensWinter,
      ...FABRIC_NAMES.womensSummer,
      ...FABRIC_NAMES.womensWinter
    ];
  }, [collectionName]);

  useEffect(() => {
    const fetchCollectionProducts = async () => {
      try {
        setLoading(true);
        const productsCollectionRef = collection(db, "products");
        const q = query(
          productsCollectionRef, 
          where("collection", "==", collectionName)
        );
        const snapshot = await getDocs(q);

        const productsData = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        setAllProducts(productsData);
        setProducts(productsData);
        
        // Extract unique fabrics from products
        const fabrics = [...new Set(productsData.map(p => p.fabric).filter(Boolean))];
        setAvailableFabrics(fabrics.sort());
        
        setCurrentPage(1);
        setFabricButtonsPage(1);
      } catch (err) {
        console.error("Failed to fetch collection products:", err);
      } finally {
        setLoading(false);
      }
    };

    if (collectionName) fetchCollectionProducts();
  }, [collectionName]);

  // Filter products by selected fabric
  useEffect(() => {
    if (selectedFabric === "all") {
      setProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product => 
        product.fabric && product.fabric.toLowerCase().includes(selectedFabric.toLowerCase())
      );
      setProducts(filtered);
    }
    setCurrentPage(1);
  }, [selectedFabric, allProducts]);

  const sortedAndPaginatedProducts = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => {
      const priceA = parseFloat(a.price || 0);
      const priceB = parseFloat(b.price || 0);
      return sortOrder === "lowToHigh" ? priceA - priceB : priceB - priceA;
    });

    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, endIndex);
  }, [products, currentPage, sortOrder]);

  // Calculate fabric buttons pagination
  const fabricButtonsTotalPages = Math.ceil(availableFabrics.length / FABRIC_BUTTONS_PER_PAGE);
  const fabricButtonsStartIndex = (fabricButtonsPage - 1) * FABRIC_BUTTONS_PER_PAGE;
  const fabricButtonsEndIndex = fabricButtonsStartIndex + FABRIC_BUTTONS_PER_PAGE;
  const currentFabricButtons = availableFabrics.slice(fabricButtonsStartIndex, fabricButtonsEndIndex);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const handleCardClick = (productId) => {
    router.push(`/product/${productId}`);
  };

  const clearFilters = () => {
    setSelectedFabric("all");
    setShowMobileFilters(false);
    setFabricButtonsPage(1);
  };

  const activeFiltersCount = selectedFabric !== "all" ? 1 : 0;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center items-center min-h-screen bg-indigo-50"
      >
        <FaSpinner className="animate-spin text-6xl text-indigo-600" />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-2 sm:mb-4 text-center sm:text-left">
            {collectionName}
          </h1>
          <p className="text-xs sm:text-lg text-gray-600 text-center sm:text-left">
            {products.length} products found
            {selectedFabric !== "all" && ` in ${selectedFabric}`}
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-6">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <FaFilter className="text-indigo-600" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <FaTimes size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Fabric Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Fabric Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowFabricDropdown(!showFabricDropdown)}
                    className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-left"
                  >
                    <span>{selectedFabric === "all" ? "All Fabrics" : selectedFabric}</span>
                    {showFabricDropdown ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  
                  {showFabricDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedFabric("all");
                            setShowFabricDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors ${
                            selectedFabric === "all" ? "bg-indigo-100 text-indigo-700" : ""
                          }`}
                        >
                          All Fabrics
                        </button>
                        {availableFabrics.map((fabric) => (
                          <button
                            key={fabric}
                            onClick={() => {
                              setSelectedFabric(fabric);
                              setShowFabricDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors ${
                              selectedFabric === fabric ? "bg-indigo-100 text-indigo-700" : ""
                            }`}
                          >
                            {fabric}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fabric Buttons with Pagination */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Fabric Filters
                  </label>
                  {fabricButtonsTotalPages > 1 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>{fabricButtonsPage}</span>
                      <span>/</span>
                      <span>{fabricButtonsTotalPages}</span>
                    </div>
                  )}
                </div>
                
                {/* Fabric Buttons Grid */}
                <div className="grid grid-cols-2 gap-2 min-h-[120px]">
                  <button
                    onClick={() => {
                      setSelectedFabric("all");
                      setFabricButtonsPage(1);
                    }}
                    className={`col-span-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedFabric === "all"
                        ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    All Fabrics
                  </button>
                  
                  {currentFabricButtons.map((fabric) => (
                    <button
                      key={fabric}
                      onClick={() => setSelectedFabric(fabric)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                        selectedFabric === fabric
                          ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                      title={fabric}
                    >
                      {fabric.length > 20 ? fabric.substring(0, 20) + '...' : fabric}
                    </button>
                  ))}
                </div>

                {/* Fabric Buttons Pagination */}
                {fabricButtonsTotalPages > 1 && (
                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setFabricButtonsPage(p => Math.max(p - 1, 1))}
                      disabled={fabricButtonsPage === 1}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft size={10} />
                      Prev
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: fabricButtonsTotalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === fabricButtonsTotalPages || 
                          Math.abs(page - fabricButtonsPage) <= 1
                        )
                        .map((page, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <span key={page} className="flex items-center">
                              {prev && page - prev > 1 && (
                                <span className="px-1 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setFabricButtonsPage(page)}
                                className={`w-6 h-6 rounded text-xs ${
                                  fabricButtonsPage === page
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {page}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setFabricButtonsPage(p => Math.min(p + 1, fabricButtonsTotalPages))}
                      disabled={fabricButtonsPage === fabricButtonsTotalPages}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Next
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters Overlay */}
            <AnimatePresence>
              {showMobileFilters && (
                <>
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setShowMobileFilters(false)}
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30 }}
                    className="fixed left-0 top-0 h-full w-80 bg-white z-50 lg:hidden shadow-2xl overflow-y-auto"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                        <button
                          onClick={() => setShowMobileFilters(false)}
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <FaTimes className="text-gray-600" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fabric Type
                          </label>
                          <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedFabric}
                            onChange={(e) => setSelectedFabric(e.target.value)}
                          >
                            <option value="all">All Fabrics</option>
                            {availableFabrics.map((fabric) => (
                              <option key={fabric} value={fabric}>
                                {fabric}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mobile Fabric Buttons */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Quick Fabric Filters
                          </label>
                          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedFabric("all");
                                setShowMobileFilters(false);
                              }}
                              className={`col-span-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedFabric === "all"
                                  ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                              }`}
                            >
                              All Fabrics
                            </button>
                            {availableFabrics.map((fabric) => (
                              <button
                                key={fabric}
                                onClick={() => {
                                  setSelectedFabric(fabric);
                                  setShowMobileFilters(false);
                                }}
                                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                                  selectedFabric === fabric
                                    ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                                }`}
                                title={fabric}
                              >
                                {fabric.length > 15 ? fabric.substring(0, 15) + '...' : fabric}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={clearFilters}
                          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Fabric Filter Buttons for Mobile/Tablet */}
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Fabric Filters</h3>
                  {fabricButtonsTotalPages > 1 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>{fabricButtonsPage}</span>
                      <span>/</span>
                      <span>{fabricButtonsTotalPages}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={() => {
                      setSelectedFabric("all");
                      setFabricButtonsPage(1);
                    }}
                    className={`col-span-3 sm:col-span-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedFabric === "all"
                        ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    All Fabrics
                  </button>
                  
                  {currentFabricButtons.map((fabric) => (
                    <button
                      key={fabric}
                      onClick={() => setSelectedFabric(fabric)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                        selectedFabric === fabric
                          ? "bg-indigo-600 text-white shadow-lg border-2 border-indigo-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                      title={fabric}
                    >
                      {fabric.length > 12 ? fabric.substring(0, 12) + '...' : fabric}
                    </button>
                  ))}
                </div>

                {fabricButtonsTotalPages > 1 && (
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setFabricButtonsPage(p => Math.max(p - 1, 1))}
                      disabled={fabricButtonsPage === 1}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <FaChevronLeft size={10} />
                      Prev
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: fabricButtonsTotalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === fabricButtonsTotalPages || Math.abs(page - fabricButtonsPage) <= 1)
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => setFabricButtonsPage(page)}
                            className={`w-6 h-6 rounded text-xs ${
                              fabricButtonsPage === page
                                ? "bg-indigo-600 text-white"
                                : "text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                    </div>

                    <button
                      onClick={() => setFabricButtonsPage(p => Math.min(p + 1, fabricButtonsTotalPages))}
                      disabled={fabricButtonsPage === fabricButtonsTotalPages}
                      className="flex items-center gap-1 px-3 py-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Next
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Header + Sorting */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-center">
              <div className="flex items-center gap-4">
                {selectedFabric !== "all" && (
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    Filtered by: {selectedFabric}
                  </span>
                )}
              </div>

              {products.length > 0 && (
                <div className="mt-4 sm:mt-0 flex items-center gap-2">
                  <span className="text-sm sm:text-base text-gray-700 font-semibold">
                    Sort by Price:
                  </span>
                  <button
                    onClick={() => setSortOrder("lowToHigh")}
                    className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium transition ${
                      sortOrder === "lowToHigh"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Low to High
                    <FaSortAmountDown />
                  </button>
                  <button
                    onClick={() => setSortOrder("highToLow")}
                    className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-medium transition ${
                      sortOrder === "highToLow"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    High to Low
                    <FaSortAmountUp />
                  </button>
                </div>
              )}
            </div>

            {/* Products */}
            <AnimatePresence mode="wait">
              {products.length === 0 ? (
                <motion.div
                  key="no-products"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="text-center py-16"
                >
                  <FaShoppingBag className="text-6xl text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No Products Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {selectedFabric !== "all" 
                      ? `No products found in ${selectedFabric} fabric.` 
                      : "This collection doesn't have any products yet."
                    }
                  </p>
                  {selectedFabric !== "all" && (
                    <button
                      onClick={clearFilters}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                >
                  {sortedAndPaginatedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-transform duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.6 }}
                      onClick={() => handleCardClick(product.id)}
                    >
                      {/* Product Image */}
                      <div className="relative w-full aspect-[3/4] bg-gray-200">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaShoppingBag className="text-4xl sm:text-5xl text-gray-300" />
                          </div>
                        )}
                        {product.fabric && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                              {product.fabric.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                        <div>
                          <h3 className="font-bold text-sm sm:text-lg text-gray-900 line-clamp-2 mb-2">
                            {product.title}
                          </h3>
                          {product.fabric && (
                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                              {product.fabric}
                            </p>
                          )}
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-red-600">
                          PKR {parseFloat(product.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>

                <span className="sm:hidden text-sm font-semibold px-3">
                  {currentPage} / {totalPages}
                </span>

                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      );
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <span key={page} className="flex items-center">
                          {prev && page - prev > 1 && (
                            <span className="px-2 text-gray-500">…</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                              currentPage === page
                                ? "bg-indigo-600 text-white shadow-md"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}