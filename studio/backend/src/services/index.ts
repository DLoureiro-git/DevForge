/**
 * DevForge V2 - Services Index
 * Exporta todos os serviços do sistema
 */

// QA Engine
export {
  type PRDAnalysis,
  type QACheck,
  type Bug,
  type QAScore,
  type ValidationResult,
  analyzePRD,
  generateAdaptiveChecklist,
  calculateQAScore,
  initBrowser,
  estimateTotalTime,
  groupChecksByCategory,
  getAutomatableChecks,
  getCriticalChecks,
  UNIVERSAL_CHECKS,
  AUTH_CHECKS,
  PAYMENT_CHECKS,
  REALTIME_CHECKS,
  FILE_UPLOAD_CHECKS,
  EMAIL_CHECKS,
} from './qa-engine';

// QA Executor
export {
  type QAExecutionConfig,
  type QAExecutionResult,
  executeQA,
  executeQuickQA,
  generateQAReport,
} from './qa-executor';

// Bug Fix Loop
export {
  type FixAttempt,
  type FixLoopResult,
  type FixLoopConfig,
  runBugFixLoop,
  runBatchBugFix,
} from './bug-fix-loop';

// Validators
export * from './validators';

// PM Integration
export {
  pmValidateProject,
  pmPreDeployCheck,
  pmAutoFixBugs,
  pmContinuousValidation,
  pmFullWorkflow,
  pmNotifyQAResults,
} from './pm-qa-integration';
