"use client";

import { useMotionValue, motion, useMotionTemplate } from "motion/react";
import React, { MouseEvent as ReactMouseEvent, useState } from "react";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { cn } from "@/lib/utils";

export const CardSpotlight = ({
  children,
  radius = 350,
  color = "#262626",
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const [isHovering, setIsHovering] = useState(false);
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  return (
    <div
      className={cn(
        "group/spotlight p-10 rounded-md relative border border-neutral-800 bg-black dark:border-neutral-800 overflow-hidden",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Dot matrix effect layer - full card coverage */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/spotlight:opacity-100">
        {isHovering && (
          <CanvasRevealEffect
            animationSpeed={5}
            containerClassName="absolute inset-0"
            colors={[
              [120, 180, 255],
              [200, 140, 255],
            ]}
            dotSize={4}
            showGradient={false}
            opacities={[0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 1]}
          />
        )}
      </div>
      
      {/* Spotlight glow that follows mouse */}
      <motion.div
        className="pointer-events-none absolute z-[1] -inset-px rounded-md opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              rgba(120, 180, 255, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Content on top */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
