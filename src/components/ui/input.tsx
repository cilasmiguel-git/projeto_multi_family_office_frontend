import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    // base
    "block w-full min-w-0 rounded-xl outline-none",
    "text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))]",
    "bg-[rgb(var(--panel-2))] border border-[rgb(var(--stroke))]/40",
    "px-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors",

    // interações
    "hover:border-[rgb(var(--stroke))]/60",
    "focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 focus-visible:border-[rgb(var(--primary))]/40",

    // estados
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "aria-invalid:border-rose-500/60 aria-invalid:ring-rose-500/25",

    // <input type="file">
    "file:inline-flex file:h-8 file:items-center file:justify-center file:rounded-lg file:border-0",
    "file:bg-white/5 file:px-3 file:text-sm file:text-[rgb(var(--text))] file:hover:bg-white/10",
    "file:transition-colors file:cursor-pointer",

    // seleção de texto
    "selection:bg-[rgb(var(--primary))] selection:text-[rgb(var(--panel-1))]",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-8 text-sm",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
      // borda mais marcada se quiser
      emphasis: {
        subtle: "",
        strong: "border-white/15 hover:border-white/25",
      },
    },
    defaultVariants: {
      size: "md",
      emphasis: "subtle",
    },
  }
)

type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>

/** Input bonitão com tamanhos, hover/focus e estados consistentes */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size, emphasis, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputVariants({ size, emphasis }), className)}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
