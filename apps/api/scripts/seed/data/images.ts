/**
 * Fashion/Clothing Product Images
 * 
 * Uses Unsplash for high-quality fashion-specific product images.
 */

// Fashion image keywords by category
const CATEGORY_KEYWORDS: Record<string, string> = {
    "Men's Clothing": "mens-fashion,menswear,mens-clothing",
    "Women's Clothing": "womens-fashion,womenswear,dress",
    "Children's Clothing": "kids-fashion,children-clothing",
    "Accessories": "fashion-accessories,handbag,jewelry",
    "Footwear": "shoes,sneakers,boots",
};

/**
 * Get fashion-specific product image URL from Unsplash
 */
export function getFashionImageUrl(productName: string, categoryName: string): string {
    const keywords = CATEGORY_KEYWORDS[categoryName] || "fashion,clothing";

    // Create a stable hash from product name for consistent images
    const hash = productName
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const seed = (hash % 1000) + 1;

    // Use Unsplash Source API with fashion keywords
    return `https://source.unsplash.com/400x400/?${encodeURIComponent(keywords)}&sig=${seed}`;
}

/**
 * Alternative: Use Lorem Picsum with grayscale filter for consistent look
 * Uncomment to use instead of Unsplash
 */
export function getPlaceholderImageUrl(productName: string): string {
    const hash = productName
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seed = (hash % 1000) + 1;
    return `https://picsum.photos/seed/${seed}/400/400`;
}
