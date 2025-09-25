"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaSpinner } from "react-icons/fa";
import CollectionProducts from "./CollectionProducts";

export default function HomeCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define the specific collection order
  const collectionOrder = [
    "Mens Winter Collection",
    "Mens Summer Collection", 
    "Womens Winter Collection",
    "Womens Summer Collection",
    "Tracksuit",
    "Mens Shawl"
  ];

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const productsCollectionRef = collection(db, "products");
        const snapshot = await getDocs(productsCollectionRef);
        
        // Extract unique collection names from the products data
        const allCollectionNames = snapshot.docs
          .map(doc => doc.data().collection)
          .filter(name => typeof name === 'string' && name.trim() !== '');

        // Use a Set to get only unique, non-empty collection names
        const uniqueCollections = [...new Set(allCollectionNames)];

        // Sort collections according to the specific order
        const sortedCollections = uniqueCollections.sort((a, b) => {
          const indexA = collectionOrder.indexOf(a);
          const indexB = collectionOrder.indexOf(b);
          
          // If both are in the predefined order, sort by that order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          
          // If only A is in predefined order, it comes first
          if (indexA !== -1) return -1;
          
          // If only B is in predefined order, it comes first  
          if (indexB !== -1) return 1;
          
          // If neither are in predefined order, sort alphabetically
          return a.localeCompare(b);
        });

        setCollections(sortedCollections);
      } catch (err) {
        console.error("Failed to fetch collections:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );
  }

  return (
    <div>
      {collections.length > 0 ? (
        collections.map((collectionName) => (
          <CollectionProducts key={collectionName} collectionName={collectionName} />
        ))
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p>No collections found in the database.</p>
        </div>
      )}
    </div>
  );
}