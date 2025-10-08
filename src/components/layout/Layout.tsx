import Navbar from "./Navbar"
import Footer from "./Footer"
import Main from "./Main"

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-[var(--font-body)]">
      <Navbar />
      <Main />
      <Footer />
    </div>
  )
}
