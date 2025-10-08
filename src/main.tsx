import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import ParallaxSection from './components/ui/ParallaxSection'
import './index.css'
import NotFound from './components/ui/NotFound'
import { Toaster } from 'react-hot-toast'
import { brand } from './config/brand'
import ProductList from "./components/product/ProductList";
import CartPage from './components/cart/CartPage'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Profile from './components/auth/Profile'
import Layout from './components/layout/Layout'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AuthProvider } from "./contexts/AuthContext";

// Temporary demo pages
function Home() {
  const tagline = 
  brand.marketing?.heroTagline ?? "Hero Tagline Here";
  const sub = 
  brand.marketing?.heroSub ?? "Subtext or supporting text goes here.";
  const title = 
  brand.marketing?.featuredCategoriesTitle ?? "Featured Categories";
  const subtitle = 
  brand.marketing?.featuredCategoriesSubtitle ?? "Tires • Rims • Auto Parts";
  const categories = brand.marketing?.featuredCategories ?? [];
  
  if (!tagline) 
    console.warn("No hero tagline set in brand.marketing.heroTagline");
  else if (!sub)
    console.warn("No hero subtext set in brand.marketing.heroSub");
  else if (!categories || categories.length === 0)
    console.warn("No featured categories set in brand.marketing.featuredCategories");
  else if (!title)
    console.warn("No featured categories title set in brand.marketing.featuredCategoriesTitle");
  else if (!subtitle)
    console.warn("No featured categories subtitle set in brand.marketing.featuredCategoriesSubtitle");
  
    return (
    <div className="space-y-[var(--space-2xl)]">
      <ParallaxSection
        image="https://images.unsplash.com/photo-1517940310602-4d2b220d9b6a?q=80&w=1600&auto=format&fit=crop"
        height="70vh"
        strength={0.35}
      >
        <h1 className="text-4xl md:text-5xl font-[var(--font-heading)] font-bold text-[var(--text)]">
          { tagline }
        </h1>
        <p className="mt-[var(--space-sm)] text-[var(--text-muted)]">
          { sub }
        </p>
        <div className="mt-[var(--space-lg)]">
          <a href="/products" className="btn-primary px-5 py-2 inline-block">
            Shop Now
          </a>
        </div>
      </ParallaxSection>

      <section className="max-w-[var(--container-max)] mx-auto px-[var(--space-lg)]">
        <h2 className="text-2xl font-[var(--font-heading)] font-semibold">
          { title }
        </h2>
        <p className="text-[var(--text-muted)]">
          { subtitle }
        </p>
      </section>
    </div>
  )
}

function Products() { return <ProductList /> }

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> }, 
      { path: 'products', element: <Products /> }, 
      { path: 'cart', element: <CartPage /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "profile", element: <Profile /> },
      { path: '*', element: <NotFound /> }, // catch-all 404
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
