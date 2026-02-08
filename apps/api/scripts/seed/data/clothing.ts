/**
 * Clothing Store Data
 * 
 * Product names, categories, colors, sizes, and image sources
 * specifically designed for a clothing retail store.
 */

export const CLOTHING_CATEGORIES = [
    { name: "Men's Clothing", color: "#2E7D32" },
    { name: "Women's Clothing", color: "#C2185B" },
    { name: "Children's Clothing", color: "#7B1FA2" },
    { name: "Accessories", color: "#F57C00" },
    { name: "Footwear", color: "#1976D2" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;

export const COLORS = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Navy Blue", hex: "#000080" },
    { name: "Gray", hex: "#808080" },
    { name: "Red", hex: "#FF0000" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Brown", hex: "#8B4513" },
    { name: "Green", hex: "#228B22" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Light Blue", hex: "#ADD8E6" },
] as const;

// Base product templates by category
export const PRODUCT_TEMPLATES: Record<string, string[]> = {
    "Men's Clothing": [
        "Classic Cotton T-Shirt",
        "Slim Fit Dress Shirt",
        "Casual Polo Shirt",
        "Denim Jeans",
        "Chino Pants",
        "Formal Suit Jacket",
        "Casual Blazer",
        "Wool Sweater",
        "Cotton Hoodie",
        "Linen Summer Shirt",
        "Leather Belt",
        "Silk Tie",
        "Cotton Socks Pack",
        "Boxer Briefs Set",
        "Winter Jacket",
        "Windbreaker",
        "Cargo Shorts",
        "Swim Trunks",
        "Track Pants",
        "Fleece Vest",
    ],
    "Women's Clothing": [
        "Floral Summer Dress",
        "Elegant Evening Gown",
        "Casual Maxi Dress",
        "Fitted Blouse",
        "Silk Camisole",
        "High-Waist Jeans",
        "Pencil Skirt",
        "A-Line Skirt",
        "Cardigan Sweater",
        "Cashmere Pullover",
        "Trench Coat",
        "Leather Jacket",
        "Yoga Leggings",
        "Wide-Leg Pants",
        "Jumpsuit",
        "Romper",
        "Wrap Dress",
        "Turtleneck Top",
        "Crop Top",
        "Oversized Sweater",
    ],
    "Children's Clothing": [
        "Kids Cotton T-Shirt",
        "Children's Jeans",
        "School Uniform Shirt",
        "Kids Hoodie",
        "Girls' Party Dress",
        "Boys' Shorts",
        "Baby Onesie",
        "Kids Pajama Set",
        "School Cardigan",
        "Rain Jacket",
        "Winter Coat Kids",
        "Kids Tracksuit",
        "Girls' Leggings",
        "Boys' Polo Shirt",
        "Kids Swimwear",
        "Baby Romper",
        "Toddler Dress",
        "Kids Sneakers",
        "School Skirt",
        "Sports Jersey Kids",
    ],
    "Accessories": [
        "Leather Wallet",
        "Canvas Backpack",
        "Crossbody Bag",
        "Silk Scarf",
        "Wool Beanie",
        "Baseball Cap",
        "Leather Gloves",
        "Sunglasses",
        "Watch Strap",
        "Cufflinks Set",
        "Tote Bag",
        "Clutch Purse",
        "Hair Accessories Set",
        "Jewelry Box",
        "Umbrella",
        "Travel Bag",
        "Laptop Bag",
        "Phone Case",
        "Keychain Set",
        "Belt Buckle",
    ],
    "Footwear": [
        "Classic Leather Sneakers",
        "Running Shoes",
        "Formal Oxford Shoes",
        "Loafers",
        "High Heel Pumps",
        "Flat Ballet Shoes",
        "Ankle Boots",
        "Winter Boots",
        "Sandals",
        "Flip Flops",
        "Sports Sneakers",
        "Canvas Shoes",
        "Moccasins",
        "Espadrilles",
        "Platform Sandals",
        "Wedge Heels",
        "Chelsea Boots",
        "Hiking Boots",
        "Slippers",
        "Kids Sneakers",
    ],
};

/**
 * Get placeholder image URL for a product
 * Uses picsum.photos for high-quality placeholder images
 */
export function getProductImageUrl(productName: string, categoryName: string): string {
    // Use a hash of the product name for consistent image per product
    const hash = productName
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Generate a seed between 1-1000 based on the product name
    const seed = (hash % 1000) + 1;

    // Return a 400x400 product image
    return `https://picsum.photos/seed/${seed}/400/400`;
}

/**
 * Generate an EAN-13 compatible barcode
 */
export function generateBarcode(index: number): string {
    const base = "860" + String(index).padStart(9, "0");
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(base[i]!) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return base + checkDigit;
}

/**
 * Generate SKU from product name
 */
export function generateSku(productName: string, size: string, index: number): string {
    const prefix = productName
        .split(" ")
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .substring(0, 3);
    return `${prefix}-${size}-${String(index).padStart(4, "0")}`;
}

// Uzbek names for customer generation
export const UZBEK_FIRST_NAMES = {
    male: [
        "Sardor", "Bekzod", "Jasur", "Alisher", "Rustam", "Sherzod", "Jahongir",
        "Dilshod", "Bobur", "Ulugbek", "Temur", "Mirza", "Farrukh", "Akmal",
        "Ravshan", "Sanjar", "Oybek", "Nodir", "Aziz", "Karim",
    ],
    female: [
        "Aziza", "Dilnoza", "Shahzoda", "Gulnora", "Nodira", "Zarina", "Malika",
        "Sitora", "Nilufar", "Madina", "Feruza", "Gulbahor", "Dilorom", "Sevara",
        "Munisa", "Kamola", "Lola", "Shirin", "Iroda", "Zebiniso",
    ],
} as const;

export const UZBEK_LAST_NAMES = [
    "Karimov", "Rustamov", "Alimov", "Yusupov", "Umarov", "Nazarov", "Rahimov",
    "Mirzayev", "Saidov", "Toshmatov", "Ergashev", "Xolmatov", "Jurayev",
    "Abdullayev", "Mamadaliyev", "Qosimov", "Ismoilov", "Berdiyev", "Normatov",
    "Qurbonov",
] as const;

export const UZBEK_PHONE_PREFIXES = [
    "+998 90", "+998 91", "+998 93", "+998 94", "+998 95",
    "+998 97", "+998 98", "+998 99", "+998 33", "+998 50",
] as const;
