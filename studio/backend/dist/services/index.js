"use strict";
/**
 * DevForge V2 - Services Index
 * Exporta todos os serviços do sistema
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployComplete = exports.createGitHubRepo = exports.deployToRailway = exports.deployToVercel = exports.DeployService = exports.generateCompleteProject = exports.ProjectGenerator = exports.runPipeline = exports.Pipeline = exports.DeliveryAgent = exports.ArchitectAgent = exports.PMAgent = exports.devTeam = exports.DevTeam = exports.pmNotifyQAResults = exports.pmFullWorkflow = exports.pmContinuousValidation = exports.pmAutoFixBugs = exports.pmPreDeployCheck = exports.pmValidateProject = exports.runBatchBugFix = exports.runBugFixLoop = exports.generateQAReport = exports.executeQuickQA = exports.executeQA = exports.EMAIL_CHECKS = exports.FILE_UPLOAD_CHECKS = exports.REALTIME_CHECKS = exports.PAYMENT_CHECKS = exports.AUTH_CHECKS = exports.UNIVERSAL_CHECKS = exports.getCriticalChecks = exports.getAutomatableChecks = exports.groupChecksByCategory = exports.estimateTotalTime = exports.initBrowser = exports.calculateQAScore = exports.generateAdaptiveChecklist = exports.analyzePRD = void 0;
// QA Engine
var qa_engine_1 = require("./qa-engine");
Object.defineProperty(exports, "analyzePRD", { enumerable: true, get: function () { return qa_engine_1.analyzePRD; } });
Object.defineProperty(exports, "generateAdaptiveChecklist", { enumerable: true, get: function () { return qa_engine_1.generateAdaptiveChecklist; } });
Object.defineProperty(exports, "calculateQAScore", { enumerable: true, get: function () { return qa_engine_1.calculateQAScore; } });
Object.defineProperty(exports, "initBrowser", { enumerable: true, get: function () { return qa_engine_1.initBrowser; } });
Object.defineProperty(exports, "estimateTotalTime", { enumerable: true, get: function () { return qa_engine_1.estimateTotalTime; } });
Object.defineProperty(exports, "groupChecksByCategory", { enumerable: true, get: function () { return qa_engine_1.groupChecksByCategory; } });
Object.defineProperty(exports, "getAutomatableChecks", { enumerable: true, get: function () { return qa_engine_1.getAutomatableChecks; } });
Object.defineProperty(exports, "getCriticalChecks", { enumerable: true, get: function () { return qa_engine_1.getCriticalChecks; } });
Object.defineProperty(exports, "UNIVERSAL_CHECKS", { enumerable: true, get: function () { return qa_engine_1.UNIVERSAL_CHECKS; } });
Object.defineProperty(exports, "AUTH_CHECKS", { enumerable: true, get: function () { return qa_engine_1.AUTH_CHECKS; } });
Object.defineProperty(exports, "PAYMENT_CHECKS", { enumerable: true, get: function () { return qa_engine_1.PAYMENT_CHECKS; } });
Object.defineProperty(exports, "REALTIME_CHECKS", { enumerable: true, get: function () { return qa_engine_1.REALTIME_CHECKS; } });
Object.defineProperty(exports, "FILE_UPLOAD_CHECKS", { enumerable: true, get: function () { return qa_engine_1.FILE_UPLOAD_CHECKS; } });
Object.defineProperty(exports, "EMAIL_CHECKS", { enumerable: true, get: function () { return qa_engine_1.EMAIL_CHECKS; } });
// QA Executor
var qa_executor_1 = require("./qa-executor");
Object.defineProperty(exports, "executeQA", { enumerable: true, get: function () { return qa_executor_1.executeQA; } });
Object.defineProperty(exports, "executeQuickQA", { enumerable: true, get: function () { return qa_executor_1.executeQuickQA; } });
Object.defineProperty(exports, "generateQAReport", { enumerable: true, get: function () { return qa_executor_1.generateQAReport; } });
// Bug Fix Loop
var bug_fix_loop_1 = require("./bug-fix-loop");
Object.defineProperty(exports, "runBugFixLoop", { enumerable: true, get: function () { return bug_fix_loop_1.runBugFixLoop; } });
Object.defineProperty(exports, "runBatchBugFix", { enumerable: true, get: function () { return bug_fix_loop_1.runBatchBugFix; } });
// Validators
__exportStar(require("./validators"), exports);
// PM Integration
var pm_qa_integration_1 = require("./pm-qa-integration");
Object.defineProperty(exports, "pmValidateProject", { enumerable: true, get: function () { return pm_qa_integration_1.pmValidateProject; } });
Object.defineProperty(exports, "pmPreDeployCheck", { enumerable: true, get: function () { return pm_qa_integration_1.pmPreDeployCheck; } });
Object.defineProperty(exports, "pmAutoFixBugs", { enumerable: true, get: function () { return pm_qa_integration_1.pmAutoFixBugs; } });
Object.defineProperty(exports, "pmContinuousValidation", { enumerable: true, get: function () { return pm_qa_integration_1.pmContinuousValidation; } });
Object.defineProperty(exports, "pmFullWorkflow", { enumerable: true, get: function () { return pm_qa_integration_1.pmFullWorkflow; } });
Object.defineProperty(exports, "pmNotifyQAResults", { enumerable: true, get: function () { return pm_qa_integration_1.pmNotifyQAResults; } });
// Dev Team
var dev_team_1 = require("./dev-team");
Object.defineProperty(exports, "DevTeam", { enumerable: true, get: function () { return dev_team_1.DevTeam; } });
Object.defineProperty(exports, "devTeam", { enumerable: true, get: function () { return dev_team_1.devTeam; } });
// Individual Devs
__exportStar(require("./devs"), exports);
// PM Agent
var pm_agent_1 = require("./pm-agent");
Object.defineProperty(exports, "PMAgent", { enumerable: true, get: function () { return pm_agent_1.PMAgent; } });
// Architect Agent
var architect_1 = require("./architect");
Object.defineProperty(exports, "ArchitectAgent", { enumerable: true, get: function () { return architect_1.ArchitectAgent; } });
// Delivery Agent
var delivery_1 = require("./delivery");
Object.defineProperty(exports, "DeliveryAgent", { enumerable: true, get: function () { return delivery_1.DeliveryAgent; } });
// Orchestrator
var orchestrator_1 = require("./orchestrator");
Object.defineProperty(exports, "Pipeline", { enumerable: true, get: function () { return orchestrator_1.Pipeline; } });
Object.defineProperty(exports, "runPipeline", { enumerable: true, get: function () { return orchestrator_1.runPipeline; } });
// Project Generator
var project_generator_1 = require("./project-generator");
Object.defineProperty(exports, "ProjectGenerator", { enumerable: true, get: function () { return project_generator_1.ProjectGenerator; } });
Object.defineProperty(exports, "generateCompleteProject", { enumerable: true, get: function () { return project_generator_1.generateCompleteProject; } });
// Deploy Service
var deploy_service_1 = require("./deploy-service");
Object.defineProperty(exports, "DeployService", { enumerable: true, get: function () { return deploy_service_1.DeployService; } });
Object.defineProperty(exports, "deployToVercel", { enumerable: true, get: function () { return deploy_service_1.deployToVercel; } });
Object.defineProperty(exports, "deployToRailway", { enumerable: true, get: function () { return deploy_service_1.deployToRailway; } });
Object.defineProperty(exports, "createGitHubRepo", { enumerable: true, get: function () { return deploy_service_1.createGitHubRepo; } });
Object.defineProperty(exports, "deployComplete", { enumerable: true, get: function () { return deploy_service_1.deployComplete; } });
