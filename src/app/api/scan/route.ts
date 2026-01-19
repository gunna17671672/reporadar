import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface RepoFile {
  path: string;
  content: string;
}

interface Issue {
  severity: "critical" | "warning" | "info";
  message: string;
  file?: string;
}

interface AnalysisResult {
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
}

// ============================================
// ALGORITHMIC SCORING SYSTEM (DETERMINISTIC)
// ============================================

interface ScoreBreakdown {
  codeQuality: { score: number; issues: Issue[]; details: string[] };
  security: { score: number; issues: Issue[]; details: string[] };
  bestPractices: { score: number; issues: Issue[]; details: string[] };
}

// Helper to sort issues deterministically by severity then message
function sortIssues(issues: Issue[]): Issue[] {
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.message.localeCompare(b.message);
  });
}

// Security patterns to detect
const SECURITY_PATTERNS = [
  { pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, severity: "critical" as const, message: "Hardcoded API key detected" },
  { pattern: /password\s*[:=]\s*["'][^"']+["']/gi, severity: "critical" as const, message: "Hardcoded password detected" },
  { pattern: /secret\s*[:=]\s*["'][^"']+["']/gi, severity: "critical" as const, message: "Hardcoded secret detected" },
  { pattern: /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi, severity: "critical" as const, message: "Hardcoded private key detected" },
  { pattern: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, severity: "critical" as const, message: "Hardcoded JWT token detected" },
  { pattern: /eval\s*\(/g, severity: "warning" as const, message: "Use of eval() - potential code injection risk" },
  { pattern: /dangerouslySetInnerHTML/g, severity: "warning" as const, message: "dangerouslySetInnerHTML usage - XSS risk" },
  { pattern: /innerHTML\s*=/g, severity: "warning" as const, message: "Direct innerHTML assignment - XSS risk" },
  { pattern: /exec\s*\(/g, severity: "warning" as const, message: "Shell command execution detected" },
  { pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE.*\+/gi, severity: "warning" as const, message: "Potential SQL injection vulnerability" },
  { pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g, severity: "info" as const, message: "Non-HTTPS URL detected" },
  { pattern: /disable[d]?.*ssl|verify.*false/gi, severity: "warning" as const, message: "SSL verification may be disabled" },
];

// Code quality patterns
const CODE_QUALITY_PATTERNS = [
  { pattern: /console\.(log|debug|info)\(/g, severity: "info" as const, message: "Console statement found (remove in production)" },
  { pattern: /TODO|FIXME|HACK|XXX/g, severity: "info" as const, message: "TODO/FIXME comment found" },
  { pattern: /any(?:\s|;|,|\))/g, severity: "warning" as const, message: "TypeScript 'any' type usage reduces type safety", fileTypes: [".ts", ".tsx"] },
  { pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g, severity: "warning" as const, message: "Empty catch block - errors silently ignored" },
  { pattern: /function\s+\w+\s*\([^)]{100,}\)/g, severity: "warning" as const, message: "Function with too many parameters" },
  { pattern: /^\s{200,}/m, severity: "info" as const, message: "Excessive indentation detected" },
  { pattern: /\n{4,}/g, severity: "info" as const, message: "Multiple consecutive blank lines" },
];

// Best practices checks
function checkBestPractices(files: RepoFile[], repoInfo: { name: string; description: string }): { score: number; issues: Issue[]; details: string[] } {
  let score = 100;
  const issues: Issue[] = [];
  const details: string[] = [];
  
  const fileNames = files.map(f => f.path.toLowerCase());
  const allContent = files.map(f => f.content).join("\n");
  
  // Check for README
  const hasReadme = fileNames.some(f => f.includes("readme"));
  if (!hasReadme) {
    score -= 20;
    issues.push({ severity: "warning", message: "No README.md file found" });
  } else {
    const readmeFile = files.find(f => f.path.toLowerCase().includes("readme"));
    if (readmeFile && readmeFile.content.length < 500) {
      score -= 15;
      issues.push({ severity: "warning", message: "README is too minimal (< 500 chars) - needs better documentation" });
    } else if (readmeFile && readmeFile.content.length < 1000) {
      score -= 8;
      issues.push({ severity: "info", message: "README could be more comprehensive" });
    } else {
      details.push("✓ Good README documentation");
    }
  }
  
  // Check for .gitignore
  const hasGitignore = fileNames.some(f => f.includes(".gitignore"));
  if (!hasGitignore) {
    score -= 15;
    issues.push({ severity: "warning", message: "No .gitignore file found" });
  } else {
    details.push("✓ .gitignore present");
  }
  
  // Check for package.json / dependency file
  const hasDependencyFile = fileNames.some(f => 
    f.includes("package.json") || f.includes("requirements.txt") || 
    f.includes("cargo.toml") || f.includes("go.mod") || f.includes("pom.xml")
  );
  if (hasDependencyFile) {
    details.push("✓ Dependency management configured");
  } else {
    score -= 10;
    issues.push({ severity: "info", message: "No dependency/package management file found" });
  }
  
  // Check for TypeScript config
  const hasTypeScript = fileNames.some(f => f.endsWith(".ts") || f.endsWith(".tsx"));
  const hasTsConfig = fileNames.some(f => f.includes("tsconfig"));
  if (hasTypeScript && !hasTsConfig) {
    score -= 12;
    issues.push({ severity: "warning", message: "TypeScript files without tsconfig.json" });
  }
  
  // Check for environment example
  const hasEnvExample = fileNames.some(f => f.includes(".env.example") || f.includes(".env.sample"));
  const usesEnvVars = allContent.includes("process.env") || allContent.includes("os.environ") || allContent.includes("getenv");
  if (usesEnvVars && !hasEnvExample) {
    score -= 12;
    issues.push({ severity: "warning", message: "Uses environment variables but no .env.example file" });
  } else if (hasEnvExample) {
    details.push("✓ Environment example provided");
  }
  
  // Check for tests
  const hasTests = fileNames.some(f => 
    f.includes("test") || f.includes("spec") || f.includes("__tests__")
  ) || allContent.includes("describe(") || allContent.includes("it(") || allContent.includes("test(");
  if (!hasTests) {
    score -= 20;
    issues.push({ severity: "warning", message: "No test files detected - testing is critical" });
  } else {
    details.push("✓ Test files present");
  }
  
  // Check for license
  const hasLicense = fileNames.some(f => f.includes("license"));
  if (!hasLicense) {
    score -= 10;
    issues.push({ severity: "info", message: "No LICENSE file found" });
  } else {
    details.push("✓ License file present");
  }
  
  // Check for error handling
  const hasTryCatch = allContent.includes("try {") || allContent.includes("try{");
  const hasErrorHandler = allContent.includes("catch") || allContent.includes(".catch(") || allContent.includes("except ");
  if (!hasTryCatch && !hasErrorHandler) {
    score -= 15;
    issues.push({ severity: "warning", message: "No error handling patterns detected" });
  } else {
    details.push("✓ Error handling implemented");
  }
  
  // Check for async/await usage with proper error handling
  const asyncFunctions = (allContent.match(/async\s+function|async\s*\(/g) || []).length;
  const awaitStatements = (allContent.match(/await\s+/g) || []).length;
  if (asyncFunctions > 0 || awaitStatements > 3) {
    const tryCatchCount = (allContent.match(/try\s*\{/g) || []).length;
    if (tryCatchCount < asyncFunctions * 0.3) {
      score -= 10;
      issues.push({ severity: "warning", message: "Async code lacks proper error handling" });
    }
  }
  
  return { score: Math.max(0, score), issues: sortIssues(issues), details: details.sort() };
}

// Analyze file for security issues
function analyzeSecurityPatterns(files: RepoFile[]): { score: number; issues: Issue[]; details: string[] } {
  let score = 100;
  const issues: Issue[] = [];
  const details: string[] = [];
  const foundPatterns = new Set<string>();
  
  // Count actual code files for context
  const codeExtensions = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".rb", ".php", ".c", ".cpp", ".cs", ".swift", ".kt", ".vue", ".svelte"];
  const codeFiles = files.filter(f => codeExtensions.some(ext => f.path.endsWith(ext)));
  
  // If no code files, can't really assess security meaningfully
  if (codeFiles.length === 0) {
    score = 50;
    issues.push({ severity: "warning", message: "No code files to assess for security vulnerabilities" });
    return { score, issues, details };
  }
  
  for (const file of files) {
    // Skip certain files from security scanning
    if (file.path.includes(".md") || file.path.includes(".txt") || file.path.includes("test")) continue;
    
    for (const check of SECURITY_PATTERNS) {
      const matches = file.content.match(check.pattern);
      if (matches && !foundPatterns.has(check.message)) {
        foundPatterns.add(check.message);
        const deduction = check.severity === "critical" ? 30 : check.severity === "warning" ? 15 : 8;
        score -= deduction;
        issues.push({
          severity: check.severity,
          message: check.message,
          file: file.path,
        });
      }
    }
  }
  
  // Check for .env file with actual secrets
  const envFile = files.find(f => f.path === ".env" || f.path.endsWith("/.env"));
  if (envFile) {
    score -= 25;
    issues.push({ severity: "critical", message: ".env file should not be committed to repository", file: envFile.path });
  }
  
  if (issues.length === 0) {
    details.push("✓ No obvious security issues detected");
    score = 100;
  }
  
  return { score: Math.max(0, score), issues: sortIssues(issues), details: details.sort() };
}

// Analyze code quality
function analyzeCodeQuality(files: RepoFile[]): { score: number; issues: Issue[]; details: string[] } {
  let score = 100;
  const issues: Issue[] = [];
  const details: string[] = [];
  const issueCounts: Record<string, number> = {};
  
  let totalLines = 0;
  let codeFiles = 0;
  let avgFileSize = 0;
  
  // Count actual code files (exclude config/docs)
  const codeExtensions = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".rb", ".php", ".c", ".cpp", ".cs", ".swift", ".kt", ".vue", ".svelte"];
  
  for (const file of files) {
    // Skip non-code files
    if (file.path.endsWith(".md") || file.path.endsWith(".json") || file.path.endsWith(".yaml") || file.path.endsWith(".yml") || file.path.endsWith(".toml")) continue;
    
    const isCodeFile = codeExtensions.some(ext => file.path.endsWith(ext));
    if (isCodeFile) {
      codeFiles++;
      const lines = file.content.split("\n").length;
      totalLines += lines;
    }
    
    // Check file size
    const lines = file.content.split("\n").length;
    if (lines > 500) {
      if (!issueCounts["large_file"]) {
        issueCounts["large_file"] = 0;
        issues.push({ severity: "warning", message: "Some files exceed 500 lines - consider splitting", file: file.path });
      }
      issueCounts["large_file"]++;
      score -= 5;
    }
    
    // Check for patterns
    for (const check of CODE_QUALITY_PATTERNS) {
      if (check.fileTypes && !check.fileTypes.some(ext => file.path.endsWith(ext))) continue;
      
      const matches = file.content.match(check.pattern);
      if (matches) {
        const key = check.message;
        if (!issueCounts[key]) {
          issueCounts[key] = 0;
          issues.push({
            severity: check.severity,
            message: `${check.message} (${matches.length} occurrence${matches.length > 1 ? "s" : ""})`,
            file: file.path,
          });
        }
        issueCounts[key] += matches.length;
        const deduction = check.severity === "warning" ? 6 : 3;
        score -= Math.min(deduction * matches.length, 20);
      }
    }
    
    // Check for very long lines
    const longLines = file.content.split("\n").filter(line => line.length > 150).length;
    if (longLines > 5 && !issueCounts["long_lines"]) {
      issueCounts["long_lines"] = longLines;
      score -= 8;
      issues.push({ severity: "info", message: `${longLines} lines exceed 150 characters`, file: file.path });
    }
  }
  
  // STRICT: Penalize repositories with minimal code content
  if (codeFiles === 0) {
    score -= 50;
    issues.push({ severity: "critical", message: "No actual code files found - repository lacks implementation" });
  } else if (codeFiles === 1) {
    score -= 25;
    issues.push({ severity: "warning", message: "Only 1 code file found - very minimal codebase" });
  } else if (codeFiles <= 3) {
    score -= 15;
    issues.push({ severity: "info", message: "Very few code files - limited codebase" });
  }
  
  // STRICT: Penalize very little total code
  if (totalLines < 50 && codeFiles > 0) {
    score -= 30;
    issues.push({ severity: "warning", message: `Only ${totalLines} lines of code - insufficient implementation` });
  } else if (totalLines < 150 && codeFiles > 0) {
    score -= 15;
    issues.push({ severity: "info", message: `Only ${totalLines} lines of code - minimal implementation` });
  } else if (totalLines < 300 && codeFiles > 0) {
    score -= 8;
    issues.push({ severity: "info", message: `${totalLines} lines of code - small codebase` });
  }
  
  if (codeFiles > 0) {
    avgFileSize = Math.round(totalLines / codeFiles);
    if (avgFileSize < 300 && avgFileSize > 30) {
      details.push(`✓ Good file sizes (avg: ${avgFileSize} lines)`);
    }
  }
  
  // Check for consistent naming
  const fileNamingStyles = {
    kebab: 0,
    camel: 0,
    snake: 0,
    pascal: 0,
  };
  
  for (const file of files) {
    const name = file.path.split("/").pop()?.replace(/\.[^/.]+$/, "") || "";
    if (name.includes("-")) fileNamingStyles.kebab++;
    else if (name.includes("_")) fileNamingStyles.snake++;
    else if (name[0] === name[0]?.toUpperCase()) fileNamingStyles.pascal++;
    else fileNamingStyles.camel++;
  }
  
  const totalFilesForNaming = Object.values(fileNamingStyles).reduce((a, b) => a + b, 0);
  const dominantStyle = Math.max(...Object.values(fileNamingStyles));
  if (totalFilesForNaming > 3 && dominantStyle / totalFilesForNaming < 0.6) {
    score -= 8;
    issues.push({ severity: "info", message: "Inconsistent file naming conventions" });
  } else if (totalFilesForNaming > 3) {
    details.push("✓ Consistent file naming");
  }
  
  if (issues.length === 0) {
    details.push("✓ Good code quality patterns");
  }
  
  return { score: Math.max(0, Math.min(100, score)), issues: sortIssues(issues), details: details.sort() };
}

// Calculate overall score with weighted average
function calculateOverallScore(breakdown: ScoreBreakdown): number {
  const weights = {
    security: 0.40,      // Security is most important
    codeQuality: 0.35,   // Code quality second
    bestPractices: 0.25, // Best practices third
  };
  
  const weightedScore = 
    breakdown.security.score * weights.security +
    breakdown.codeQuality.score * weights.codeQuality +
    breakdown.bestPractices.score * weights.bestPractices;
  
  return Math.round(weightedScore);
}

// Extract owner and repo from GitHub URL
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /github\.com:([^\/]+)\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      };
    }
  }
  return null;
}

