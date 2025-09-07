"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

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
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAndFilterProducts = async () => {
      if (!searchTerm.trim()) {
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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => fetchAndFilterProducts(), 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const navLinks = [
    { name: "Men", href: "/collections/Mens" },
    { name: "Women", href: "/collections/womens-winter-collection" },
    { name: "Kids", href: "/collections/Kids" },
    { name: "Tracksuit", href: "/collections/tracksuit" },
    { name: "Bed Sheets", href: "/collections/bed-sheet" },
    { name: "Order Tracking", href: "/order-status" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full shadow-sm">
      {/* First Line: Logo, Search, Cart */}
      <div className="bg-white">
        <div className="container mx-auto flex items-center justify-between p-4 sm:px-6 lg:px-8">
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

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 relative" ref={searchRef}>
            <form
              onSubmit={handleSearch}
              className="flex items-center w-full bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200"
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent w-full outline-none text-sm placeholder-gray-500"
              />
              <button type="submit" className="ml-2 text-gray-600 hover:text-gray-800 transition-colors">
                🔍
              </button>
            </form>

            {searchTerm && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="flex items-center p-2 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => {
                        setSearchTerm("");
                        setSearchResults([]);
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
                  <div className="p-4 text-center text-gray-500">No results found.</div>
                )}
              </div>
            )}
          </div>

          <Link href="/cart">
            <div className="flex flex-col items-center justify-center cursor-pointer hover:text-blue-600 transition-colors duration-200">
              🛒
              <span className="text-xs mt-1 hidden sm:block">Cart</span>
            </div>
          </Link>

        <button
  onClick={toggleMenu}
  className="lg:hidden ml-4 p-2 rounded-md duration-200 text-white bg-black"
>
  ☰
</button>

        </div>
      </div>

      {/* Second Line: Navigation Links */}
      <nav className="bg-black">
        <div className="container mx-auto flex justify-center py-2 px-4 sm:px-6 lg:px-8">
          <ul className="hidden lg:flex space-x-8 whitespace-nowrap">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-white font-semibold hover:text-blue-400 transition-colors duration-200"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={toggleMenu}>
          <div
            className="fixed left-0 top-0 w-3/4 max-w-xs h-full bg-white p-6 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <Link href="/" onClick={toggleMenu}>
                <Image src="/assets/logo.jpg" alt="logo" width={50} height={40} />
              </Link>
              <button onClick={toggleMenu} className="text-black-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={toggleMenu}
                    className="block text-gray-800 font-medium py-2"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
