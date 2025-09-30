// src/components/ui/dialog.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

type Size = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const sizeMap: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
  full: "max-w-[min(96vw,1100px)]",
};

export const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-md",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

type DialogContentProps = React.ComponentPropsWithoutRef<"div"> & {
  size?: Size;
  hideClose?: boolean;
};

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "lg", hideClose = false, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />

      {/* Wrapper que centraliza (evita conflito de animação com translate) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "relative w-full",
            sizeMap[size],
            "rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]",
            "shadow-[0_20px_70px_-15px_rgba(0,0,0,0.65)] ring-1 ring-white/5",
            "outline-none p-6 sm:p-7 grid gap-4",
            "data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0",
            "max-h-[85vh] overflow-y-auto",
            className
          )}
          {...props}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {!hideClose && (
            <DialogClose asChild>
              <button
                aria-label="Fechar"
                className={cn(
                  "absolute right-3.5 top-3.5 inline-flex items-center justify-center",
                  "h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10",
                  "border border-white/10 transition",
                  "focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                )}
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </DialogClose>
          )}

          {children}
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  )
);
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-end gap-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-[rgb(var(--muted))]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";
