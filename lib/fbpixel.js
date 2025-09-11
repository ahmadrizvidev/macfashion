let ReactPixel;

export const initFBPixel = async () => {
  if (typeof window !== "undefined") {
    // dynamically import only on the client
    if (!ReactPixel) {
      const mod = await import("react-facebook-pixel");
      ReactPixel = mod.default;
    }
    ReactPixel.init("1715629979139193"); // ✅ Your Pixel ID
    ReactPixel.pageView(); // Track page views
  }
};

export const trackEvent = async (event, data) => {
  if (typeof window !== "undefined") {
    if (!ReactPixel) {
      const mod = await import("react-facebook-pixel");
      ReactPixel = mod.default;
    }
    ReactPixel.track(event, data);
  }
};

// Predefined eCommerce events
export const trackViewContent = async (product) => {
  await trackEvent("ViewContent", {
    content_name: product.title,
    content_ids: [product.id],
    content_type: "product",
    value: product.price,
    currency: "PKR",
  });
};

export const trackAddToCart = async (
  product,
  quantity = 1,
  selectedCategory = "",
  selectedColor = ""
) => {
  await trackEvent("AddToCart", {
    content_name: product.title,
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: "PKR",
    quantity,
    category: selectedCategory,
    color: selectedColor,
  });
};

export const trackInitiateCheckout = async (
  product,
  quantity = 1,
  selectedCategory = "",
  selectedColor = ""
) => {
  await trackEvent("InitiateCheckout", {
    content_name: product.title,
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: "PKR",
    quantity,
    category: selectedCategory,
    color: selectedColor,
  });
};

export const trackPurchase = async (
  product,
  quantity = 1,
  selectedCategory = "",
  selectedColor = ""
) => {
  await trackEvent("Purchase", {
    content_name: product.title,
    content_ids: [product.id],
    content_type: "product",
    value: product.price * quantity,
    currency: "PKR",
    quantity,
    category: selectedCategory,
    color: selectedColor,
  });
};
