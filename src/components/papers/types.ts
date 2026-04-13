export type Paper = {
  paper_id: number;
  validation_status: string;
  is_finalized?: boolean;
  total_marks?: number;
  message?: string;
  created_at?: string;
};

export type Submission = {
  submission_id: number;
  student_id: string | null;
  validation_status: string;
  total_score: number | null;
  max_score: number | null;
  is_finalized: boolean;
};

export type QuestionResult = {
  canonical_question_id: string;
  display_label?: string;
  final_score: number;
  max_marks: number;
  raw_score_before_override?: number;
  needs_review?: boolean;
  evaluations?: { score: number; rationale: string }[];
};

export type GradingData = {
  question_results?: QuestionResult[];
  totals?: { total_score?: number };
  total_max?: number;
};

export type GradeFile = {
  id: number;
  file: File;
  progress: number;
  done: boolean;
  error?: string;
};

export type Override = { score: string; reason: string };
