/**
 * PM AGENT — O Coração do DevForge
 *
 * Consultor de produto que conduz intake inteligente
 * com árvore de decisão e linguagem não-técnica.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createAnthropicClient } from '../lib/anthropic';
// Árvore de decisão — perguntas do PM Agent
const QUESTION_TREE = [
    // OBRIGATÓRIAS (sempre faz, nesta ordem)
    {
        type: 'MANDATORY',
        key: 'description',
        question: 'Descreve-me o teu projecto como se explicasses a um amigo. Qual é a ideia?'
    },
    {
        type: 'MANDATORY',
        key: 'targetUsers',
        question: 'Quem vai usar isto? Tu sozinho, a tua equipa, ou o público em geral?',
        quickReplies: ['Só eu', 'A minha equipa', 'Público geral']
    },
    {
        type: 'MANDATORY',
        key: 'mainProblem',
        question: 'Qual é o problema principal que isto resolve?'
    },
    {
        type: 'MANDATORY',
        key: 'reference',
        question: 'Já existe algo parecido que uses como referência? (app, website, serviço)'
    },
    // CONDICIONAIS (só faz se relevante)
    {
        type: 'CONDITIONAL',
        key: 'multiUser',
        question: 'As pessoas precisam de ter conta própria?',
        condition: (answers) => answers.targetUsers !== 'Só eu',
        quickReplies: ['Sim', 'Não', 'Não sei']
    },
    {
        type: 'CONDITIONAL',
        key: 'authMethod',
        question: 'Como preferem entrar? Email e password, Google, ou ambos?',
        condition: (answers) => answers.multiUser === 'Sim',
        quickReplies: ['Email', 'Google', 'Ambos']
    },
    {
        type: 'CONDITIONAL',
        key: 'monetization',
        question: 'Vais cobrar pelo serviço? Se sim, como?',
        condition: (answers) => answers.targetUsers === 'Público geral',
        quickReplies: ['Grátis', 'Subscrição mensal', 'Pagamento único', 'Freemium']
    },
    {
        type: 'CONDITIONAL',
        key: 'contentCreator',
        question: 'Quem cria o conteúdo? Tu, os utilizadores, ou ambos?',
        condition: (answers) => answers.description.toLowerCase().includes('conteúdo') || answers.description.toLowerCase().includes('post'),
        quickReplies: ['Eu', 'Utilizadores', 'Ambos']
    },
    {
        type: 'CONDITIONAL',
        key: 'reporting',
        question: 'Precisas de exportar relatórios ou ver estatísticas?',
        condition: (answers) => answers.targetUsers !== 'Só eu',
        quickReplies: ['Sim, é importante', 'Seria bom ter', 'Não preciso']
    },
    {
        type: 'CONDITIONAL',
        key: 'platform',
        question: 'É mais importante funcionar no telemóvel ou no computador?',
        quickReplies: ['Telemóvel', 'Computador', 'Ambos igualmente']
    },
    {
        type: 'CONDITIONAL',
        key: 'integrations',
        question: 'Usas alguma ferramenta (Stripe, WhatsApp, email marketing) que deva ligar?',
        condition: (answers) => answers.monetization || answers.targetUsers === 'Público geral'
    },
    // DESIGN (sempre no final)
    {
        type: 'DESIGN',
        key: 'colors',
        question: 'Tens uma cor ou identidade visual que queiras usar?'
    },
    {
        type: 'DESIGN',
        key: 'designStyle',
        question: 'Preferes algo mais simples e limpo, ou mais rico e detalhado visualmente?',
        quickReplies: ['Simples e limpo', 'Rico e detalhado', 'Não sei']
    },
    {
        type: 'DESIGN',
        key: 'designReference',
        question: 'Tens algum website ou app que gostes esteticamente como referência?'
    }
];
const SYSTEM_PROMPT = `És o PM Agent do DevForge — um consultor de produto sénior com 15 anos de experiência.
A tua missão é entender completamente o projecto de um utilizador não-técnico e
preparar um plano de desenvolvimento perfeito.

PERSONALIDADE:
- Caloroso, empático, e encorajador
- Nunca condescendente — trata o utilizador como alguém inteligente mas não técnico
- Usa linguagem simples e directa, evita jargão técnico
- Faz UMA pergunta de cada vez
- Celebra as boas ideias: "Que ideia fantástica!", "Adorei!", "Isso faz muito sentido!"

REGRAS ABSOLUTAS:
- NUNCA menciones tecnologias (React, PostgreSQL, API, etc.)
- NUNCA perguntes sobre preferências técnicas
- Sempre traduz necessidades de negócio para decisões técnicas internamente
- Se o utilizador não sabe responder, dá-lhe opções concretas ou decide tu com base nas boas práticas
- Se o projecto é demasiado vago, faz perguntas até teres clareza suficiente
- Se o projecto é impossível ou irreal, diz-o com gentileza e propõe uma alternativa viável

QUANDO RECEBERES RESPOSTA:
Analisa se a resposta respondeu à pergunta actual.
Se sim, agradece e valida: "Perfeito! Entendi."
Se não, reformula a pergunta de forma mais clara.

Depois, determina qual é a próxima pergunta relevante e faz-a.

NÃO geres PRD até receberes confirmação explícita do utilizador após o resumo final.`;
export class PMAgent {
    client;
    answers = {};
    currentQuestionIndex = 0;
    constructor(apiKey) {
        this.client = apiKey
            ? createAnthropicClient(apiKey)
            : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    /**
     * Processar mensagem do utilizador no fluxo de intake
     */
    async processMessage(userMessage, projectMessages) {
        // Parse histórico de mensagens para reconstruir estado
        this.reconstructState(projectMessages);
        // Se mensagem é confirmação final ("Sim, começa")
        if (this.isReadyToBuild() && this.isConfirmation(userMessage)) {
            const prd = await this.generatePRD();
            return {
                agentResponse: this.buildStartMessage(prd),
                isComplete: true,
                prd
            };
        }
        // Se já temos todas as respostas necessárias
        if (this.hasAllAnswers()) {
            const summary = this.generateSummary();
            return {
                agentResponse: summary,
                isComplete: false // Aguarda confirmação
            };
        }
        // Guardar resposta actual
        const currentQuestion = QUESTION_TREE[this.currentQuestionIndex];
        if (currentQuestion) {
            this.answers[currentQuestion.key] = userMessage;
        }
        // Validar resposta com Claude
        const validation = await this.validateAnswer(userMessage, currentQuestion);
        if (!validation.valid) {
            return {
                agentResponse: validation.clarification,
                nextQuestion: currentQuestion,
                isComplete: false
            };
        }
        // Avançar para próxima pergunta relevante
        this.currentQuestionIndex++;
        const nextQuestion = this.getNextRelevantQuestion();
        if (!nextQuestion) {
            // Todas as perguntas respondidas
            const summary = this.generateSummary();
            return {
                agentResponse: summary,
                isComplete: false
            };
        }
        return {
            agentResponse: this.formatQuestionWithEncouragement(validation.acknowledgment, nextQuestion),
            nextQuestion,
            isComplete: false
        };
    }
    /**
     * Reconstruir estado a partir do histórico
     */
    reconstructState(messages) {
        // Implementar parse de metadata para reconstruir answers e currentQuestionIndex
        // Por agora simplificado
        const userMessages = messages.filter(m => m.role === 'USER');
        this.currentQuestionIndex = userMessages.length;
    }
    /**
     * Obter próxima pergunta relevante (skip condicionais que não aplicam)
     */
    getNextRelevantQuestion() {
        while (this.currentQuestionIndex < QUESTION_TREE.length) {
            const question = QUESTION_TREE[this.currentQuestionIndex];
            // Se é obrigatória ou design, fazer sempre
            if (question.type === 'MANDATORY' || question.type === 'DESIGN') {
                return question;
            }
            // Se é condicional, verificar condição
            if (question.type === 'CONDITIONAL') {
                if (!question.condition || question.condition(this.answers)) {
                    return question;
                }
            }
            this.currentQuestionIndex++;
        }
        return null;
    }
    /**
     * Validar resposta do utilizador com Claude
     */
    async validateAnswer(answer, question) {
        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: `Pergunta que fiz: "${question.question}"
Resposta do utilizador: "${answer}"

Analisa se a resposta é clara e relevante.
Se SIM: responde com acknowledgment positivo (1 frase curta)
Se NÃO: responde com pedido de clarificação (reformula a pergunta)

Formato:
VALID: sim/não
MESSAGE: [tua mensagem]`
                    }
                ]
            });
            const text = response.content[0].type === 'text' ? response.content[0].text : '';
            const valid = text.includes('VALID: sim');
            const message = text.split('MESSAGE:')[1]?.trim() || 'Entendi!';
            return {
                valid,
                acknowledgment: valid ? message : undefined,
                clarification: !valid ? message : undefined
            };
        }
        catch (error) {
            // Fallback: aceitar resposta
            return { valid: true, acknowledgment: 'Perfeito! Entendi.' };
        }
    }
    /**
     * Formatar pergunta com encorajamento
     */
    formatQuestionWithEncouragement(acknowledgment, question) {
        let message = `${acknowledgment}\n\n${question.question}`;
        // Adicionar quick replies se existirem
        if (question.quickReplies && question.quickReplies.length > 0) {
            message += `\n\n(Podes responder ou escolher uma destas opções)`;
        }
        return message;
    }
    /**
     * Verificar se todas as perguntas necessárias foram respondidas
     */
    hasAllAnswers() {
        return this.getNextRelevantQuestion() === null;
    }
    /**
     * Verificar se estamos prontos para construir (após resumo)
     */
    isReadyToBuild() {
        return this.hasAllAnswers() && Object.keys(this.answers).length > 0;
    }
    /**
     * Verificar se mensagem é confirmação
     */
    isConfirmation(message) {
        const normalized = message.toLowerCase().trim();
        return (normalized === 'sim' ||
            normalized === 'sim, começa' ||
            normalized === 'começar' ||
            normalized === 'vamos' ||
            normalized === 'ok' ||
            normalized === 'yes');
    }
    /**
     * Gerar resumo para validação
     */
    generateSummary() {
        const estimate = this.estimateTime();
        return `Óptimo! Aqui está o que vou construir para ti:

📱 **O quê:** ${this.answers.description}
👥 **Para quem:** ${this.answers.targetUsers}
🔑 **Acesso:** ${this.getAuthSummary()}
✨ **Funcionalidades principais:**
   ${this.getFeaturesSummary()}
🎨 **Design:** ${this.getDesignSummary()}

⏱️ **Tempo estimado:** ${estimate} minutos

Estou pronto para começar a construir. Quando terminares, vais receber o link do teu produto a funcionar.

**Posso avançar?** (responde "sim" para começar ou corrige algo se necessário)`;
    }
    /**
     * Estimar tempo de desenvolvimento
     */
    estimateTime() {
        let minutes = 5; // base: PM + Architect
        // Features detectadas automaticamente
        if (this.answers.multiUser === 'Sim')
            minutes += 8;
        if (this.answers.monetization && this.answers.monetization !== 'Grátis')
            minutes += 10;
        if (this.answers.reporting === 'Sim, é importante')
            minutes += 7;
        if (this.answers.integrations)
            minutes += 5;
        // QA e deploy
        minutes += 10;
        return minutes;
    }
    /**
     * Resumo de autenticação
     */
    getAuthSummary() {
        if (this.answers.multiUser === 'Sim') {
            const method = this.answers.authMethod || 'Email';
            return `Utilizadores com conta própria (${method})`;
        }
        return 'Acesso livre sem conta';
    }
    /**
     * Resumo de features (detectadas automaticamente)
     */
    getFeaturesSummary() {
        const features = [];
        if (this.answers.multiUser === 'Sim') {
            features.push('Sistema de contas e autenticação');
        }
        if (this.answers.reporting === 'Sim, é importante') {
            features.push('Dashboard com estatísticas');
        }
        if (this.answers.monetization && this.answers.monetization !== 'Grátis') {
            features.push(`Pagamentos (${this.answers.monetization})`);
        }
        return features.map(f => `• ${f}`).join('\n   ') || '• Funcionalidade principal conforme descrito';
    }
    /**
     * Resumo de design
     */
    getDesignSummary() {
        const style = this.answers.designStyle || 'Moderno e limpo';
        const colors = this.answers.colors || 'paleta profissional';
        const platform = this.answers.platform || 'desktop e mobile';
        return `${style}, ${colors}, optimizado para ${platform}`;
    }
    /**
     * Mensagem de início de construção
     */
    buildStartMessage(prd) {
        return `🚀 Perfeito! Estou a começar a construir o teu projecto.

Podes acompanhar o progresso em tempo real aqui na dashboard.
Vou-te notificar quando estiver pronto!

⏱️ Tempo estimado: ${prd.estimatedMinutes} minutos`;
    }
    /**
     * Gerar PRD final em JSON
     */
    async generatePRD() {
        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: `Gera um PRD (Product Requirements Document) completo em JSON com base nas respostas do utilizador.

Schema exacto:
{
  "projectName": string,
  "tagline": string,
  "userSummary": string,
  "targetUsers": string[],
  "mainProblem": string,
  "pages": [{ "name": string, "purpose": string, "accessLevel": string }],
  "features": [{ "name": string, "description": string, "priority": "HIGH"|"MEDIUM"|"LOW" }],
  "userFlows": [{ "name": string, "steps": string[] }],
  "designPreferences": {
    "style": string,
    "colors": string,
    "platform": string,
    "reference": string
  },
  "technical": {
    "hasAuth": boolean,
    "authMethod": string,
    "hasPayments": boolean,
    "hasFileUpload": boolean,
    "hasRealtime": boolean,
    "hasEmail": boolean,
    "hasDashboard": boolean,
    "hasMultiTenant": boolean
  },
  "estimatedMinutes": number,
  "complexity": "SIMPLE"|"MEDIUM"|"COMPLEX"
}`,
            messages: [
                {
                    role: 'user',
                    content: `Respostas do utilizador:\n${JSON.stringify(this.answers, null, 2)}\n\nGera o PRD em JSON puro (sem markdown).`
                }
            ]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
        return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    }
}
