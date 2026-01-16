import InteractiveGradientBackground from "@/components/interactive-gradient-background";
import { HyperText } from "@/components/ui/hyper-text";
import { Typewriter } from "@/components/ui/typewriter-text";
import { SmoothCursor } from "@/components/ui/smooth-cursor";

export default function Home() {
  return (
    <InteractiveGradientBackground className="min-h-screen" intensity={1} interactive={true} dark={false}>
      <SmoothCursor />
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-8">
        <HyperText 
          text="RepoRadar" 
          className="text-6xl md:text-8xl font-bold text-white tracking-tight"
          duration={800}
          animateOnLoad={true}
        />
        <div className="mt-6 text-lg md:text-xl text-cyan-300/90 font-medium text-center max-w-2xl">
          <Typewriter 
            text="AI-Powered Code Quality & Security Scanner for GitHub Repositories"
            speed={40}
            cursor="|"
            className="text-cyan-300/90"
          />
        </div>
      </main>
    </InteractiveGradientBackground>
  );
}
