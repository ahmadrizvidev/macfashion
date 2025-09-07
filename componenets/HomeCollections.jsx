"use client";

import CollectionProducts from "./CollectionProducts"; // Adjust path
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function HomeCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, "products");
        const snapshot = await getDocs(colRef);
        const allProducts = snapshot.docs.map((doc) => doc.data());

        // Normalize and filter only Mens + Womens
        const allowedCollections = ["Mens", "Womens"];
        const normalizedCollections = allProducts
          .map((p) => p.collection?.trim().toLowerCase()) // normalize
          .filter((c) => allowedCollections.map((x) => x.toLowerCase()).includes(c));

        // Deduplicate
        const uniqueCollections = [
          ...new Set(normalizedCollections.map((c) => c.charAt(0).toUpperCase() + c.slice(1))),
        ];

        setCollections(uniqueCollections);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      }
      setLoading(false);
    };

    fetchCollections();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      {collections.map((collectionName) => (
        <CollectionProducts key={collectionName} collectionName={collectionName} />
      ))}
    </div>
  );
}
