import { useRef, useEffect } from "react"

type Props = {
  image: string
  height?: string            // e.g. "70vh"
  strength?: number          // 0.1..0.6 (how much it moves)
  overlay?: string           // CSS color for overlay (defaults to surface w/ alpha)
  className?: string
  children?: React.ReactNode
}

/**
 * GPU-friendly parallax using transform and rAF (better than background-attachment on mobile).
 * Moves inner image container opposite to scroll for parallax effect.
 */
export default function ParallaxSection({
  image,
  height = "70vh",
  strength = 0.35,
  overlay = "color-mix(in oklab, var(--surface) 55%, transparent)", // themed overlay
  className = "",
  children,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapperRef.current
    const img = imgRef.current
    if (!wrap || !img) return

    let raf = 0
    const onScroll = () => {
      raf = raf || requestAnimationFrame(() => {
        raf = 0
        const rect = wrap.getBoundingClientRect()
        // progress from 0 (top of viewport) to 1 (bottom)
        const progress = (rect.top + rect.height / 2) / (window.innerHeight + rect.height)
        // move image up/down (negative to move opposite scroll)
        const translate = (progress - 0.5) * rect.height * strength
        img.style.transform = `translate3d(0, ${translate.toFixed(2)}px, 0) scale(1.05)`
      })
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [strength])

  return (
    <section
      ref={wrapperRef}
      className={`relative overflow-hidden isolate ${className}`}
      style={{ height }}
    >
      {/* Image layer */}
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05) contrast(1.05)",
        }}
      />
      {/* Overlay to ensure contrast with theme */}
      <div
        className="absolute inset-0"
        style={{ background: overlay }}
      />
      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center px-[var(--space-lg)]">
        <div className="max-w-[var(--container-max)]">
          {children}
        </div>
      </div>
    </section>
  )
}
