import express from 'express';
import datadogService from '../services/datadogService.js';
import autopsyService from '../services/autopsyService.js';
import replayService from '../services/replayService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const storedIncidents = replayService.getAllStoredRequests();

        const datadogIncidents = await datadogService.getIncidents(50);

        const combinedIncidents = storedIncidents.map(incident => ({
            id: incident.incidentId,
            prompt: incident.originalPrompt,
            matchedPatterns: incident.matchedPatterns,
            severity: incident.severity,
            timestamp: incident.storedAt,
            source: 'local'
        }));

        // Sort by timestamp descending (most recent first)
        combinedIncidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            incidents: combinedIncidents,
            total: combinedIncidents.length
        });
    } catch (error) {
        logger.error('Error fetching incidents', { error: error.message });
        res.status(500).json({
            error: 'Failed to fetch incidents',
            message: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const incident = replayService.getStoredRequest(id);

        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found',
                id
            });
        }

        res.json({
            success: true,
            incident: {
                id,
                ...incident
            }
        });
    } catch (error) {
        logger.error('Error fetching incident', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to fetch incident',
            message: error.message
        });
    }
});

router.post('/:id/autopsy', async (req, res) => {
    try {
        const { id } = req.params;
        const incident = replayService.getStoredRequest(id);

        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found',
                id
            });
        }

        const autopsyResult = await autopsyService.generateAutopsy({
            id,
            prompt: incident.originalPrompt,
            matchedPatterns: incident.matchedPatterns,
            severity: incident.severity,
            timestamp: incident.storedAt
        });

        res.json({
            success: true,
            autopsy: autopsyResult
        });
    } catch (error) {
        logger.error('Error generating autopsy', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to generate autopsy',
            message: error.message
        });
    }
});

router.post('/:id/fix', async (req, res) => {
    try {
        const { id } = req.params;
        const incident = replayService.getStoredRequest(id);

        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found',
                id
            });
        }

        const fixResult = await autopsyService.generatePromptFix(
            incident.originalPrompt,
            incident.matchedPatterns
        );

        incident.fixedPrompt = fixResult.fixedPrompt;

        res.json({
            success: true,
            fix: fixResult
        });
    } catch (error) {
        logger.error('Error generating fix', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to generate fix',
            message: error.message
        });
    }
});

router.post('/:id/replay', async (req, res) => {
    try {
        const { id } = req.params;
        const { useFixed } = req.body;

        const replayResult = await replayService.replayRequest(id, {
            useFixedPrompt: useFixed === true
        });

        res.json({
            success: true,
            replay: replayResult
        });
    } catch (error) {
        logger.error('Error replaying request', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to replay request',
            message: error.message
        });
    }
});

router.post('/:id/replay-comparison', async (req, res) => {
    try {
        const { id } = req.params;

        const comparison = await replayService.replayComparison(id);

        res.json({
            success: true,
            comparison
        });
    } catch (error) {
        logger.error('Error generating replay comparison', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to generate comparison',
            message: error.message
        });
    }
});

router.post('/:id/executive-summary', async (req, res) => {
    try {
        const { id } = req.params;
        const incident = replayService.getStoredRequest(id);

        if (!incident) {
            return res.status(404).json({
                error: 'Incident not found',
                id
            });
        }

        const summaryResult = await autopsyService.generateExecutiveSummary({
            id,
            prompt: incident.originalPrompt,
            matchedPatterns: incident.matchedPatterns,
            severity: incident.severity,
            timestamp: incident.storedAt
        });

        res.json({
            success: true,
            executiveSummary: summaryResult
        });
    } catch (error) {
        logger.error('Error generating executive summary', {
            error: error.message,
            incidentId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to generate executive summary',
            message: error.message
        });
    }
});

export default router;
