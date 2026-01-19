import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

const glassButtonVariants = cva(
  "relative cursor-pointer rounded-full transition-all bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const glassButtonTextVariants = cva(
  "relative block select-none text-white",
  {
    variants: {
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, ...props }, ref) => {
    return (
      <div className={cn("relative inline-block group", className)}>
        <button
          className={cn(glassButtonVariants({ size }))}
          ref={ref}
          {...props}
        >
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName
            )}
          >
            {children}
          </span>
        </button>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-50 -z-10" />
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };