"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import CollectionSection from "../componenets/CollectionSection";
import { FaSpinner } from "react-icons/fa";

export default function ShopAll() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // ✅ Show 12 per page

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

        const uniqueCategories = [
          ...new Set(list.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
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

    if (categoryFilter !== "all") {
      temp = temp.filter(
        (p) =>
          p.category &&
          p.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (search) {
      temp = temp.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort by price low → high
    temp.sort((a, b) => a.price - b.price);

    setFilteredProducts(temp);
    setCurrentPage(1); // ✅ Reset when filters change
  }, [search, categoryFilter, products]);

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

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );

  // ✅ Generate professional pagination buttons
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5; // Show at most 5 page numbers around current page

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
        {/* Prev Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition
            ${
              currentPage === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
            }`}
        >
          Prev
        </button>

        {/* Numbered Pages */}
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={idx} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition
                ${
                  currentPage === p
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                }`}
            >
              {p}
            </button>
          )
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition
            ${
              currentPage === totalPages
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
            }`}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <section className="py-12 bg-gray-50 min-h-screen px-4 md:px-10">
      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-8">
        All Products
      </h1>

      {/* Category sections */}
      {categories.map((cat) => (
        <CollectionSection
          key={cat}
          title={cat.charAt(0).toUpperCase() + cat.slice(1)}
          products={products.filter((p) => p.category === cat)}
          link={`/category/${cat}`}
        />
      ))}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 mb-10 mt-10">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full md:w-1/4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      {/* Products Grid */}
      {currentProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1 duration-300 overflow-hidden flex flex-col h-full"
              whileHover={{ scale: 1.03 }}
            >
              <Link
                href={`/product/${product.id}`}
                className="flex flex-col h-full"
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                    priority={currentPage === 1}
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800 hover:text-indigo-600 transition line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="mt-2 flex-grow flex flex-col justify-end">
                    {product.reviews && (
                      <p className="text-yellow-500 text-sm">
                        ⭐ {product.reviews} reviews
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      {product.oldPrice && (
                        <span className="line-through text-gray-400 text-sm">
                          PKR {product.oldPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-red-600 font-bold text-lg">
                        PKR {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* ✅ Professional Pagination */}
      {totalPages > 1 && renderPagination()}
    </section>
  );
}
