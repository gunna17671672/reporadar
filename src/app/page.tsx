"use client";

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HyperText } from "@/components/ui/hyper-text";
import { Typewriter } from "@/components/ui/typewriter-text";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverButton } from "@/components/ui/hover-button";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [heroVisible, setHeroVisible] = useState(true);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Simple clean crossfade - both visible during transition
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const beamsOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  // Track when hero should allow pointer events
  useMotionValueEvent(heroOpacity, "change", (latest) => {
    setHeroVisible(latest > 0.3);
  });

  const scrollToNext = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  const handleScan = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan repository");
      }

      // Store the result in sessionStorage and navigate to report
      sessionStorage.setItem("scanResult", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      {/* Hero Section with Gradient Animation */}
      <motion.section 
        style={{ opacity: heroOpacity }}
        className={`h-screen fixed top-0 left-0 right-0 z-20 ${heroVisible ? "" : "pointer-events-none"}`}
      >
        <BackgroundGradientAnimation>
          <main className="absolute z-50 inset-0 flex min-h-screen w-full flex-col items-center justify-center px-8">
            <div className="pointer-events-auto">
              <HyperText 
                text="RepoRadar" 
                className="text-6xl md:text-8xl font-bold text-white tracking-tight"
                duration={800}
                animateOnLoad={true}
              />
            </div>
            <div className="mt-6 text-lg md:text-xl text-cyan-300/90 font-medium text-center max-w-2xl">
              <Typewriter 
                text="AI-Powered Code Quality & Security Scanner for GitHub Repositories"
                speed={40}
                cursor="|"
                className="text-cyan-300/90"
              />
            </div>
            
            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-10 cursor-pointer pointer-events-auto flex flex-col items-center gap-2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              onClick={scrollToNext}
            >
              <span className="text-white/40 text-sm tracking-widest uppercase">Scroll</span>
              <ChevronDown className="w-8 h-8 text-white/60" />
            </motion.div>
          </main>
        </BackgroundGradientAnimation>
      </motion.section>

      {/* Section with Background Beams */}
      <motion.section 
        style={{ opacity: beamsOpacity }}
        className="min-h-screen fixed top-0 left-0 right-0 z-10 bg-neutral-950 flex items-center justify-center"
      >
        <BackgroundBeams />
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Analyze Any Repository
          </motion.h2>
          <TextGenerateEffect
            words="Paste your GitHub repository URL and get instant AI-powered insights on code quality, security vulnerabilities, and best practices."
            className="text-lg md:text-xl text-neutral-400 mb-10 font-normal"
            duration={0.5}
          />
          
          {/* GitHub URL Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="https://github.com/username/repository"
              className="w-full sm:w-96 px-6 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              disabled={isLoading}
            />
            <HoverButton 
              className="w-full sm:w-auto" 
              onClick={handleScan}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Scan Repository"
              )}
            </HoverButton>
          </motion.div>
          
          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}
        </div>
      </motion.section>
    </div>
  );
}
