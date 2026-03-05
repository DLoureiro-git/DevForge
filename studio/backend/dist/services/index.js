/**
 * DevForge V2 - Services Index
 * Exporta todos os serviços do sistema
 */
// QA Engine
export { analyzePRD, generateAdaptiveChecklist, calculateQAScore, initBrowser, estimateTotalTime, groupChecksByCategory, getAutomatableChecks, getCriticalChecks, UNIVERSAL_CHECKS, AUTH_CHECKS, PAYMENT_CHECKS, REALTIME_CHECKS, FILE_UPLOAD_CHECKS, EMAIL_CHECKS, } from './qa-engine';
// QA Executor
export { executeQA, executeQuickQA, generateQAReport, } from './qa-executor';
// Bug Fix Loop
export { runBugFixLoop, runBatchBugFix, } from './bug-fix-loop';
// Validators
export * from './validators';
// PM Integration
export { pmValidateProject, pmPreDeployCheck, pmAutoFixBugs, pmContinuousValidation, pmFullWorkflow, pmNotifyQAResults, } from './pm-qa-integration';
// Dev Team
export { DevTeam, devTeam, } from './dev-team';
// Individual Devs
export * from './devs';
