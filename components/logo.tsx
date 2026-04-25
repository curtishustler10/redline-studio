import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-mono inline-flex items-baseline tracking-tight whitespace-nowrap", className)}>
      <span className="text-[#C41F1F]">&gt;</span>
      <span className="text-[#C41F1F]">red</span>
      <span>line_studio</span>
      <span
        aria-hidden
        className="ml-[0.15em] inline-block bg-[#C41F1F]"
        style={{ width: "0.5em", height: "1em", transform: "translateY(0.12em)" }}
      />
    </span>
  )
}
