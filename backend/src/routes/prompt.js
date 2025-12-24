import express from 'express';
import geminiService from '../services/geminiService.js';
import datadogService from '../services/datadogService.js';
import metricsService from '../services/metricsService.js';
import detectionService from '../services/detectionService.js';
import autopsyService from '../services/autopsyService.js';
import replayService from '../services/replayService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const startTime = Date.now();

    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                error: 'Invalid request: prompt is required and must be a string'
            });
        }

        // Emit request count metric
        metricsService.incrementRequestCount();

        logger.info('Processing prompt request', { promptLength: prompt.length });

        const detectionResult = detectionService.detectPromptInjection(prompt);

        const geminiResponse = await geminiService.generateResponse(prompt);

        const totalLatency = Date.now() - startTime;

        // Calculate risk level: 0=low, 1=medium, 2=high
        const riskLevel = detectionResult.isMalicious
            ? (detectionResult.severity === 'SEV-1' ? 2 : detectionResult.severity === 'SEV-2' ? 1 : 0)
            : 0;

        // Emit StatsD metrics for observability
        const metricTags = {
            malicious: detectionResult.isMalicious,
            severity: detectionResult.severity || 'none'
        };

        metricsService.recordLatency(totalLatency, metricTags);
        metricsService.recordTokensUsed(geminiResponse.tokenCount, metricTags);
        metricsService.recordPromptRisk(riskLevel, metricTags);

        // Also send to Datadog HTTP API (existing functionality)
        await datadogService.logPromptRequest(prompt, geminiResponse.text, {
            isMalicious: detectionResult.isMalicious,
            matchedPatterns: detectionResult.matchedPatterns,
            latency: totalLatency,
            tokenCount: geminiResponse.tokenCount
        });

        await datadogService.sendMetric('tokens.count', geminiResponse.tokenCount, [
            `malicious:${detectionResult.isMalicious}`
        ]);

        await datadogService.sendMetric('request.latency', totalLatency, [
            `malicious:${detectionResult.isMalicious}`
        ]);

        let incident = null;

        if (detectionResult.isMalicious) {
            const incidentId = `incident-${Date.now()}`;

            incident = await datadogService.createIncident(
                `Prompt Injection Detected: ${detectionResult.matchedPatterns.join(', ')}`,
                detectionResult.severity,
                `Malicious prompt detected with patterns: ${detectionResult.matchedPatterns.join(', ')}. Confidence: ${(detectionResult.confidence * 100).toFixed(0)}%`,
                {
                    prompt: { type: 'textbox', value: prompt.substring(0, 500) },
                    patterns: { type: 'textbox', value: detectionResult.matchedPatterns.join(', ') }
                }
            );

            incident.localId = incidentId;
            incident.prompt = prompt;
            incident.response = geminiResponse.text;
            incident.matchedPatterns = detectionResult.matchedPatterns;
            incident.severity = detectionResult.severity;
            incident.timestamp = new Date().toISOString();

            replayService.storeRequest(incidentId, {
                originalPrompt: prompt,
                originalResponse: geminiResponse.text,
                matchedPatterns: detectionResult.matchedPatterns,
                severity: detectionResult.severity
            });
        }

        res.json({
            success: true,
            response: geminiResponse.text,
            metadata: {
                latency: totalLatency,
                tokenCount: geminiResponse.tokenCount,
                detectionResult: {
                    isMalicious: detectionResult.isMalicious,
                    matchedPatterns: detectionResult.matchedPatterns,
                    severity: detectionResult.severity,
                    confidence: detectionResult.confidence
                }
            },
            incident: incident ? {
                id: incident.localId,
                datadogId: incident.id,
                datadogUrl: incident.url,
                severity: incident.severity,
                timestamp: incident.timestamp
            } : null
        });

    } catch (error) {
        // Emit error metric
        metricsService.incrementError({
            error_type: '500',
            error_name: error.name || 'UnknownError'
        });

        logger.error('Error processing prompt', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            error: 'Failed to process prompt',
            message: error.message
        });
    }
});

export default router;
