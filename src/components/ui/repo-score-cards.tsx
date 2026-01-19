"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { LiquidCard, CardContent, CardHeader } from "@/components/ui/liquid-glass-card"
import { LiquidButton } from "@/components/ui/liquid-glass-button"

// Types and Enums
enum Strength {
  None = "none",
  Weak = "weak",
  Moderate = "moderate",
  Strong = "strong",
}

interface RepoScoreProps {
  title: string
  description: string
  score: number | null
  icon?: React.ReactNode
  issues?: Array<{ severity: string; message: string; file?: string }>
  onLearnMore?: () => void
}

interface RepoScoreCardProps {
  children?: React.ReactNode
}

interface RepoScoreDisplayProps {
  value: Score
  max: number
}

interface RepoScoreHalfCircleProps {
  value: Score
  max: number
}

interface RepoScoreHeaderProps {
  title?: string
  strength?: Strength
  icon?: React.ReactNode
}

type CounterContextType = {
  getNextIndex: () => number
}

type Score = number | null
type StrengthColors = Record<Strength, string[]>

// Utils Class
class Utils {
  static LOCALE = "en-US"

  static easings = {
    easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    easeOut: "cubic-bezier(0.33, 1, 0.68, 1)",
  }

  static circumference(r: number): number {
    return 2 * Math.PI * r
  }

  static formatNumber(n: number) {
    return new Intl.NumberFormat(this.LOCALE).format(n)
  }

  static getStrength(score: Score, maxScore: number): Strength {
    if (!score && score !== 0) return Strength.None

    const percent = score / maxScore

    if (percent >= 0.8) return Strength.Strong
    if (percent >= 0.6) return Strength.Moderate

    return Strength.Weak
  }

  static randomHash(length = 4): string {
    const chars = "abcdef0123456789"
    const bytes = crypto.getRandomValues(new Uint8Array(length))

    return [...bytes].map((b) => chars[b % chars.length]).join("")
  }
}

// Context
const CounterContext = createContext<CounterContextType | undefined>(undefined)

const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const counterRef = useRef(0)
  const getNextIndex = useCallback(() => {
    return counterRef.current++
  }, [])

  return <CounterContext.Provider value={{ getNextIndex }}>{children}</CounterContext.Provider>
}

const useCounter = () => {
  const context = useContext(CounterContext)

  if (!context) {
    throw new Error("useCounter must be used within a CounterProvider")
  }

  return context.getNextIndex
}

// Components
function RepoScoreCard({ children }: RepoScoreCardProps) {
  const getNextIndex = useCounter()
  const indexRef = useRef<number | null>(null)
  const animationRef = useRef(0)
  const [appearing, setAppearing] = useState(false)

  if (indexRef.current === null) {
    indexRef.current = getNextIndex()
  }

  useEffect(() => {
    const delayInc = 200
    const delay = 300 + indexRef.current! * delayInc

    animationRef.current = window.setTimeout(() => setAppearing(true), delay)

    return () => {
      clearTimeout(animationRef.current)
    }
  }, [])

  if (!appearing) return null

  return (
    <LiquidCard className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-both">
      <CardContent className="p-6">{children}</CardContent>
    </LiquidCard>
  )
}

