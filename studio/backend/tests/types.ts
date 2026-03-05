/**
 * DevForge V2 - Test Types
 *
 * Tipos TypeScript para os testes Playwright
 */

// ============================================
// USER & AUTH
// ============================================

export interface TestUser {
  id: string;
  email: string;
  name: string;
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ============================================
// PROJECT
// ============================================

export type ProjectStatus =
  | 'INTAKE'
  | 'PLANNING'
  | 'BUILDING'
  | 'QA'
  | 'FIXING'
  | 'DELIVERED';

export interface TestProject {
  id: string;
  name: string;
  status: ProjectStatus;
  deployUrl?: string;
  githubUrl?: string;
  prd?: string;
  createdAt: string;
}

// ============================================
// PHASE
// ============================================

export type PhaseType =
  | 'PM'
  | 'ARCHITECT'
  | 'FRONTEND'
  | 'BACKEND'
  | 'QA'
  | 'DEPLOY';

export type PhaseStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export interface TestPhase {
  type: PhaseType;
  status: PhaseStatus;
  startedAt?: string;
  completedAt?: string;
  output?: string;
}

// ============================================
// BUG
// ============================================

export type BugCategory =
  | 'RESPONSIVE'
  | 'BUTTON'
  | 'FORM'
  | 'CONSOLE_ERROR'
  | 'ACCESSIBILITY'
  | 'PERFORMANCE';

export type BugSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface TestBug {
  id: string;
  category: BugCategory;
  description: string;
  severity: BugSeverity;
  fixed: boolean;
}

// ============================================
// MESSAGE (CHAT)
// ============================================

export interface TestMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

// ============================================
// FORM DATA
// ============================================

export interface ProjectFormData {
  name: string;
  description?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// ============================================
// VIEWPORT
// ============================================

export interface Viewport {
  width: number;
  height: number;
}

export const VIEWPORTS = {
  mobile: { width: 375, height: 667 } as Viewport,
  tablet: { width: 768, height: 1024 } as Viewport,
  desktop: { width: 1280, height: 720 } as Viewport,
  desktopLarge: { width: 1920, height: 1080 } as Viewport,
} as const;

// ============================================
// ACCESSIBILITY
// ============================================

export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: A11yNode[];
}

export interface A11yNode {
  html: string;
  target: string[];
  failureSummary?: string;
}

// ============================================
// TEST CONFIG
// ============================================

export interface TestConfig {
  baseURL: string;
  apiURL: string;
  timeout: number;
  slowMo?: number;
}

// ============================================
// MOCK DATA
// ============================================

export const MOCK_USER: TestUser = {
  id: 'test-user-123',
  email: 'test@devforge.com',
  name: 'Test User',
  plan: 'FREE',
};

export const MOCK_PROJECT: TestProject = {
  id: 'test-project-123',
  name: 'Test Restaurant Booking',
  status: 'INTAKE',
  createdAt: new Date().toISOString(),
};

export const MOCK_PHASES: TestPhase[] = [
  { type: 'PM', status: 'COMPLETED' },
  { type: 'ARCHITECT', status: 'RUNNING' },
  { type: 'FRONTEND', status: 'PENDING' },
  { type: 'BACKEND', status: 'PENDING' },
  { type: 'QA', status: 'PENDING' },
  { type: 'DEPLOY', status: 'PENDING' },
];

export const MOCK_BUGS: TestBug[] = [
  {
    id: 'bug-1',
    category: 'RESPONSIVE',
    description: 'Botão muito pequeno em mobile',
    severity: 'MEDIUM',
    fixed: false,
  },
  {
    id: 'bug-2',
    category: 'FORM',
    description: 'Formulário não valida email',
    severity: 'HIGH',
    fixed: false,
  },
];

export const MOCK_MESSAGES: TestMessage[] = [
  {
    role: 'assistant',
    content: 'Olá! Descreve-me o teu projecto.',
  },
  {
    role: 'user',
    content: 'Quero uma app de reservas de restaurante',
  },
  {
    role: 'assistant',
    content: 'Que ideia fantástica! 🍽️ Quem vai usar isto?',
  },
];
