import geminiService from './geminiService.js';
import logger from '../utils/logger.js';

class AutopsyService {
    async generateAutopsy(incidentData) {
        try {
            logger.info('Generating autopsy report', { incidentId: incidentData.id });

            const autopsy = await geminiService.generateAutopsyReport(incidentData);

            return {
                incidentId: incidentData.id,
                autopsy,
                generatedAt: new Date().toISOString(),
                analysisType: 'AI-Generated Root Cause Analysis'
            };
        } catch (error) {
            logger.error('Failed to generate autopsy', {
                error: error.message,
                incidentId: incidentData.id
            });

            return {
                incidentId: incidentData.id,
                autopsy: this.getFallbackAutopsy(incidentData),
                generatedAt: new Date().toISOString(),
                analysisType: 'Fallback Analysis',
                error: error.message
            };
        }
    }

    async generatePromptFix(maliciousPrompt, matchedPatterns) {
        try {
            logger.info('Generating prompt fix suggestion', {
                matchedPatterns
            });

            const fixResult = await geminiService.generatePromptFix(
                maliciousPrompt,
                matchedPatterns
            );

            return {
                originalPrompt: maliciousPrompt,
                fixedPrompt: fixResult.fixedPrompt,
                explanation: fixResult.explanation,
                matchedPatterns,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to generate prompt fix', {
                error: error.message
            });

            return {
                originalPrompt: maliciousPrompt,
                fixedPrompt: 'Unable to generate safe alternative. Please rephrase your question.',
                explanation: 'The system detected potential prompt injection patterns. Please ask your question without attempting to manipulate the AI\'s behavior.',
                matchedPatterns,
                generatedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    async generateExecutiveSummary(incidentData) {
        try {
            logger.info('Generating executive summary', {
                incidentId: incidentData.id
            });

            const summary = await geminiService.generateExecutiveSummary(incidentData);

            return {
                incidentId: incidentData.id,
                summary,
                generatedAt: new Date().toISOString(),
                targetAudience: 'Executive Leadership'
            };
        } catch (error) {
            logger.error('Failed to generate executive summary', {
                error: error.message,
                incidentId: incidentData.id
            });

            return {
                incidentId: incidentData.id,
                summary: this.getFallbackExecutiveSummary(incidentData),
                generatedAt: new Date().toISOString(),
                targetAudience: 'Executive Leadership',
                error: error.message
            };
        }
    }

    getFallbackAutopsy(incidentData) {
        return `AUTOMATED ANALYSIS:

What Happened: The system detected a prompt injection attempt containing patterns: ${incidentData.matchedPatterns.join(', ')}. This indicates an attempt to manipulate the AI's behavior.

Why It's Dangerous: Prompt injection attacks can bypass safety guidelines, extract sensitive system information, or cause the AI to behave in unintended ways.

Root Cause: User-submitted prompt contained known attack patterns designed to override AI safety mechanisms.

Impact: The request was flagged and logged. No unauthorized access occurred. The system's safety mechanisms functioned as intended.`;
    }

    getFallbackExecutiveSummary(incidentData) {
        return `An automated security system detected a potential prompt injection attempt at ${incidentData.timestamp}. The system identified attack patterns in a user prompt that could have compromised the AI's safety guidelines. The incident was automatically flagged, logged, and blocked. No data was compromised, and the system's defenses functioned correctly. This demonstrates the importance of robust AI safety monitoring in production environments.`;
    }
}

export default new AutopsyService();
