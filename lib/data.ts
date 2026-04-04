import { Product, Review } from "./types";

export const products: Product[] = [
  // SHOES
  {
    id: "sh-001",
    name: "Bay Runner Low",
    slug: "bay-runner-low",
    category: "shoes",
    price: 8500,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    ],
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#111111" },
      { name: "Forest", hex: "#2D6A4F" },
    ],
    description: "Low-profile runner with a clean silhouette. Built for all-day comfort with a lightweight sole and premium upper.",
    material: "Mesh upper, rubber sole",
    badge: "hot",
    rating: 4.7,
    reviewCount: 128,
    inStock: true,
    stockCount: 24,
  },
  {
    id: "sh-002",
    name: "Street High OG",
    slug: "street-high-og",
    category: "shoes",
    price: 12000,
    salePrice: 9500,
    images: [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80",
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Tan", hex: "#C4A882" },
    ],
    description: "High-top silhouette with vulcanised sole. The OG colourway that started it all — canvas upper, padded collar.",
    material: "Canvas upper, vulcanised rubber sole",
    badge: "sale",
    rating: 4.5,
    reviewCount: 89,
    inStock: true,
    stockCount: 11,
  },
  {
    id: "sh-003",
    name: "Baywoods Slide",
    slug: "baywoods-slide",
    category: "shoes",
    price: 3500,
    images: [
      "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80",
    ],
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Bone", hex: "#E8E0D5" },
      { name: "Forest", hex: "#2D6A4F" },
    ],
    description: "Embossed logo slide. EVA footbed for cushioning. Pairs clean with sweats or jorts.",
    badge: "new",
    rating: 4.3,
    reviewCount: 54,
    inStock: true,
  },

  // HOODIES
  {
    id: "hd-001",
    name: "Heavyweight Pullover",
    slug: "heavyweight-pullover",
    category: "hoodies",
    price: 5500,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal", hex: "#36454F" },
      { name: "Bone", hex: "#E8E0D5" },
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Black", hex: "#111111" },
    ],
    description: "500gsm French terry pullover. Dropped shoulders, kangaroo pocket, ribbed cuffs and hem. The everyday essential.",
    material: "80% cotton, 20% polyester",
    badge: "hot",
    rating: 4.9,
    reviewCount: 215,
    inStock: true,
    stockCount: 48,
  },
  {
    id: "hd-002",
    name: "Bay Zip-Up",
    slug: "bay-zip-up",
    category: "hoodies",
    price: 6200,
    salePrice: 4800,
    images: [
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#1E293B" },
      { name: "Heather Grey", hex: "#9CA3AF" },
    ],
    description: "Full zip hoodie with oversized fit and brushed interior. YKK zipper, double-layered hood.",
    material: "70% cotton, 30% polyester fleece",
    badge: "sale",
    rating: 4.6,
    reviewCount: 97,
    inStock: true,
  },
  {
    id: "hd-003",
    name: "Cropped Logo Hood",
    slug: "cropped-logo-hood",
    category: "hoodies",
    price: 4200,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Dusty Pink", hex: "#E8B4B8" },
      { name: "Cream", hex: "#FAFAF6" },
      { name: "Sage", hex: "#87AE73" },
    ],
    description: "Cropped fit with embroidered Baywoods chest logo. Perfect layering piece.",
    badge: "new",
    rating: 4.4,
    reviewCount: 61,
    inStock: true,
    stockCount: 18,
  },

  // JORTS
  {
    id: "jt-001",
    name: "Baggy Cargo Jorts",
    slug: "baggy-cargo-jorts",
    category: "jorts",
    price: 3200,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1542219550-37153d387c27?w=800&q=80",
    ],
    sizes: ["28", "30", "32", "34", "36", "38"],
    colors: [
      { name: "Washed Blue", hex: "#7B9DC4" },
      { name: "Black", hex: "#111111" },
      { name: "Stone Wash", hex: "#B5A89A" },
    ],
    description: "Relaxed fit denim shorts with cargo pockets. Adjustable waist tab, frayed hem, utility hardware.",
    material: "100% cotton denim",
    badge: "hot",
    rating: 4.5,
    reviewCount: 73,
    inStock: true,
  },
  {
    id: "jt-002",
    name: "Classic Denim Shorts",
    slug: "classic-denim-shorts",
    category: "jorts",
    price: 2500,
    salePrice: 1800,
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80",
    ],
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Light Wash", hex: "#A8C4E0" },
      { name: "Dark Wash", hex: "#2C3E6B" },
    ],
    description: "Five-pocket straight cut. Clean finish, no distressing. The one you reach for every time.",
    badge: "sale",
    rating: 4.2,
    reviewCount: 45,
    inStock: true,
  },

  // JOGGERS
  {
    id: "jg-001",
    name: "Tech Jogger Slim",
    slug: "tech-jogger-slim",
    category: "joggers",
    price: 4000,
    images: [
      "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80",
      "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#1E293B" },
      { name: "Olive", hex: "#6B7C3D" },
    ],
    description: "Four-way stretch tech fabric with moisture-wicking finish. Tapered leg, zip ankle, secure zip pockets.",
    material: "92% polyester, 8% elastane",
    badge: "new",
    rating: 4.7,
    reviewCount: 134,
    inStock: true,
  },
  {
    id: "jg-002",
    name: "Fleece Jogger Wide",
    slug: "fleece-jogger-wide",
    category: "joggers",
    price: 3500,
    images: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Heather Grey", hex: "#9CA3AF" },
      { name: "Cream", hex: "#FAFAF6" },
      { name: "Brown", hex: "#7C5C3E" },
    ],
    description: "Wide-leg fleece jogger with elasticated waist and drawcord. Deep side pockets, cuffed ankle.",
    badge: "hot",
    rating: 4.6,
    reviewCount: 88,
    inStock: true,
  },

  // SWEATPANTS
  {
    id: "sw-001",
    name: "Classic Sweatpants",
    slug: "classic-sweatpants",
    category: "sweatpants",
    price: 3800,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Charcoal", hex: "#36454F" },
      { name: "Black", hex: "#111111" },
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Bone", hex: "#E8E0D5" },
    ],
    description: "French terry sweatpants. Relaxed through the thigh, tapered to the ankle. Elasticated waist with drawcord.",
    material: "80% cotton, 20% polyester",
    badge: "hot",
    rating: 4.8,
    reviewCount: 189,
    inStock: true,
    stockCount: 62,
  },
  {
    id: "sw-002",
    name: "Wide Leg Sweats",
    slug: "wide-leg-sweats",
    category: "sweatpants",
    price: 4500,
    salePrice: 3200,
    images: [
      "https://images.unsplash.com/photo-1580906853135-5a35bed70abe?w=800&q=80",
      "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Cream", hex: "#FAFAF6" },
      { name: "Sky Blue", hex: "#87CEEB" },
      { name: "Black", hex: "#111111" },
    ],
    description: "Relaxed wide-leg cut, dropped crotch, side seam pockets. Streetwear silhouette at its purest.",
    badge: "sale",
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
  },

  // SHIRTS
  {
    id: "ts-001",
    name: "Baywoods Graphic Tee",
    slug: "baywoods-graphic-tee",
    category: "shirts",
    price: 1800,
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#111111" },
      { name: "Bone", hex: "#E8E0D5" },
    ],
    description: "Oversized boxy tee with original Baywoods graphic print. 220gsm cotton. Pre-washed for softness.",
    material: "100% cotton",
    badge: "new",
    rating: 4.6,
    reviewCount: 201,
    inStock: true,
  },
  {
    id: "ts-002",
    name: "Polo Essential",
    slug: "polo-essential",
    category: "shirts",
    price: 2500,
    images: [
      "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Navy", hex: "#1E293B" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#111111" },
    ],
    description: "Pique polo with embroidered logo at chest. Relaxed fit, ribbed collar and cuffs.",
    material: "100% pique cotton",
    badge: "hot",
    rating: 4.7,
    reviewCount: 155,
    inStock: true,
  },
  {
    id: "ts-003",
    name: "Long Sleeve Essential",
    slug: "long-sleeve-essential",
    category: "shirts",
    price: 2200,
    salePrice: 1600,
    images: [
      "https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?w=800&q=80",
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Charcoal", hex: "#36454F" },
      { name: "Forest", hex: "#2D6A4F" },
    ],
    description: "Slim-fit long sleeve in 180gsm jersey. Clean logo print at sleeve. Everyday streetwear staple.",
    badge: "sale",
    rating: 4.4,
    reviewCount: 82,
    inStock: true,
  },

  // CAPS
  {
    id: "cp-001",
    name: "Bay Snapback",
    slug: "bay-snapback",
    category: "caps",
    price: 1800,
    images: [
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
      "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80",
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Bone", hex: "#E8E0D5" },
    ],
    description: "6-panel structured snapback with embroidered Baywoods wordmark. Flat brim, snap closure.",
    badge: "hot",
    rating: 4.5,
    reviewCount: 144,
    inStock: true,
  },
  {
    id: "cp-002",
    name: "Dad Hat Washed",
    slug: "dad-hat-washed",
    category: "caps",
    price: 1500,
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
      "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800&q=80",
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Washed Black", hex: "#2C2C2C" },
      { name: "Stone", hex: "#B5A89A" },
      { name: "Washed Green", hex: "#4A7C59" },
    ],
    description: "Unstructured 5-panel dad hat in washed cotton twill. Curved brim, brass buckle back strap.",
    badge: "new",
    rating: 4.6,
    reviewCount: 98,
    inStock: true,
  },

  // BELTS
  {
    id: "bl-001",
    name: "Canvas Web Belt",
    slug: "canvas-web-belt",
    category: "belts",
    price: 1200,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    ],
    sizes: ["S/M", "L/XL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Tan", hex: "#C4A882" },
    ],
    description: "Woven canvas belt with gunmetal slide buckle. Trim to fit. Casual everyday piece.",
    rating: 4.3,
    reviewCount: 44,
    inStock: true,
  },
  {
    id: "bl-002",
    name: "Leather Logo Belt",
    slug: "leather-logo-belt",
    category: "belts",
    price: 2800,
    salePrice: 2200,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Tan", hex: "#C4A882" },
    ],
    description: "Full-grain leather belt with debossed Baywoods logo buckle. 3.5cm width. Dress it up or down.",
    material: "Full-grain leather",
    badge: "sale",
    rating: 4.7,
    reviewCount: 56,
    inStock: true,
    stockCount: 8,
  },

  // ACCESSORIES
  {
    id: "ac-001",
    name: "Classic Link Chain",
    slug: "classic-link-chain",
    category: "accessories",
    price: 4500,
    images: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    ],
    sizes: ["45cm", "50cm", "55cm"],
    colors: [
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#D4AF37" },
      { name: "Black", hex: "#111111" },
    ],
    description: "Cuban link chain in surgical steel. Tarnish-resistant, skin-safe. Lobster clasp closure.",
    badge: "hot",
    rating: 4.5,
    reviewCount: 112,
    inStock: true,
  },
  {
    id: "ac-002",
    name: "Bay Tote Bag",
    slug: "bay-tote-bag",
    category: "accessories",
    price: 2500,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Cream", hex: "#FAFAF6" },
      { name: "Forest", hex: "#2D6A4F" },
    ],
    description: "Heavy canvas tote with screen-printed Baywoods logo. Interior zip pocket, reinforced handles. 15L capacity.",
    badge: "new",
    rating: 4.4,
    reviewCount: 78,
    inStock: true,
  },
  {
    id: "ac-003",
    name: "Logo Beanie",
    slug: "logo-beanie",
    category: "accessories",
    price: 1200,
    images: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Forest", hex: "#2D6A4F" },
      { name: "Bone", hex: "#E8E0D5" },
      { name: "Charcoal", hex: "#36454F" },
    ],
    description: "Ribbed knit beanie with embroidered Baywoods patch. One size, fine knit, rolled cuff.",
    badge: "new",
    rating: 4.6,
    reviewCount: 91,
    inStock: true,
  },
];

