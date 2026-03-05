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

// Dev Team
export {
  DevTeam,
  devTeam,
  type FileAssignment,
  type DevTeamRequest,
  type DevTeamResponse,
  type GeneratedFile,
} from './dev-team';

// Individual Devs
export * from './devs';

// PM Agent
export { PMAgent } from './pm-agent';

// Architect Agent
export { ArchitectAgent, type ArchitectureOutput } from './architect';

// Delivery Agent
export {
  DeliveryAgent,
  type DeliveryDocumentation,
  type ApprovalResult,
  type ChangelogEntry,
  type ChecklistItem,
  type TestingStep,
  type RollbackStep,
  type SuccessMetric,
  type EnvVariable,
  type VerificationStep,
} from './delivery';

// Orchestrator
export {
  Pipeline,
  runPipeline,
  type PipelineConfig,
  type PipelineResult,
  type PhaseResult,
  type LogEntry,
} from './orchestrator';

// Project Generator
export {
  ProjectGenerator,
  generateCompleteProject,
  type ProjectStructureConfig,
  type PackageJsonConfig,
} from './project-generator';

// Deploy Service
export {
  DeployService,
  deployToVercel,
  deployToRailway,
  createGitHubRepo,
  deployComplete,
  type DeployConfig,
  type DeployResult,
} from './deploy-service';
