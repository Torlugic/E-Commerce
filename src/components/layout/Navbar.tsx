import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "./ThemeProvider"
import PromoTicker from "./PromoTicker"
import { brand } from "../../config/brand"
import { getActivePromos } from "../../config/promotions";


/*const promos = [
  { id: 1, text: "🔥 Fall Sale: 10% off all winter tires", href: "/products?cat=tires&promo=fall" },
  { id: 2, text: "⭐ Buy 3, get 1 free on select rims", href: "/products?cat=rims&promo=b3g1" },
  { id: 3, text: "🚚 Free shipping over $499", href: "/shipping" },
] */

export default function Navbar() {
  const { user, logout } = useAuth();
  const promos = getActivePromos();
  const speed = brand.appearance?.tickerSpeedSec ?? 30;
  
  return (
    <div className="sticky top-0 z-50 shadow-sm">
      
      {/* main bar */}
      <header className="h-[var(--header-height)] bg-[var(--surface)] border-b border-[var(--border)]
                         backdrop-blur-sm flex items-center justify-between px-[var(--space-lg)]
                         font-[var(--font-heading)]">
        <Link to={brand.links.home} className="flex items-center gap-[var(--space-sm)] hover:text-[var(--accent)]">
          {/* If you add real logos later, this swaps automatically for each client */}
          <img
            src={brand.logo.light}
            alt={brand.logo.alt}
            className="h-8 w-auto block dark:hidden"
          />
          <img
            src={brand.logo.dark ?? brand.logo.light}
            alt={brand.logo.alt}
            className="h-8 w-auto hidden dark:block"
          />
          <span className="text-xl font-bold">{brand.siteName}</span>
        </Link>

        <nav className="flex gap-[var(--space-md)] items-center">
          <Link to={brand.links.products} className="hover:text-[var(--accent)]">Products</Link>
          <Link to={brand.links.cart} className="hover:text-[var(--accent)]">Cart</Link>
          <ThemeToggle />

          {user ? (
            <>
              <Link to="/profile" className="hover:text-[var(--accent)]">Profile</Link>
              <button onClick={logout} className="hover:text-[var(--accent)]">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[var(--accent)]">Login</Link>
              <Link to="/signup" className="hover:text-[var(--accent)]">Signup</Link>
            </>
          )}
        </nav>
      </header>

      {/* rolling promo banner */}
      <PromoTicker items={promos} speedSec={speed} dismissKey="home-promo-ticker" />

    </div>
  )
}
