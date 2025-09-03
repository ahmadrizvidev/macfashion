"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase"; // Make sure this path is correct

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchResults([]); // Hide the dropdown after search
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Instant Search Logic
  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const colRef = collection(db, "products");
        const snapshot = await getDocs(colRef);
        const allProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const filtered = allProducts.filter((product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Error fetching products for search:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceSearch = setTimeout(() => {
      fetchAndFilterProducts();
    }, 300); // Debounce to prevent excessive database calls

    return () => clearTimeout(debounceSearch);
  }, [searchTerm]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/assets/logo.jpg"
            alt="logo"
            width={150}
            height={40}
            className="w-[150px] object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6">
          <ul className="flex space-x-6">
            <li>
              <Link href="/collections/men" className="text-gray-800 hover:text-blue-600 transition-colors duration-200 text-base font-medium">
                Men
              </Link>
            </li>
            <li>
              <Link href="/collections/women" className="text-gray-800 hover:text-blue-600 transition-colors duration-200 text-base font-medium">
                Women
              </Link>
            </li>
            <li>
              <Link href="/collections/kids" className="text-gray-800 hover:text-blue-600 transition-colors duration-200 text-base font-medium">
                Kids
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Section - Search, Cart */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Search bar with dropdown */}
          <div className="relative hidden xl:block" ref={searchRef}>
            <form onSubmit={handleSearch} className="flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm w-full outline-none placeholder-gray-500"
              />
              <button type="submit" aria-label="Search" className="ml-2">
                <span role="img" aria-label="search">🔍</span>
              </button>
            </form>
            {/* Search Results Dropdown */}
            {searchTerm && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="flex items-center p-2 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => {
                        setSearchResults([]);
                        setSearchTerm("");
                      }}
                    >
                      <Image
                        src={product.images?.[0] || "/placeholder.png"}
                        alt={product.title}
                        width={40}
                        height={40}
                        className="rounded-md object-cover mr-2"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          PKR {product.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No results found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link href="/cart">
              <div className="relative flex flex-col items-center justify-center cursor-pointer hover:text-blue-600 transition-colors duration-200">
                <span role="img" aria-label="cart">🛒</span>
                <span className="text-xs font-semibold mt-1 hidden sm:block">Cart</span>
              </div>
            </Link>
          </div>

          {/* Mobile Hamburger Menu button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <span role="img" aria-label="hamburger menu">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300 ${menuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className={`fixed left-0 top-0 w-3/4 max-w-xs h-full bg-white p-6 shadow-xl transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-8">
            <Link href="/" onClick={toggleMenu}>
              <Image
                src="/assets/logo.jpg"
                alt="logo"
                width={50}
                height={40}
                priority
              />
            </Link>
            <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-700">
              <span role="img" aria-label="close menu">✕</span>
            </button>
          </div>
          {/* Mobile Search Form with Instant Results */}
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center mb-6 border border-gray-300 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm w-full outline-none placeholder-gray-500"
              />
              <button type="submit" aria-label="Search" className="ml-2">
                <span role="img" aria-label="search">🔍</span>
              </button>
            </form>
            {/* Mobile Search Results Dropdown */}
            {searchTerm && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="flex items-center p-2 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => {
                        setSearchResults([]);
                        setSearchTerm("");
                        toggleMenu(); // Close mobile menu
                      }}
                    >
                      <Image
                        src={product.images?.[0] || "/placeholder.png"}
                        alt={product.title}
                        width={30}
                        height={30}
                        className="rounded-md object-cover mr-2"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {product.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          PKR {product.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No results found.
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ... other mobile menu items */}
          <ul className="space-y-4">
            <li>
              <Link href="/collections/men" onClick={toggleMenu} className="block py-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                Men
              </Link>
            </li>
            <li>
              <Link href="/collections/women" onClick={toggleMenu} className="block py-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                Women
              </Link>
            </li>
            <li>
              <Link href="/collections/kids" onClick={toggleMenu} className="block py-2 text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                Kids
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}