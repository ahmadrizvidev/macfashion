"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTwitter, FaWhatsapp, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHeart } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] repeat"></div>
      </div>
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">M</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Macstore
                </span>
              </div>
          </Link>
            <p className="text-gray-300 leading-relaxed mb-6">
              Your premier destination for premium fashion. Discover the latest trends in men's, women's, and kids' collections with unmatched quality and style.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: FaFacebookF, href: "https://facebook.com", color: "hover:text-blue-400" },
                { icon: FaInstagram, href: "https://instagram.com", color: "hover:text-pink-400" },
                { icon: FaTwitter, href: "https://twitter.com", color: "hover:text-blue-300" },
                { icon: FaWhatsapp, href: "https://whatsapp.com", color: "hover:text-green-400" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 ${social.color} transition-all duration-300 hover:scale-110 hover:bg-gray-600`}
                >
                  <social.icon />
                </a>
              ))}
        </div>
          </motion.div>

        {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-6 text-white">Collections</h3>
            <ul className="space-y-3">
              {[
                { name: "Men's Fashion", href: "/collections/mens" },
                { name: "Women's Collection", href: "/collections/womens" },
                { name: "Kids Wear", href: "/collections/kids" },
                { name: "Summer Collection", href: "/collections/summer" },
                { name: "Winter Collection", href: "/collections/winter" },
                { name: "Accessories", href: "/collections/accessories" },
              ].map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
          </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="text-lg font-bold mb-6 text-white">Customer Service</h3>
            <ul className="space-y-3">
              {[
                { name: "Track Your Order", href: "/order-status" },
                { name: "Size Guide", href: "/size-guide" },
                { name: "Return Policy", href: "/returns" },
                { name: "Shipping Info", href: "/shipping" },
                { name: "FAQ", href: "/faq" },
                { name: "Support", href: "/support" },
              ].map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.name}
          </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-bold mb-6 text-white">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <FaMapMarkerAlt className="text-indigo-400 flex-shrink-0" />
                <span className="text-sm">123 Fashion Street, Style City, SC 12345</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <FaPhone className="text-indigo-400 flex-shrink-0" />
                <span className="text-sm">+92 305-2732104</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <FaEnvelope className="text-indigo-400 flex-shrink-0" />
                <span className="text-sm">support@macstore.com</span>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-white">Stay Updated</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
                <button className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-r-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="border-t border-gray-700 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span>© {new Date().getFullYear()} Macstore. Made with</span>
              <FaHeart className="text-red-500 animate-pulse" />
              <span>for fashion lovers</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-300">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
        </div>
      </div>
        </motion.div>
      </div>
    </footer>
  );
}