function RepoScoreDisplay({ value, max }: RepoScoreDisplayProps) {
  const hasValue = value !== null
  const digits = String(Math.floor(value ?? 0)).split("")
  const maxFormatted = Utils.formatNumber(max)
  const label = hasValue ? `out of ${maxFormatted}` : "No score"

  return (
    <div className="absolute bottom-0 w-full text-center">
      <div className="text-4xl font-medium h-15 overflow-hidden relative">
        <div className="absolute inset-0 opacity-0">
          <div className="inline-block">0</div>
        </div>
        <div className="absolute inset-0">
          {hasValue &&
            digits.map((digit, i) => (
              <span
                key={i}
                className="inline-block animate-in slide-in-from-bottom-full duration-800 delay-400 fill-mode-both"
                style={{
                  animationDelay: `${400 + i * 100}ms`,
                  animationDuration: `${800 + i * 300}ms`,
                }}
              >
                {digit}
              </span>
            ))}
        </div>
      </div>
      <div className="text-sm text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  )
}

function RepoScoreHalfCircle({ value, max }: RepoScoreHalfCircleProps) {
  const strokeRef = useRef<SVGCircleElement>(null)
  const gradIdRef = useRef(`grad-${Utils.randomHash()}`)
  const gradId = gradIdRef.current
  const gradStroke = `url(#${gradId})`
  const radius = 45
  const dist = Utils.circumference(radius)
  const distHalf = dist / 2
  const distFourth = distHalf / 2
  const strokeDasharray = `${distHalf} ${distHalf}`
  const distForValue = Math.min((value as number) / max, 1) * -distHalf
  const strokeDashoffset = value !== null ? distForValue : -distFourth
  const strength = Utils.getStrength(value, max)
  const strengthColors: StrengthColors = {
    none: ["hsl(220, 13%, 69%)", "hsl(220, 9%, 46%)"],
    weak: ["hsl(0, 84%, 80%)", "hsl(0, 84%, 60%)", "hsl(0, 84%, 40%)"],
    moderate: ["hsl(38, 92%, 80%)", "hsl(38, 92%, 60%)", "hsl(38, 92%, 40%)"],
    strong: ["hsl(142, 71%, 80%)", "hsl(142, 71%, 60%)", "hsl(142, 71%, 40%)"],
  }
  const colorStops = strengthColors[strength]

  useEffect(() => {
    const strokeStart = 400
    const duration = 1400

    strokeRef.current?.animate(
      [
        { strokeDashoffset: "0", offset: 0 },
        { strokeDashoffset: "0", offset: strokeStart / duration },
        { strokeDashoffset: strokeDashoffset.toString() },
      ],
      {
        duration,
        easing: Utils.easings.easeInOut,
        fill: "forwards",
      },
    )
  }, [value, max, strokeDashoffset])

  return (
    <svg className="block mx-auto w-auto max-w-full h-32" viewBox="0 0 100 50" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {colorStops.map((stop, i) => {
            const offset = `${(100 / (colorStops.length - 1)) * i}%`
            return <stop key={i} offset={offset} stopColor={stop} />
          })}
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="10" transform="translate(50, 50.5)">
        <circle className="stroke-muted/20" r={radius} />
        <circle ref={strokeRef} stroke={gradStroke} strokeDasharray={strokeDasharray} r={radius} />
      </g>
    </svg>
  )
}

function RepoScoreHeader({ title, strength, icon }: RepoScoreHeaderProps) {
  const hasStrength = strength !== Strength.None

  const getBadgeVariant = (strength: Strength) => {
    switch (strength) {
      case Strength.Weak:
        return "destructive"
      case Strength.Moderate:
        return "secondary"
      case Strength.Strong:
        return "default"
      default:
        return "secondary"
    }
  }

  const getBadgeClassName = (strength: Strength) => {
    switch (strength) {
      case Strength.Weak:
        return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
      case Strength.Moderate:
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300"
      case Strength.Strong:
        return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300"
      default:
        return ""
    }
  }

  const getStrengthLabel = (strength: Strength) => {
    switch (strength) {
      case Strength.Weak:
        return "Needs Work"
      case Strength.Moderate:
        return "Good"
      case Strength.Strong:
        return "Excellent"
      default:
        return ""
    }
  }

  return (
    <CardHeader className="flex flex-row items-center justify-between gap-4 pb-6 px-0 animate-in fade-in slide-in-from-bottom-12 duration-800 delay-0">
      <div className="flex items-center gap-2">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <h2 className="text-lg font-medium truncate">{title}</h2>
      </div>
      {hasStrength && strength && (
        <LiquidButton
          variant={getBadgeVariant(strength)}
          className={`uppercase text-xs font-semibold shrink-0 animate-in fade-in slide-in-from-bottom-12 h-7 px-3 duration-800 delay-800 ${getBadgeClassName(strength)}`}
        >
          {getStrengthLabel(strength)}
        </LiquidButton>
      )}
    </CardHeader>
  )
}

function RepoScore({ title, description, score, icon, issues, onLearnMore }: RepoScoreProps) {
  const hasScore = score !== null
  const max = 100
  const strength = Utils.getStrength(score, max)
  const issueCount = issues?.length || 0

  return (
    <RepoScoreCard>
      <RepoScoreHeader title={title} strength={strength} icon={icon} />
      <div className="relative mb-6 animate-in fade-in slide-in-from-bottom-12 duration-800 delay-100">
        <RepoScoreHalfCircle value={score} max={max} />
        <RepoScoreDisplay value={score} max={max} />
      </div>
      <p className="text-muted-foreground text-center text-sm mb-6 min-h-[3rem] animate-in fade-in slide-in-from-bottom-12 duration-800 delay-200">
        {description}
      </p>
      {issueCount > 0 && (
        <div className="text-center mb-4 animate-in fade-in slide-in-from-bottom-12 duration-800 delay-300">
          <span className="text-sm text-muted-foreground">
            {issueCount} {issueCount === 1 ? "issue" : "issues"} found
          </span>
        </div>
      )}
      {onLearnMore && (
        <LiquidButton
          variant="default"
          onClick={onLearnMore}
          className="w-full h-12 text-base animate-in fade-in slide-in-from-bottom-12 duration-800 delay-300"
        >
          View Details
        </LiquidButton>
      )}
    </RepoScoreCard>
  )
}

// Main Component for displaying all repo scores
interface RepoScoreCardsProps {
  scores: {
    codeQuality: { score: number; issues: Array<{ severity: string; message: string; file?: string }> }
    security: { score: number; issues: Array<{ severity: string; message: string; file?: string }> }
    bestPractices: { score: number; issues: Array<{ severity: string; message: string; file?: string }> }
  }
  onViewDetails?: (category: string) => void
}

export function RepoScoreCards({ scores, onViewDetails }: RepoScoreCardsProps) {
  const scoreData = [
    {
      title: "Code Quality",
      description: "Measures code organization, naming conventions, complexity, and maintainability.",
      score: scores.codeQuality.score,
      issues: scores.codeQuality.issues,
      category: "codeQuality",
    },
    {
      title: "Security",
      description: "Analyzes potential vulnerabilities, hardcoded secrets, and insecure patterns.",
      score: scores.security.score,
      issues: scores.security.issues,
      category: "security",
    },
    {
      title: "Best Practices",
      description: "Evaluates error handling, documentation, testing coverage, and configuration.",
      score: scores.bestPractices.score,
      issues: scores.bestPractices.issues,
      category: "bestPractices",
    },
  ]

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-4">
      <CounterProvider>
        {scoreData.map((card, i) => (
          <RepoScore
            key={i}
            title={card.title}
            description={card.description}
            score={card.score}
            issues={card.issues}
            onLearnMore={onViewDetails ? () => onViewDetails(card.category) : undefined}
          />
        ))}
      </CounterProvider>
    </div>
  )
}

export { RepoScore, CounterProvider }
