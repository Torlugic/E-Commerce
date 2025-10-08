export type Brand = {
  siteName: string;
  logo: {
    light: string;   // URL or /public path
    dark?: string;
    alt: string;
  };
  company: {
    legalName: string;
    phone?: string;
    email?: string;
    address?: string;        // single line or your own structured type
    supportEmail?: string;
  };
  locale: {
    country: "CA" | "US" | string;
    language: "en" | "fr" | string;
    currency: "CAD" | "USD" | string;
    measurement: "metric" | "imperial";
    timezone?: string;       // e.g., "America/Moncton"
  };
  links: {
    home: string;
    products: string;
    cart: string;
    shipping?: string;
    returns?: string;
    privacy?: string;
    terms?: string;
    contact?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
  };
  marketing?: {
    heroTagline?: string;
    heroSub?: string;
    featuredCategoriesTitle?: string;
    featuredCategoriesSubtitle?: string;
    featuredCategories?: { name: string; href: string }[];
  };
  appearance?: {
    tickerHeight?: string;  // e.g. "40px" or "2.5rem"
    tickerSpeedSec?: number; // override speed if needed
  };
};

export const brand: Brand = {
  siteName: "E-Commerce",
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg",
    alt: "E-Commerce",
  },
  company: {
    legalName: "E-Commerce",
    phone: "+1 (506) 555-0123",
    email: "hello@example.com",
    address: "123 Main St, Moncton, NB, Canada",
    supportEmail: "support@example.com",
  },
  locale: {
    country: "CA",
    language: "en",
    currency: "CAD",
    measurement: "metric",
    timezone: "America/Moncton",
  },
  links: {
    home: "/",
    products: "/products",
    cart: "/cart",
    shipping: "/shipping",
    returns: "/returns",
    privacy: "/privacy",
    terms: "/terms",
    contact: "/contact",
    instagram: "https://instagram.com/yourbrand",
    facebook: "https://facebook.com/yourbrand",
    x: "https://x.com/yourbrand",
  },
  marketing: {
    heroTagline: "Find the right style for your site.",
    heroSub: "Whiteglove E-Commerce.",
    
    featuredCategoriesTitle: "Featured Categories",
    featuredCategoriesSubtitle: "Title 1, Title 2, Title 3, and more.",
    featuredCategories: [
        { name: "Title 1", href: "/products?cat=title-1" },
        { name: "Title 2", href: "/products?cat=title-2" },
        { name: "Title 3", href: "/products?cat=title-3" },
    ]
  },
  appearance: {
    tickerHeight: "30px",       // override the default 32px
    tickerSpeedSec: 20,         // optional override for animation speed
  },
};