export const mockReviews: Review[] = [
  {
    id: "r1",
    author: "Jay M.",
    rating: 5,
    date: "2026-03-15",
    body: "Quality is way better than expected. The heavyweight hoodie is unreal — thick, no pilling after multiple washes. Definitely ordering again.",
    verified: true,
    helpful: 24,
  },
  {
    id: "r2",
    author: "Amina W.",
    rating: 4,
    date: "2026-03-08",
    body: "M-Pesa checkout was seamless, got the STK push immediately. Delivery was 3 days. The joggers fit true to size.",
    verified: true,
    helpful: 18,
  },
  {
    id: "r3",
    author: "Kevin O.",
    rating: 5,
    date: "2026-02-28",
    body: "Bought as a gift, came nicely packaged. My brother loves the graphic tee. Will definitely shop here again.",
    verified: true,
    helpful: 12,
  },
  {
    id: "r4",
    author: "Fatuma K.",
    rating: 4,
    date: "2026-02-20",
    body: "The slides are super comfortable. The forest colourway is even better in person. Sizing runs slightly large — go half a size down.",
    verified: true,
    helpful: 9,
  },
  {
    id: "r5",
    author: "Brian N.",
    rating: 5,
    date: "2026-02-14",
    body: "Finally a Kenyan streetwear brand that actually delivers on quality. The chain is solid, no discolouration after weeks of wear.",
    verified: false,
    helpful: 7,
  },
];

