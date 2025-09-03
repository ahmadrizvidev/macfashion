"use client";

import { useRouter } from "next/router";
import CollectionProducts from "../../componenets/CollectionProducts";

export default function CollectionPage() {
  const router = useRouter();
  const { collectionName } = router.query;

  if (!collectionName) return null; // Avoid rendering before query is ready

  // Capitalize first letter for display
  const displayName =
    collectionName.charAt(0).toUpperCase() + collectionName.slice(1);

  return <CollectionProducts collectionName={displayName} />;
}
