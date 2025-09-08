"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#B42C14] text-white">
      <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        
        {/* Logo + About */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/assets/logo.jpg"
              alt="Logo"
              width={50}
              height={50}
              className="rounded-full border-2 border-white"
            />
            <span className="text-2xl font-bold">Mac</span>
          </Link>
          <p className="text-sm text-gray-200 leading-relaxed max-w-xs">
            Your trusted store for premium Men, Women, and Kids collections. 
            Shop the latest trends with confidence.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start space-y-3">
          <h3 className="text-lg font-semibold">Quick Links</h3>
          <Link href="/collections/men" className="hover:underline">
            Men
          </Link>
          <Link href="/collections/women" className="hover:underline">
            Women
          </Link>
          <Link href="/collections/kids" className="hover:underline">
            Kids
          </Link>
        </div>

        {/* Contact + Social */}
        <div className="flex flex-col items-center md:items-start space-y-4">
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <p className="text-sm">📞 0305-2732104</p>
          <p className="text-sm">✉️ support@macstore.com</p>
          <div className="flex space-x-4 mt-2">
            <a
              href="https://facebook.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#1877F2] hover:bg-gray-100 transition"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#E4405F] hover:bg-gray-100 transition"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/30 mt-10 py-4 text-center text-sm text-gray-100">
        © {new Date().getFullYear()} Mac — All rights reserved
      </div>
    </footer>
  );
}
