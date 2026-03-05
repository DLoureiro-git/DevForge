// DevForge V2 — Scrum Master Service
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma.js';

interface Feature {
  title: string;
  description: string;
  acceptanceCriteria?: string;
}

interface SprintPlan {
  number: number;
  goal: string;
  features: {
    title: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    storyPoints: number;
  }[];
  totalStoryPoints: number;
  estimatedVelocity: number;
}

interface DailyStandup {
  date: string;
  completed: string[];
  inProgress: string[];
  blocked: string[];
  warnings: string[];
  recommendations: string[];
}

interface SprintReviewReport {
  number: number;
  completed: number;
  total: number;
  deliveredPoints: number;
  highlights: string[];
  improvements: string[];
  nextSprintRecommendations: string[];
}

export class ScrumMaster {
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Gera daily standup baseado no estado actual do sprint
   */
  async generateDailyStandup(sprintId: string): Promise<DailyStandup> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        features: {
          include: {
            requestedBy: true,
            comments: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: {
                author: true,
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const completed = sprint.features
      .filter((f) => f.status === 'DONE')
      .map((f) => `${f.title} (${f.storyPoints || 0} pts)`);

    const inProgress = sprint.features
      .filter((f) => f.status === 'IN_PROGRESS')
      .map((f) => {
        const requester = f.requestedBy?.displayName || 'Unknown';
        return `${f.title} - Requested by ${requester} (${f.storyPoints || 0} pts, ${f.agentProgress}% done)`;
      });

    const blocked = sprint.features
      .filter((f) => f.status === 'BLOCKED')
      .map((f) => `${f.title} - ${f.comments[0]?.content || 'No details'}`);

    // Generate AI insights
    const context = `
Sprint #${sprint.number}: ${sprint.goal}
Planned Points: ${sprint.plannedPoints} story points
Delivered Points: ${sprint.deliveredPoints} story points completed

Completed (${completed.length}):
${completed.join('\n')}

In Progress (${inProgress.length}):
${inProgress.join('\n')}

Blocked (${blocked.length}):
${blocked.join('\n')}

Total features: ${sprint.features.length}
    `;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0.7,
      system: `You are an expert Scrum Master. Analyze the daily standup data and provide:
1. Warnings about potential risks or delays
2. Recommendations for the team

Be concise and actionable. Return JSON format:
{
  "warnings": ["string"],
  "recommendations": ["string"]
}`,
      messages: [
        {
          role: 'user',
          content: context,
        },
      ],
    });

    const content = response.content[0];
    let analysis = { warnings: [], recommendations: [] };

    if (content.type === 'text') {
      try {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('[ScrumMaster] Failed to parse AI response:', error);
      }
    }

    return {
      date: new Date().toISOString(),
      completed,
      inProgress,
      blocked,
      warnings: analysis.warnings || [],
      recommendations: analysis.recommendations || [],
    };
  }

  /**
   * Planeia próximo sprint baseado no backlog
   */
  async planSprint(projectId: string, number: number): Promise<SprintPlan> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        features: {
          where: {
            OR: [{ sprintId: null }, { sprint: { status: 'PLANNED' } }],
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Get historical velocity
    const completedSprints = await prisma.sprint.findMany({
      where: {
        projectId,
        status: 'DONE',
      },
      orderBy: { number: 'desc' },
      take: 3,
    });

    const avgVelocity =
      completedSprints.length > 0
        ? completedSprints.reduce((sum, s) => sum + (s.deliveredPoints || 0), 0) /
          completedSprints.length
        : 40; // default

    const backlogContext = project.features
      .map(
        (f) =>
          `- ${f.title} (Priority: ${f.priority}, Story Points: ${f.storyPoints || 'unknown'})\n  ${f.description}`
      )
      .join('\n\n');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      system: `You are an expert Scrum Master planning Sprint #${number}.
Average team velocity: ${avgVelocity} story points.

Analyze the backlog and create a sprint plan:
1. Define a clear, achievable sprint goal
2. Select features that fit the velocity (don't exceed ${avgVelocity} points)
3. Prioritize by business value and dependencies

Return JSON format:
{
  "goal": "string",
  "features": [
    {
      "title": "string",
      "description": "string",
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "storyPoints": number
    }
  ]
}`,
      messages: [
        {
          role: 'user',
          content: `Project: ${project.name}\n\nBacklog:\n${backlogContext}`,
        },
      ],
    });

