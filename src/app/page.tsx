"use client";

import { GradientBackground } from "@/components/ui/paper-design-shader-background";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HyperText } from "@/components/ui/hyper-text";
import { Typewriter } from "@/components/ui/typewriter-text";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverButton } from "@/components/ui/hover-button";
import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Loader2, Github, Linkedin, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactLenis } from "lenis/react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
    <ReactLenis root>
      <main>
        <article>
          {/* Hero Section with Gradient Animation - Sticky */}
          <section className="h-screen w-full sticky top-0 relative">
            <GradientBackground />
              <div className="absolute z-50 inset-0 flex min-h-screen w-full flex-col items-center justify-center px-8">
                <HyperText 
                  text="REPORADAR" 
                  className="text-8xl md:text-[14rem] font-light text-white tracking-tight leading-none"
                  duration={800}
                  animateOnLoad={true}
                />
                <div className="mt-4 text-xl md:text-2xl text-white/80 font-medium text-center max-w-3xl">
                  <Typewriter 
                    text="AI-Powered Code Quality & Security Scanner for GitHub Repositories"
                    speed={40}
                    cursor="|"
                    className="text-white/80"
                  />
                </div>
                
                {/* Social Links */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                  className="mt-8 flex items-center gap-4"
                >
                  <a
                    href="https://github.com/gunna17671672"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  >
                    <Github className="w-5 h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">GitHub</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ganesh-vudaru-7965a1330"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-[#0077b5]/20 hover:border-[#0077b5]/40 transition-all duration-300"
                  >
                    <Linkedin className="w-5 h-5 text-white/70 group-hover:text-[#0077b5] group-hover:scale-110 transition-all duration-300" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">LinkedIn</span>
                  </a>
                  <a
                    href="mailto:pratikvudaru@gmail.com"
                    className="group relative p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300"
                  >
                    <Mail className="w-5 h-5 text-white/70 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Email</span>
                  </a>
                </motion.div>
                
                {/* Scroll indicator */}
                <motion.div 
                  className="absolute bottom-10 cursor-pointer flex flex-col items-center gap-2"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  onClick={scrollToNext}
                >
                  <span className="text-white/40 text-sm tracking-widest uppercase">Scroll</span>
                  <ChevronDown className="w-8 h-8 text-white/60" />
                </motion.div>
              </div>
            </section>

          {/* Section with Background Beams - Slides up over hero */}
          <section className="h-screen sticky top-0 rounded-t-3xl overflow-hidden bg-neutral-950 flex items-center justify-center shadow-[0_-20px_0_10px_rgb(10,10,10)]">
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
          </section>
        </article>
      </main>
    </ReactLenis>
  );
}
