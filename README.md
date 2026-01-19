<div align="center">

# 🛰️ REPORADAR

### AI-Powered Static Code Analysis & Security Vulnerability Detection Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-orange?style=for-the-badge)](https://groq.com/)

[Live Demo](https://reporadar.vercel.app) · [Report Bug](https://github.com/gunna17671672/reporadar/issues)

</div>

---

## 🎯 Overview

**RepoRadar** is a sophisticated, enterprise-grade static analysis platform that leverages cutting-edge Large Language Models (LLMs) and deterministic algorithmic scoring to provide comprehensive code quality assessments for GitHub repositories.

The platform synthesizes multiple analysis vectors—including security vulnerability detection, code quality heuristics, and software engineering best practices—into actionable, quantified intelligence.

---

## ✨ Key Features

### 🔬 Multi-Dimensional Analysis Engine
- **Security Vulnerability Scanner** — Detects hardcoded secrets, API keys, SQL injection patterns, XSS vulnerabilities, and insecure configurations
- **Code Quality Analyzer** — Evaluates code complexity, naming conventions, file structure, and TypeScript type safety
- **Best Practices Auditor** — Assesses documentation coverage, test presence, dependency management, and error handling patterns

### 🧠 Hybrid Intelligence Architecture
- **Deterministic Algorithmic Scoring** — Reproducible, consistent scores using weighted multi-factor analysis
- **LLM-Powered Insights** — Contextual summaries and actionable recommendations via Groq's LLaMA 3.3 70B model
- **Parallel Pattern Recognition** — Concurrent regex-based vulnerability detection across multiple file types

### 🎨 Modern UI/UX
- **Lenis Smooth Scrolling** — Buttery-smooth scroll animations with sticky section stacking
- **Framer Motion Animations** — Fluid micro-interactions and page transitions
- **Glassmorphism Design** — Modern frosted-glass aesthetic with dynamic gradients
- **Responsive Architecture** — Fully adaptive layouts for all viewport sizes

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 16 App Router │ React Server Components │ Turbopack│
├─────────────────────────────────────────────────────────────┤
│                    Analysis Pipeline                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Security   │  │    Code     │  │   Best Practices    │  │
│  │  Patterns   │  │   Quality   │  │      Auditor        │  │
│  │  (40%)      │  │   (35%)     │  │      (25%)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                   External Services                         │
│      GitHub REST API  │  Groq LLM API  │  Vercel Edge      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm
- GitHub Personal Access Token
- Groq API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/gunna17671672/reporadar.git

# Navigate to project directory
cd reporadar

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

### Development

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Scoring Methodology

RepoRadar employs a **weighted composite scoring algorithm** that evaluates repositories across three primary dimensions:

| Dimension | Weight | Factors Analyzed |
|-----------|--------|------------------|
| **Security** | 40% | Hardcoded secrets, injection vulnerabilities, unsafe patterns |
| **Code Quality** | 35% | File size, complexity, type safety, naming conventions |
| **Best Practices** | 25% | Documentation, testing, error handling, dependency management |

### Score Interpretation

| Score Range | Rating | Indication |
|-------------|--------|------------|
| 80-100 | 🟢 Excellent | Production-ready, well-maintained codebase |
| 60-79 | 🟡 Good | Solid foundation with room for improvement |
| 0-59 | 🔴 Needs Work | Significant issues requiring attention |

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, Framer Motion, CSS Variables |
| **UI Components** | Aceternity UI, Magic UI, Custom Components |
| **AI/ML** | Groq SDK, LLaMA 3.3 70B Versatile |
| **APIs** | GitHub REST API v3 |
| **Deployment** | Vercel Edge Network |

---

## 📁 Project Structure

```
reporadar/
├── src/
│   ├── app/
│   │   ├── api/scan/       # Analysis API endpoint
│   │   ├── report/         # Results dashboard
│   │   └── page.tsx        # Landing page
│   ├── components/ui/      # Reusable UI components
│   └── lib/                # Utility functions
├── public/                 # Static assets
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ☕ and curiosity**

[⬆ Back to Top](#-reporadar)

</div>