export const categories = [
  { slug: "shoes", label: "Shoes", count: 3 },
  { slug: "hoodies", label: "Hoodies", count: 3 },
  { slug: "jorts", label: "Jorts", count: 2 },
  { slug: "joggers", label: "Joggers", count: 2 },
  { slug: "sweatpants", label: "Sweatpants", count: 2 },
  { slug: "shirts", label: "Shirts", count: 3 },
  { slug: "caps", label: "Caps", count: 2 },
  { slug: "belts", label: "Belts", count: 2 },
  { slug: "accessories", label: "Accessories", count: 3 },
] as const;

export const mockOrders: import("./types").Order[] = [
  {
    id: "BW-2026-001",
    date: "2026-03-20",
    status: "delivered",
    items: [
      {
        product: products[0],
        size: "42",
        color: products[0].colors[0],
        quantity: 1,
      },
    ],
    total: 8500,
    trackingNumber: "TRK928374610",
  },
  {
    id: "BW-2026-002",
    date: "2026-03-28",
    status: "shipped",
    items: [
      {
        product: products[3],
        size: "L",
        color: products[3].colors[0],
        quantity: 1,
      },
      {
        product: products[12],
        size: "One Size",
        color: products[12].colors[0],
        quantity: 1,
      },
    ],
    total: 7300,
    trackingNumber: "TRK928374999",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.badge === "hot").slice(0, 8);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.badge === "new");
}

export function getSaleProducts(): Product[] {
  return products.filter((p) => p.salePrice !== undefined);
}

export function getRelatedProducts(product: Product): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
}