    const content = response.content[0];
    let plan = { goal: '', features: [] };

    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('[ScrumMaster] Failed to parse sprint plan:', error);
      }
    }

    const totalStoryPoints = plan.features.reduce((sum, f) => sum + f.storyPoints, 0);

    return {
      number,
      goal: plan.goal || `Sprint ${number} - Continue Development`,
      features: plan.features,
      totalStoryPoints,
      estimatedVelocity: avgVelocity,
    };
  }

  /**
   * Gera relatório de sprint review
   */
  async sprintReview(sprintId: string): Promise<SprintReviewReport> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        features: {
          include: {
            comments: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const completed = sprint.features.filter((f) => f.status === 'DONE');
    const total = sprint.features.length;
    const deliveredPoints = sprint.deliveredPoints || 0;

    const sprintContext = `
Sprint #${sprint.number}: ${sprint.goal}
Planned Points: ${sprint.plannedPoints} story points
Delivered Points: ${deliveredPoints} story points

Completed: ${completed.length}/${total} features
Completed features:
${completed.map((f) => `- ${f.title} (${f.storyPoints} pts)`).join('\n')}

Incomplete features:
${sprint.features
  .filter((f) => f.status !== 'DONE')
  .map((f) => `- ${f.title} (${f.status})`).join('\n')}
    `;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536,
      temperature: 0.7,
      system: `You are an expert Scrum Master conducting a sprint review.
Analyze the sprint results and provide:
1. Key highlights and achievements
2. Areas for improvement
3. Recommendations for next sprint

Be constructive and specific. Return JSON format:
{
  "highlights": ["string"],
  "improvements": ["string"],
  "nextSprintRecommendations": ["string"]
}`,
      messages: [
        {
          role: 'user',
          content: sprintContext,
        },
      ],
    });

    const content = response.content[0];
    let analysis = { highlights: [], improvements: [], nextSprintRecommendations: [] };

    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('[ScrumMaster] Failed to parse review:', error);
      }
    }

    return {
      number: sprint.number,
      completed: completed.length,
      total,
      deliveredPoints,
      highlights: analysis.highlights || [],
      improvements: analysis.improvements || [],
      nextSprintRecommendations: analysis.nextSprintRecommendations || [],
    };
  }

  /**
   * Verifica limite WIP (Work In Progress)
   */
  async checkWIPLimit(projectId: string, targetStatus: string): Promise<boolean> {
    const WIP_LIMITS = {
      BACKLOG: 999, // sem limite
      READY: 999, // sem limite
      IN_PROGRESS: 5, // máximo 5 features em progresso
      IN_REVIEW: 3, // máximo 3 em review
      IN_QA: 3, // máximo 3 em QA
      BLOCKED: 999, // sem limite
      DONE: 999, // sem limite
    };

    const limit = WIP_LIMITS[targetStatus as keyof typeof WIP_LIMITS];

    if (!limit || limit === 999) {
      return true; // sem limite
    }

    const count = await prisma.feature.count({
      where: {
        projectId,
        status: targetStatus as any,
      },
    });

    return count < limit;
  }

  /**
   * Estima story points para uma feature usando IA
   */
  async estimateStoryPoints(feature: Feature): Promise<number> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      temperature: 0.3,
      system: `You are an expert Scrum Master estimating story points using Fibonacci scale (1, 2, 3, 5, 8, 13).

Consider:
- Complexity (technical difficulty)
- Effort (time required)
- Uncertainty (unknowns and risks)

Return ONLY a single number from the Fibonacci scale.`,
      messages: [
        {
          role: 'user',
          content: `Feature: ${feature.title}

Description:
${feature.description}

${feature.acceptanceCriteria ? `Acceptance Criteria:\n${feature.acceptanceCriteria}` : ''}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const match = content.text.match(/\d+/);
      if (match) {
        const points = parseInt(match[0], 10);
        // Ensure it's a valid Fibonacci number
        const validPoints = [1, 2, 3, 5, 8, 13];
        return validPoints.includes(points) ? points : 3; // default to 3
      }
    }

    return 3; // default
  }
}
