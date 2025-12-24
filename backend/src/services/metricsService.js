import StatsD from 'hot-shots';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

class MetricsService {
    constructor() {
        // Initialize StatsD client to send metrics to Datadog Agent
        this.client = new StatsD({
            host: '127.0.0.1',
            port: 8125,
            prefix: 'aegisai.',
            globalTags: {
                env: config.datadog.env,
                service: 'aegisai'
            },
            errorHandler: (error) => {
                logger.error('StatsD error', { error: error.message });
            }
        });

        logger.info('StatsD metrics service initialized', {
            host: '127.0.0.1',
            port: 8125,
            prefix: 'aegisai.'
        });
    }

    /**
     * Increment request counter
     * @param {Object} tags - Additional tags (e.g., { malicious: true })
     */
    incrementRequestCount(tags = {}) {
        const tagArray = this._formatTags(tags);
        this.client.increment('request.count', 1, tagArray);
        logger.debug('Metric emitted: request.count', { tags: tagArray });
    }

    /**
     * Record request latency in milliseconds
     * @param {number} latencyMs - Request latency in milliseconds
     * @param {Object} tags - Additional tags
     */
    recordLatency(latencyMs, tags = {}) {
        const tagArray = this._formatTags(tags);
        this.client.gauge('request.latency', latencyMs, tagArray);
        logger.debug('Metric emitted: request.latency', { value: latencyMs, tags: tagArray });
    }

    /**
     * Increment error counter
     * @param {Object} tags - Additional tags (e.g., { error_type: '500' })
     */
    incrementError(tags = {}) {
        const tagArray = this._formatTags(tags);
        this.client.increment('request.error', 1, tagArray);
        logger.debug('Metric emitted: request.error', { tags: tagArray });
    }

    /**
     * Record tokens used in the request
     * @param {number} tokenCount - Number of tokens consumed
     * @param {Object} tags - Additional tags
     */
    recordTokensUsed(tokenCount, tags = {}) {
        const tagArray = this._formatTags(tags);
        this.client.gauge('tokens.used', tokenCount, tagArray);
        logger.debug('Metric emitted: tokens.used', { value: tokenCount, tags: tagArray });
    }

    /**
     * Record prompt risk level
     * @param {number} riskLevel - 0=low, 1=medium, 2=high
     * @param {Object} tags - Additional tags (e.g., { severity: 'SEV-1' })
     */
    recordPromptRisk(riskLevel, tags = {}) {
        const tagArray = this._formatTags(tags);
        this.client.gauge('prompt.risk', riskLevel, tagArray);
        logger.debug('Metric emitted: prompt.risk', { value: riskLevel, tags: tagArray });
    }

    /**
     * Convert tags object to array format for StatsD
     * @private
     */
    _formatTags(tags) {
        return Object.entries(tags).map(([key, value]) => `${key}:${value}`);
    }

    /**
     * Close StatsD client connection
     */
    close() {
        this.client.close(() => {
            logger.info('StatsD client closed');
        });
    }
}

export default new MetricsService();