// GitHub API headers (with optional token for private repos)
function getGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoRadar",
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  
  return headers;
}

// Fetch repository info from GitHub API
async function fetchRepoInfo(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: getGitHubHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository not found: ${owner}/${repo}. Make sure the repo exists and is public, or add a GITHUB_TOKEN for private repos.`);
    }
    throw new Error(`Failed to fetch repository: ${response.statusText}`);
  }

  return response.json();
}

// Fetch repository file tree
async function fetchRepoTree(owner: string, repo: string, branch: string = "main") {
  // Try main branch first, then master
  let response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (!response.ok && branch === "main") {
    response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
      {
        headers: getGitHubHeaders(),
      }
    );
  }

  if (!response.ok) {
    throw new Error("Could not fetch repository tree");
  }

  return response.json();
}

// Fetch file content
async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  if (data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return "";
}

// Filter important files for analysis - DETERMINISTIC ordering
function filterImportantFiles(files: Array<{ path: string; type: string }>): string[] {
  const importantExtensions = [
    ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs", ".rb",
    ".php", ".c", ".cpp", ".h", ".cs", ".swift", ".kt", ".scala",
    ".vue", ".svelte", ".json", ".yaml", ".yml", ".toml", ".env.example",
    ".md", ".dockerfile", "Dockerfile", ".sql"
  ];

  const importantFiles = [
    "package.json", "requirements.txt", "Cargo.toml", "go.mod",
    "pom.xml", "build.gradle", "Gemfile", "composer.json",
    "README.md", "readme.md", ".env.example", "docker-compose.yml",
    "Dockerfile", ".gitignore", "tsconfig.json", "next.config.js",
    "next.config.ts", "vite.config.ts", "webpack.config.js"
  ];

  // Priority scoring for deterministic file selection
  const getPriority = (path: string): number => {
    const fileName = path.split("/").pop() || "";
    // Config files get highest priority
    if (importantFiles.includes(fileName)) return 100;
    // Root level files get higher priority
    const depth = path.split("/").length;
    const depthBonus = Math.max(0, 10 - depth);
    // Code files by extension priority
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return 80 + depthBonus;
    if (path.endsWith(".js") || path.endsWith(".jsx")) return 75 + depthBonus;
    if (path.endsWith(".py")) return 70 + depthBonus;
    if (path.endsWith(".go") || path.endsWith(".rs")) return 65 + depthBonus;
    if (path.endsWith(".java") || path.endsWith(".kt")) return 60 + depthBonus;
    return 50 + depthBonus;
  };

  return files
    .filter((f) => f.type === "blob")
    .filter((f) => {
      const fileName = f.path.split("/").pop() || "";
      const ext = "." + fileName.split(".").pop();
      return (
        importantExtensions.some((e) => f.path.endsWith(e)) ||
        importantFiles.includes(fileName)
      );
    })
    .filter((f) => !f.path.includes("node_modules"))
    .filter((f) => !f.path.includes("dist/"))
    .filter((f) => !f.path.includes("build/"))
    .filter((f) => !f.path.includes(".min."))
    .filter((f) => !f.path.includes("vendor/"))
    .filter((f) => !f.path.includes("__pycache__"))
    .filter((f) => !f.path.includes(".git/"))
    .filter((f) => !f.path.includes("coverage/"))
    .filter((f) => !f.path.includes("test/") && !f.path.includes("tests/") && !f.path.includes("__tests__/"))
    // DETERMINISTIC: Sort by priority (descending), then alphabetically by path
    .sort((a, b) => {
      const priorityDiff = getPriority(b.path) - getPriority(a.path);
      if (priorityDiff !== 0) return priorityDiff;
      return a.path.localeCompare(b.path);
    })
    .slice(0, 20) // Increased to 20 files for better analysis
    .map((f) => f.path);
}

// Analyze code with Groq (now only for summary and recommendations)
async function analyzeWithGroq(
  repoInfo: { name: string; description: string },
  files: RepoFile[],
  languages: Record<string, number>,
  algorithmicScores: ScoreBreakdown
): Promise<AnalysisResult> {
  // Get file list for context
  const fileList = files.map(f => f.path).join(", ");
  
  // Build issue summary for LLM context
  const allIssues = [
    ...algorithmicScores.security.issues.map(i => `[Security] ${i.message}`),
    ...algorithmicScores.codeQuality.issues.map(i => `[Quality] ${i.message}`),
    ...algorithmicScores.bestPractices.issues.map(i => `[Practices] ${i.message}`),
  ].slice(0, 10);
  
  const prompt = `Based on this GitHub repo analysis, write a brief summary and 3 specific recommendations.

Repo: ${repoInfo.name}
Description: ${repoInfo.description || "No description"}
Languages: ${Object.entries(languages).map(([k, v]) => `${k}: ${v}%`).join(", ")}
Files analyzed: ${fileList}

Algorithmic Analysis Results:
- Security Score: ${algorithmicScores.security.score}/100
- Code Quality Score: ${algorithmicScores.codeQuality.score}/100  
- Best Practices Score: ${algorithmicScores.bestPractices.score}/100
- Overall Score: ${calculateOverallScore(algorithmicScores)}/100

Issues Found:
${allIssues.length > 0 ? allIssues.join("\n") : "No major issues detected"}

Return JSON only (no markdown):
{"summary":"<2-3 sentence summary based on the scores and issues>","recommendations":["<specific actionable recommendation 1>","<specific actionable recommendation 2>","<specific actionable recommendation 3>"]}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 512,
    });

    const text = completion.choices[0]?.message?.content || "";
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const llmResponse = JSON.parse(jsonStr);

    return {
      overallScore: calculateOverallScore(algorithmicScores),
      summary: llmResponse.summary || "Analysis complete.",
      codeQuality: {
        score: algorithmicScores.codeQuality.score,
        issues: algorithmicScores.codeQuality.issues.slice(0, 5),
      },
      security: {
        score: algorithmicScores.security.score,
        issues: algorithmicScores.security.issues.slice(0, 5),
      },
      bestPractices: {
        score: algorithmicScores.bestPractices.score,
        issues: algorithmicScores.bestPractices.issues.slice(0, 5),
      },
      recommendations: llmResponse.recommendations || ["Add more documentation", "Improve test coverage", "Review security practices"],
      languages,
    };
  } catch {
    // Fallback if LLM fails - still return algorithmic scores
    return {
      overallScore: calculateOverallScore(algorithmicScores),
      summary: `Repository analyzed with ${files.length} files. Overall score: ${calculateOverallScore(algorithmicScores)}/100.`,
      codeQuality: {
        score: algorithmicScores.codeQuality.score,
        issues: algorithmicScores.codeQuality.issues.slice(0, 5),
      },
      security: {
        score: algorithmicScores.security.score,
        issues: algorithmicScores.security.issues.slice(0, 5),
      },
      bestPractices: {
        score: algorithmicScores.bestPractices.score,
        issues: algorithmicScores.bestPractices.issues.slice(0, 5),
      },
      recommendations: [
        "Review and address any security issues found",
        "Improve code organization and documentation",
        "Add comprehensive test coverage",
      ],
      languages,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "GitHub URL is required" },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Fetch repository info
    const repoInfo = await fetchRepoInfo(owner, repo);
    
    // Fetch file tree
    const tree = await fetchRepoTree(owner, repo, repoInfo.default_branch);
    
    // Filter important files
    const importantPaths = filterImportantFiles(tree.tree);

    // Fetch file contents
    const files: RepoFile[] = [];
    for (const path of importantPaths) {
      const content = await fetchFileContent(owner, repo, path);
      if (content) {
        files.push({ path, content });
      }
    }

    // Get language breakdown (sorted deterministically by percentage descending)
    const languagesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      {
        headers: getGitHubHeaders(),
      }
    );
    const languagesData = await languagesResponse.json();
    const totalBytes = Object.values(languagesData as Record<string, number>).reduce((a, b) => a + b, 0);
    const languagesUnsorted: Record<string, number> = {};
    for (const [lang, bytes] of Object.entries(languagesData as Record<string, number>)) {
      languagesUnsorted[lang] = Math.round((bytes / totalBytes) * 100);
    }
    // Sort languages by percentage (descending), then alphabetically
    const languages: Record<string, number> = {};
    Object.entries(languagesUnsorted)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([lang, pct]) => { languages[lang] = pct; });

    // Run algorithmic analysis first (deterministic)
    const algorithmicScores: ScoreBreakdown = {
      security: analyzeSecurityPatterns(files),
      codeQuality: analyzeCodeQuality(files),
      bestPractices: checkBestPractices(files, { name: repoInfo.name, description: repoInfo.description }),
    };

    // Use LLM only for summary and recommendations
    const analysis = await analyzeWithGroq(
      { name: repoInfo.name, description: repoInfo.description },
      files,
      languages,
      algorithmicScores
    );

    return NextResponse.json({
      success: true,
      repository: {
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        description: repoInfo.description,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        url: repoInfo.html_url,
      },
      analysis,
    });
  } catch (error) {
    console.error("Scan error:", error);
    
    // Check for rate limit error
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze repository";
    if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "API rate limit exceeded. Please wait a minute and try again, or try a smaller repository." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
