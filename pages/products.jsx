"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import CollectionSection from "../componenets/CollectionSection";
import { FaSpinner } from 'react-icons/fa';

export default function ShopAll() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 30;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const colRef = collection(db, "products");
        const snapshot = await getDocs(colRef);
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    
    // Sort products by price from low to high
    temp.sort((a, b) => a.price - b.price);

    setFilteredProducts(temp);
    
    // Reset page to 1 whenever filters change
    setCurrentPage(1);
  }, [search, categoryFilter, products]);

  // Get current products for pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );

  return (
    <section className="py-16 bg-gray-50 min-h-screen px-6 md:px-12">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">
        All Products
      </h1>

      {/* Dynamic categories section */}
      {categories.map((cat) => (
        <CollectionSection
          key={cat}
          title={cat.charAt(0).toUpperCase() + cat.slice(1)}
          products={products.filter((p) => p.category === cat)}
          link={`/category/${cat}`}
        />
      ))}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 mb-12 mt-12">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Category Filter Dropdown */}
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

      {/* Filtered Products Grid */}
      {currentProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-20">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentProducts.map((product) => (
            <motion.div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-2 duration-300 overflow-hidden flex flex-col h-full"
              whileHover={{ scale: 1.05 }}
            >
              <Link href={`/product/${product.id}`} className="flex flex-col h-full">
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                    placeholder="blur"
                    blurDataURL="/placeholder.png"
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="h-14">
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 transition overflow-hidden line-clamp-2">
                      {product.title}
                    </h3>
                  </div>
                  <div className="mt-2 flex-grow flex flex-col justify-end">
                    {product.reviews && (
                      <p className="text-yellow-500 text-sm mt-1">
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-300
                ${currentPage === i + 1
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
