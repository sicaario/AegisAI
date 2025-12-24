import geminiService from './geminiService.js';
import logger from '../utils/logger.js';

class ReplayService {
    constructor() {
        this.requestStore = new Map();
    }

    storeRequest(incidentId, requestData) {
        this.requestStore.set(incidentId, {
            ...requestData,
            storedAt: new Date().toISOString()
        });

        logger.info('Stored request for replay', { incidentId });
    }

    async replayRequest(incidentId, options = {}) {
        const storedRequest = this.requestStore.get(incidentId);

        if (!storedRequest) {
            throw new Error(`No stored request found for incident ${incidentId}`);
        }

        const promptToUse = options.useFixedPrompt && storedRequest.fixedPrompt
            ? storedRequest.fixedPrompt
            : storedRequest.originalPrompt;

        logger.info('Replaying request', {
            incidentId,
            useFixedPrompt: options.useFixedPrompt
        });

        const result = await geminiService.generateResponse(promptToUse);

        return {
            incidentId,
            replayType: options.useFixedPrompt ? 'fixed' : 'original',
            prompt: promptToUse,
            response: result.text,
            latency: result.latency,
            tokenCount: result.tokenCount,
            replayedAt: new Date().toISOString(),
            comparison: options.useFixedPrompt ? {
                originalPrompt: storedRequest.originalPrompt,
                fixedPrompt: promptToUse,
                originalResponse: storedRequest.originalResponse
            } : null
        };
    }

    async replayComparison(incidentId) {
        const [originalReplay, fixedReplay] = await Promise.all([
            this.replayRequest(incidentId, { useFixedPrompt: false }),
            this.replayRequest(incidentId, { useFixedPrompt: true })
        ]);

        return {
            incidentId,
            original: originalReplay,
            fixed: fixedReplay,
            diff: {
                promptChanged: originalReplay.prompt !== fixedReplay.prompt,
                responseChanged: originalReplay.response !== fixedReplay.response,
                latencyDelta: fixedReplay.latency - originalReplay.latency
            }
        };
    }

    getStoredRequest(incidentId) {
        return this.requestStore.get(incidentId);
    }

    getAllStoredRequests() {
        return Array.from(this.requestStore.entries()).map(([id, data]) => ({
            incidentId: id,
            ...data
        }));
    }
}

export default new ReplayService();
