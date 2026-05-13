export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Issue {
  line: number;
  column?: number;
  severity: IssueSeverity;
  category: 'security' | 'quality' | 'performance' | 'style' | 'documentation';
  message: string;
  suggestion?: string;
  code?: string;
  source: 'static' | 'ai';
  rule?: string;
}

export interface FileReview {
  filename: string;
  issues: Issue[];
  staticAnalysisIssues: number;
  aiReviewIssues: number;
}

export interface ReviewSummary {
  totalFiles: number;
  filesReviewed: number;
  issuesFound: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface ReviewResult {
  files: FileReview[];
  summary: ReviewSummary;
  hasCriticalIssues: boolean;
  reviewTime: number;
}

export interface DiffFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  isBinary: boolean;
  diff: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'delete' | 'normal';
  lineNumber: number;
  content: string;
}

export interface AIProvider {
  review(prompt: string): Promise<string>;
}

export interface StaticAnalysisResult {
  issues: Issue[];
  tool: string;
  duration: number;
}

export interface PromptContext {
  file: DiffFile;
  staticIssues: Issue[];
  language: string;
  reviewMode: string;
  customPrompt?: string;
}
