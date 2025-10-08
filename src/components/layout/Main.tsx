import { Outlet } from "react-router-dom"

export default function Main() {
  return (
    <main className="flex-1 px-[var(--space-lg)] py-[var(--space-md)]">
      <Outlet />
    </main>
  )
}
