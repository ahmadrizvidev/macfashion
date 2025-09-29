"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import CollectionSection from "../componenets/CollectionSection";
import AddToCartButton from "../componenets/AddToCartButton";
import BuyNowButton from "../componenets/BuyNowButton";
import { FaSpinner, FaFilter, FaTimes, FaSearch } from "react-icons/fa";

// Fabric names data organized by category
const FABRIC_NAMES = {
    ladiesSummer: [
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
    ladiesWinter: [
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
    ],
    mens: [
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
    all: []
};

// Combine all fabrics for the "All" category
FABRIC_NAMES.all = [...FABRIC_NAMES.ladiesSummer, ...FABRIC_NAMES.ladiesWinter, ...FABRIC_NAMES.mens];

export default function ShopAll() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [fabricFilter, setFabricFilter] = useState("all");
    const [categories, setCategories] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [sortBy, setSortBy] = useState("price-low");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 12;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const colRef = collection(db, "products");
                const snapshot = await getDocs(colRef);
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setProducts(list);
                setFilteredProducts(list);

                // Extract unique categories
                const uniqueCategories = [
                    ...new Set(list.map((p) => p.category).filter(Boolean)),
                ];
                setCategories(uniqueCategories);

                // Extract unique fabrics from products
                const uniqueFabrics = [
                    ...new Set(list.map((p) => p.fabric).filter(Boolean)),
                ];
                setFabrics(uniqueFabrics.sort());
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
            setLoading(false);
        };

        fetchProducts();
    }, []);

    // Filtering + Sorting
    useEffect(() => {
        let temp = [...products];

        // Category filter
        if (categoryFilter !== "all") {
            temp = temp.filter(
                (p) =>
                    p.category &&
                    p.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }

        // Fabric filter
        if (fabricFilter !== "all") {
            temp = temp.filter(
                (p) =>
                    p.fabric &&
                    p.fabric.toLowerCase().includes(fabricFilter.toLowerCase())
            );
        }

        // Search filter
        if (search) {
            temp = temp.filter((p) =>
                p.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sorting
        switch (sortBy) {
            case "price-low":
                temp.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                temp.sort((a, b) => b.price - a.price);
                break;
            case "name-asc":
                temp.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "name-desc":
                temp.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                temp.sort((a, b) => a.price - b.price);
        }

        setFilteredProducts(temp);
        setCurrentPage(1);
    }, [search, categoryFilter, fabricFilter, sortBy, products]);

    // Memoize pagination slice
    const currentProducts = useMemo(() => {
        const start = (currentPage - 1) * productsPerPage;
        return filteredProducts.slice(start, start + productsPerPage);
    }, [currentPage, filteredProducts]);

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Clear all filters
    const clearFilters = () => {
        setSearch("");
        setCategoryFilter("all");
        setFabricFilter("all");
        setSortBy("price-low");
    };

    // Get active filters count
    const activeFiltersCount = [
        search ? 1 : 0,
        categoryFilter !== "all" ? 1 : 0,
        fabricFilter !== "all" ? 1 : 0,
        sortBy !== "price-low" ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    // Render pagination buttons
    const renderPagination = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(
                    1,
                    "...",
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    "...",
                    totalPages
                );
            }
        }

        return (
            <div className="flex justify-center mt-12 flex-wrap gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center gap-2
                        ${
                            currentPage === 1
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300 hover:shadow-md"
                        }`}
                >
                    ← Previous
                </button>

                {pages.map((p, idx) =>
                    p === "..." ? (
                        <span key={idx} className="px-3 py-2 text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition
                                ${
                                    currentPage === p
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300 hover:shadow-md"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center gap-2
                        ${
                            currentPage === totalPages
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300 hover:shadow-md"
                        }`}
                >
                    Next →
                </button>
            </div>
        );
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-96">
                <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
            </div>
        );

    return (
        <section className="py-8 bg-gray-50 min-h-screen px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4">
                        All Products
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Discover our complete collection of premium fabrics and fashion
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
                                Clear All
                            </button>
                        )}
                        <span className="text-sm text-gray-600">
                            {filteredProducts.length} products
                        </span>
                    </div>
                </div>

                {/* Main Content Grid */}
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

                            {/* Search */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search Products
                                </label>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Fabric Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fabric Type
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={fabricFilter}
                                    onChange={(e) => setFabricFilter(e.target.value)}
                                >
                                    <option value="all">All Fabrics</option>
                                    {fabrics.map((fabric) => (
                                        <option key={fabric} value={fabric}>
                                            {fabric}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sort By
                                </label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name-asc">Name: A to Z</option>
                                    <option value="name-desc">Name: Z to A</option>
                                </select>
                            </div>

                            {/* Active Filters Summary */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    Showing {filteredProducts.length} of {products.length} products
                                </p>
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

                                            {/* Mobile Filter Content */}
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Search Products
                                                    </label>
                                                    <div className="relative">
                                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search products..."
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                            value={search}
                                                            onChange={(e) => setSearch(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Category
                                                    </label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={categoryFilter}
                                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                                    >
                                                        <option value="all">All Categories</option>
                                                        {categories.map((cat) => (
                                                            <option key={cat} value={cat}>
                                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Fabric Type
                                                    </label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={fabricFilter}
                                                        onChange={(e) => setFabricFilter(e.target.value)}
                                                    >
                                                        <option value="all">All Fabrics</option>
                                                        {fabrics.map((fabric) => (
                                                            <option key={fabric} value={fabric}>
                                                                {fabric}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Sort By
                                                    </label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                    >
                                                        <option value="price-low">Price: Low to High</option>
                                                        <option value="price-high">Price: High to Low</option>
                                                        <option value="name-asc">Name: A to Z</option>
                                                        <option value="name-desc">Name: Z to A</option>
                                                    </select>
                                                </div>

                                                <button
                                                    onClick={clearFilters}
                                                    className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                                                >
                                                    Clear All Filters
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                        {/* Quick Fabric Filter Buttons */}
                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFabricFilter("all")}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        fabricFilter === "all"
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "bg-white text-gray-700 border border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                                    }`}
                                >
                                    All Fabrics
                                </button>
                                {fabrics.slice(0, 6).map((fabric) => (
                                    <button
                                        key={fabric}
                                        onClick={() => setFabricFilter(fabricFilter === fabric ? "all" : fabric)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                            fabricFilter === fabric
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "bg-white text-gray-700 border border-gray-300 hover:border-indigo-500 hover:text-indigo-600"
                                        }`}
                                    >
                                        {fabric.length > 20 ? fabric.substring(0, 20) + '...' : fabric}
                                    </button>
                                ))}
                                {fabrics.length > 6 && (
                                    <button
                                        onClick={() => setShowMobileFilters(true)}
                                        className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                                    >
                                        +{fabrics.length - 6} more
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Products Grid */}
                        {currentProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-6xl mb-4">😔</div>
                                <p className="text-xl text-gray-500 mb-2">No products found</p>
                                <p className="text-gray-400 mb-6">Try adjusting your filters or search terms</p>
                                <button
                                    onClick={clearFilters}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {currentProducts.map((product) => (
                                        <motion.div
                                            key={product.id}
                                            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group"
                                            whileHover={{ y: -5 }}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Link
                                                href={`/product/${product.id}`}
                                                className="flex flex-col flex-grow"
                                            >
                                                <div className="relative w-full aspect-[3/4] overflow-hidden">
                                                    <Image
                                                        src={product.images?.[0] || "/placeholder.png"}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                                                        priority={currentPage === 1}
                                                    />
                                                    {product.fabric && (
                                                        <div className="absolute top-2 left-2">
                                                            <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                                                {product.fabric.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-grow">
                                                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition line-clamp-2 mb-2">
                                                        {product.title}
                                                    </h3>
                                                    
                                                    {product.fabric && (
                                                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                                                            {product.fabric}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="mt-auto">
                                                        {product.reviews && (
                                                            <p className="text-yellow-500 text-xs mb-2">
                                                                ⭐ {product.reviews} reviews
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center space-x-2">
                                                                {product.oldPrice && (
                                                                    <span className="line-through text-gray-400 text-xs">
                                                                        PKR {product.oldPrice.toLocaleString()}
                                                                    </span>
                                                                )}
                                                                <span className="text-red-600 font-bold text-base sm:text-lg">
                                                                    PKR {product.price.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="px-4 pb-4">
                                                <BuyNowButton 
                                                    product={product}
                                                    variant="compact"
                                                    showQuantityControls={true}
                                                    className="w-full"
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && renderPagination()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}