import { GoogleGenAI } from '@google/genai';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

// Initialize with Vertex AI using ADC
const client = new GoogleGenAI({
    vertexai: true,
    project: config.gemini.project,
    location: 'global'
});

class GeminiService {
    async generateResponse(prompt, systemContext = null) {
        const startTime = Date.now();

        try {
            logger.info('Sending prompt to Gemini via Vertex AI', {
                promptLength: prompt.length,
                hasSystemContext: !!systemContext
            });

            const fullPrompt = systemContext
                ? `${systemContext}\n\nUser: ${prompt}`
                : prompt;

            const response = await client.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: fullPrompt
            });

            const text = response.text;
            const latency = Date.now() - startTime;

            const metadata = {
                responseLength: text.length,
                latency,
                timestamp: new Date().toISOString()
            };

            logger.info('Gemini response received', metadata);

            return {
                text,
                latency,
                tokenCount: this.estimateTokenCount(prompt, text),
                metadata
            };
        } catch (error) {
            const latency = Date.now() - startTime;
            logger.error('Gemini API error', {
                error: error.message,
                latency,
                stack: error.stack
            });

            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    async generateAutopsyReport(incidentData) {
        const prompt = `Generate a technical incident autopsy report. Return ONLY the markdown-formatted report, no conversational text.

INCIDENT DATA:
- Prompt: "${incidentData.prompt}"
- Patterns: ${incidentData.matchedPatterns.join(', ')}
- Severity: ${incidentData.severity}

FORMAT (use exact headings):

## What Happened
[1-2 sentences explaining the detected attack]

## Why It's Dangerous  
[1-2 sentences on the security risk]

## Root Cause
[1 sentence on why this occurred]

## Impact
[1 sentence on potential consequences]

Return clean markdown only. No "Here's" or "Okay" prefixes.`;

        const result = await this.generateResponse(prompt);
        return result.text;
    }

    async generatePromptFix(maliciousPrompt, matchedPatterns) {
        const prompt = `You are a prompt safety engineer. A user submitted this potentially malicious prompt:

"${maliciousPrompt}"

Detected attack patterns: ${matchedPatterns.join(', ')}

Your task:
1. Rewrite this prompt to make it safe while preserving the user's likely intent (if legitimate)
2. Explain WHY your fix works in 1-2 sentences

Format your response as:
FIXED_PROMPT: [your rewritten prompt]
EXPLANATION: [why this fix works]

Be concise and clear.`;

        const result = await this.generateResponse(prompt);
        const text = result.text;

        const fixedPromptMatch = text.match(/FIXED_PROMPT:\s*(.+?)(?=EXPLANATION:|$)/s);
        const explanationMatch = text.match(/EXPLANATION:\s*(.+)/s);

        return {
            fixedPrompt: fixedPromptMatch ? fixedPromptMatch[1].trim() : 'Unable to generate safe alternative',
            explanation: explanationMatch ? explanationMatch[1].trim() : 'The original prompt contained injection patterns that could bypass safety guidelines.',
            originalAnalysis: text
        };
    }

    async generateExecutiveSummary(incidentData) {
        const prompt = `Write an executive briefing for a CTO about this AI security incident. Be concise and professional.

INCIDENT: ${incidentData.severity} Prompt Injection
PROMPT: "${incidentData.prompt}"
TIME: ${incidentData.timestamp}

Write 3-4 sentences covering:
1. What happened (business terms)
2. Potential impact
3. Action taken

NO "Here's" or conversational prefixes. Start directly with the summary.`;

        const result = await this.generateResponse(prompt);
        return result.text;
    }

    estimateTokenCount(prompt, response) {
        const totalChars = prompt.length + response.length;
        return Math.ceil(totalChars / 4);
    }
}

export default new GeminiService();
