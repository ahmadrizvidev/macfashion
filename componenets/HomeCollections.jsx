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

        // Get unique collection names
        const uniqueCollections = [
          ...new Set(allProducts.map((p) => p.collection)),
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
        <CollectionProducts
          key={collectionName}
          collectionName={collectionName}
        />
      ))}
    </div>
  );
}
