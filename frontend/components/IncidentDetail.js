import { useState } from 'react';
import axios from 'axios';
import PromptDiff from './PromptDiff';

export default function IncidentDetail({ incident, onClose }) {
    const [autopsy, setAutopsy] = useState(null);
    const [fix, setFix] = useState(null);
    const [executiveSummary, setExecutiveSummary] = useState(null);
    const [replayResult, setReplayResult] = useState(null);
    const [loading, setLoading] = useState({});

    const generateAutopsy = async () => {
        setLoading(prev => ({ ...prev, autopsy: true }));
        try {
            const response = await axios.post(`/api/incidents/${incident.id}/autopsy`);
            setAutopsy(response.data.autopsy);
        } catch (error) {
            console.error('Failed to generate autopsy:', error);
            setAutopsy({ error: 'Failed to generate autopsy report' });
        } finally {
            setLoading(prev => ({ ...prev, autopsy: false }));
        }
    };

    const generateFix = async () => {
        setLoading(prev => ({ ...prev, fix: true }));
        try {
            const response = await axios.post(`/api/incidents/${incident.id}/fix`);
            setFix(response.data.fix);
        } catch (error) {
            console.error('Failed to generate fix:', error);
            setFix({ error: 'Failed to generate prompt fix' });
        } finally {
            setLoading(prev => ({ ...prev, fix: false }));
        }
    };

    const generateExecutiveSummary = async () => {
        setLoading(prev => ({ ...prev, summary: true }));
        try {
            const response = await axios.post(`/api/incidents/${incident.id}/executive-summary`);
            setExecutiveSummary(response.data.executiveSummary);
        } catch (error) {
            console.error('Failed to generate summary:', error);
            setExecutiveSummary({ error: 'Failed to generate executive summary' });
        } finally {
            setLoading(prev => ({ ...prev, summary: false }));
        }
    };

    const replayRequest = async (useFixed = false) => {
        setLoading(prev => ({ ...prev, replay: true }));
        try {
            const response = await axios.post(`/api/incidents/${incident.id}/replay`, {
                useFixed
            });
            setReplayResult(response.data.replay);
        } catch (error) {
            console.error('Failed to replay:', error);
            setReplayResult({ error: 'Failed to replay request' });
        } finally {
            setLoading(prev => ({ ...prev, replay: false }));
        }
    };

    const getSeverityColor = (severity) => {
        if (severity === 'SEV-1') return 'text-red-400 border-red-500';
        if (severity === 'SEV-2') return 'text-yellow-400 border-yellow-500';
        return 'text-blue-400 border-blue-500';
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-aegis-dark border-b border-gray-800 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Incident Details</h2>
                        <p className="text-sm text-gray-400 mt-1">ID: {incident.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-panel p-4">
                            <div className="text-xs text-gray-400 mb-1">Severity</div>
                            <div className={`text-lg font-bold ${getSeverityColor(incident.severity)}`}>
                                {incident.severity}
                            </div>
                        </div>
                        <div className="glass-panel p-4">
                            <div className="text-xs text-gray-400 mb-1">Detected Patterns</div>
                            <div className="text-sm font-semibold text-white">
                                {incident.matchedPatterns?.length || 0} patterns
                            </div>
                        </div>
                        <div className="glass-panel p-4">
                            <div className="text-xs text-gray-400 mb-1">Timestamp</div>
                            <div className="text-sm font-mono text-white">
                                {new Date(incident.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Original Prompt</h3>
                        <div className="bg-gray-950 rounded p-3 border border-red-500/30">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                {incident.prompt}
                            </pre>
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">🔍 AI Autopsy Report</h3>
                            {!autopsy && (
                                <button
                                    onClick={generateAutopsy}
                                    disabled={loading.autopsy}
                                    className="btn-primary text-sm py-2 px-4"
                                >
                                    {loading.autopsy ? (
                                        <span className="flex items-center">
                                            <div className="loading-spinner mr-2"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate Autopsy'
                                    )}
                                </button>
                            )}
                        </div>
                        {autopsy && (
                            <div className="bg-gray-950 rounded p-4 border border-aegis-blue/30">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                                    {autopsy.autopsy || autopsy.error}
                                </pre>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">✨ Gemini Prompt Fix</h3>
                            {!fix && (
                                <button
                                    onClick={generateFix}
                                    disabled={loading.fix}
                                    className="btn-primary text-sm py-2 px-4"
                                >
                                    {loading.fix ? (
                                        <span className="flex items-center">
                                            <div className="loading-spinner mr-2"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate Fix'
                                    )}
                                </button>
                            )}
                        </div>
                        {fix && (
                            <PromptDiff
                                original={incident.prompt}
                                fixed={fix.fixedPrompt}
                                explanation={fix.explanation}
                            />
                        )}
                    </div>

                    <div className="glass-panel p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">🔄 One-Click Replay</h3>
                        <div className="flex space-x-4 mb-4">
                            <button
                                onClick={() => replayRequest(false)}
                                disabled={loading.replay}
                                className="btn-secondary flex-1"
                            >
                                Replay Original
                            </button>
                            <button
                                onClick={() => replayRequest(true)}
                                disabled={loading.replay || !fix}
                                className="btn-primary flex-1"
                            >
                                Replay Fixed
                            </button>
                        </div>
                        {replayResult && (
                            <div className="bg-gray-950 rounded p-4 border border-aegis-cyan/30">
                                <div className="text-xs text-gray-400 mb-2">
                                    {replayResult.replayType === 'fixed' ? 'Fixed' : 'Original'} Response:
                                </div>
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {replayResult.response || replayResult.error}
                                </pre>
                                <div className="mt-2 text-xs text-gray-500">
                                    Latency: {replayResult.latency}ms | Tokens: {replayResult.tokenCount}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">📊 Executive Summary</h3>
                            {!executiveSummary && (
                                <button
                                    onClick={generateExecutiveSummary}
                                    disabled={loading.summary}
                                    className="btn-primary text-sm py-2 px-4"
                                >
                                    {loading.summary ? (
                                        <span className="flex items-center">
                                            <div className="loading-spinner mr-2"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        'Generate Summary'
                                    )}
                                </button>
                            )}
                        </div>
                        {executiveSummary && (
                            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded p-4 border border-purple-500/30">
                                <div className="text-xs text-purple-400 mb-2 font-semibold">FOR EXECUTIVE REVIEW</div>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {executiveSummary.summary || executiveSummary.error}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
