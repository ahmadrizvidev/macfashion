"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white body-font">
      <div className="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
        {/* Logo + Name */}
        <Link
          href="/"
          className="flex title-font font-medium items-center md:justify-start justify-center"
        >
          <Image
            src="/assets/logo.jpg"
            alt="Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="ml-3 text-xl">Mac</span>
        </Link>

        {/* Nav Links */}
        <nav className="sm:ml-6 sm:pl-6 sm:border-l sm:border-gray-700 flex space-x-6 mt-4 sm:mt-0">
          <Link href="/collections/men" className="hover:text-gray-400">
            Men
          </Link>
          <Link href="/collections/women" className="hover:text-gray-400">
            Women
          </Link>
          <Link href="/collections/kids" className="hover:text-gray-400">
            Kids
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-sm text-gray-400 sm:ml-auto sm:mt-0 mt-4">
          © {new Date().getFullYear()} Mac — All rights reserved
        </p>
      </div>
    </footer>
  );
}
