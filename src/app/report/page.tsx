"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { RepoScoreCards } from "@/components/ui/repo-score-cards";
import { MagicCard } from "@/components/ui/magic-card";
import { GlassButton } from "@/components/ui/glass-button";
import { 
  ArrowLeft, 
  Star, 
  GitFork, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  X
} from "lucide-react";

interface Issue {
  severity: string;
  message: string;
  file?: string;
}

interface ScanResult {
  success: boolean;
  repository: {
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    url: string;
  };
  analysis: {
    overallScore: number;
    summary: string;
    codeQuality: {
      score: number;
      issues: Issue[];
    };
    security: {
      score: number;
      issues: Issue[];
    };
    bestPractices: {
      score: number;
      issues: Issue[];
    };
    recommendations: string[];
    languages: Record<string, number>;
  };
}

function ScoreRing({ score, label, size = "lg" }: { score: number; label: string; size?: "lg" | "sm" }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: "#22c55e", text: "text-green-500" };
    if (score >= 60) return { stroke: "#eab308", text: "text-yellow-500" };
    return { stroke: "#ef4444", text: "text-red-500" };
  };
  
  const color = getColor(score);
  const sizeClasses = size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const textSize = size === "lg" ? "text-3xl" : "text-lg";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="#374151"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke={color.stroke}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold ${color.text}`}>
          {score}
        </div>
      </div>
      <span className="text-neutral-400 text-sm font-medium">{label}</span>
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const severityConfig = {
    critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
    warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  };

  const config = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}`}>
      <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-neutral-200 text-sm">{issue.message}</p>
        {issue.file && (
          <p className="text-neutral-500 text-xs mt-1 font-mono">{issue.file}</p>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("scanResult");
    if (stored) {
      setResult(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { repository, analysis } = result;

  const getIssuesForCategory = (category: string) => {
    switch (category) {
      case "codeQuality":
        return analysis.codeQuality.issues;
      case "security":
        return analysis.security.issues;
      case "bestPractices":
        return analysis.bestPractices.issues;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      <BackgroundBeams className="opacity-30 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{repository.fullName}</h1>
            {repository.description && (
              <p className="text-neutral-400 text-sm mt-1">{repository.description}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-neutral-400">
              <Star className="w-4 h-4" />
              <span>{repository.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-400">
              <GitFork className="w-4 h-4" />
              <span>{repository.forks.toLocaleString()}</span>
            </div>
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={analysis.overallScore} label="Overall Score" size="lg" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-white mb-2">Analysis Summary</h2>
              <p className="text-neutral-400">{analysis.summary}</p>
              
              {/* Language breakdown */}
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(analysis.languages || {}).map(([lang, percent]) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs font-medium"
                  >
                    {lang}: {percent}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Score Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <RepoScoreCards 
            scores={analysis} 
            onViewDetails={(category) => setSelectedCategory(selectedCategory === category ? null : category)}
          />
        </motion.div>

        {/* Issues Modal */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedCategory(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <MagicCard
                  className="rounded-2xl border border-neutral-800"
                  gradientColor="#06b6d4"
                  gradientFrom="#06b6d4"
                  gradientTo="#8b5cf6"
                  gradientSize={400}
                  gradientOpacity={0.3}
                >
                  <div className="max-h-[80vh] overflow-hidden">
                    <div className="p-6 border-b border-neutral-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      {selectedCategory === "codeQuality" && "Code Quality Issues"}
                      {selectedCategory === "security" && "Security Issues"}
                      {selectedCategory === "bestPractices" && "Best Practices Issues"}
                    </h3>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-neutral-400 text-sm mt-1">
                    {selectedCategory === "codeQuality" && "Issues related to code organization, naming conventions, and maintainability."}
                    {selectedCategory === "security" && "Security vulnerabilities, hardcoded secrets, and unsafe patterns detected."}
                    {selectedCategory === "bestPractices" && "Missing documentation, tests, or configuration improvements needed."}
                  </p>
                </div>

                    <div className="p-6 overflow-auto max-h-[60vh]">
                      {getIssuesForCategory(selectedCategory).length > 0 ? (
                        <div className="space-y-3">
                          {getIssuesForCategory(selectedCategory).map((issue, i) => (
                            <IssueCard key={i} issue={issue} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <span className="text-green-400 font-medium">No issues found - Great job!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </MagicCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recommendations */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-400" />
              Recommendations
            </h3>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-neutral-300">{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Scan Another */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <GlassButton
            onClick={() => router.push("/")}
            size="lg"
          >
            Scan Another Repository
          </GlassButton>
        </motion.div>
      </div>
    </div>
  );
}
