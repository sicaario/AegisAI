import axios from 'axios';
import { config } from '../utils/config.js';
import logger from '../utils/logger.js';

class DatadogService {
    constructor() {
        this.apiKey = config.datadog.apiKey;
        this.appKey = config.datadog.appKey;
        this.site = config.datadog.site;
        this.baseUrl = `https://api.${this.site}`;

        this.headers = {
            'DD-API-KEY': this.apiKey,
            'DD-APPLICATION-KEY': this.appKey,
            'Content-Type': 'application/json'
        };
    }

    async logPromptRequest(prompt, response, metadata = {}) {
        const logEntry = {
            ddsource: 'aegisai',
            ddtags: `env:${config.datadog.env},service:aegisai`,
            hostname: 'aegisai-backend',
            message: 'LLM Prompt Request',
            service: 'aegisai',
            status: metadata.isMalicious ? 'warn' : 'info',
            prompt: prompt,
            response: response,
            latency: metadata.latency,
            tokenCount: metadata.tokenCount,
            timestamp: new Date().toISOString(),
            prompt_injection: metadata.isMalicious || false,
            matched_patterns: metadata.matchedPatterns || []
        };

        try {
            await axios.post(
                `${this.baseUrl}/api/v2/logs`,
                [logEntry],
                { headers: this.headers }
            );

            logger.info('Logged to Datadog', {
                isMalicious: metadata.isMalicious,
                tokenCount: metadata.tokenCount
            });
        } catch (error) {
            logger.error('Failed to send log to Datadog', {
                error: error.message,
                response: error.response?.data
            });
        }
    }

    async createIncident(title, severity, description, fields = {}) {
        const incidentPayload = {
            data: {
                type: 'incidents',
                attributes: {
                    title,
                    customer_impact_scope: description,
                    fields: {
                        severity: {
                            type: 'dropdown',
                            value: severity
                        },
                        state: {
                            type: 'dropdown',
                            value: 'active'
                        },
                        detection: {
                            type: 'textbox',
                            value: fields.detection || 'Automated detection via AegisAI'
                        },
                        ...fields
                    }
                }
            }
        };

        try {
            const response = await axios.post(
                `${this.baseUrl}/api/v2/incidents`,
                incidentPayload,
                { headers: this.headers }
            );

            const incidentId = response.data.data.id;
            logger.info('Created Datadog incident', { incidentId, title, severity });

            return {
                id: incidentId,
                url: `https://${this.site}/incidents/${incidentId}`,
                ...response.data.data.attributes
            };
        } catch (error) {
            logger.error('Failed to create Datadog incident', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            return {
                id: `local-${Date.now()}`,
                url: null,
                error: error.message,
                fallback: true
            };
        }
    }

    async sendMetric(metricName, value, tags = []) {
        const now = Math.floor(Date.now() / 1000);

        const metricPayload = {
            series: [{
                metric: `aegisai.${metricName}`,
                type: 'gauge',
                points: [[now, value]],
                tags: [`env:${config.datadog.env}`, 'service:aegisai', ...tags]
            }]
        };

        try {
            await axios.post(
                `${this.baseUrl}/api/v2/series`,
                metricPayload,
                { headers: this.headers }
            );

            logger.info('Sent metric to Datadog', { metricName, value, tags });
        } catch (error) {
            logger.error('Failed to send metric to Datadog', {
                error: error.message,
                metricName
            });
        }
    }

    async getIncidents(limit = 50) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/api/v2/incidents?page[size]=${limit}`,
                { headers: this.headers }
            );

            return response.data.data || [];
        } catch (error) {
            logger.error('Failed to fetch incidents from Datadog', {
                error: error.message
            });
            return [];
        }
    }
}

export default new DatadogService();
