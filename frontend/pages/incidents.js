import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import IncidentDetail from '../components/IncidentDetail';
import axios from 'axios';

export default function Incidents() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/incidents');
            setIncidents(response.data.incidents || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch incidents:', err);
            setError('Failed to load incidents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadgeClass = (severity) => {
        if (severity === 'SEV-1') return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (severity === 'SEV-2') return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    };

    return (
        <Layout>
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Spacing instead of header */}
                    <div className="mb-8"></div>

                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="flex gap-2 justify-center mb-4">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <p className="text-slate-400">Loading incidents...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-red-400">Error</h3>
                                    <p className="text-xs text-slate-300 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && incidents.length === 0 && (
                        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-12 text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No Incidents Detected</h3>
                            <p className="text-slate-500 mb-6">All prompts are processing safely. Incidents will appear here when detected.</p>
                            <a href="/" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                                Go to Chat
                            </a>
                        </div>
                    )}

                    {!loading && !error && incidents.length > 0 && (
                        <div className="space-y-4">
                            {/* Stats Card */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-400">
                                        Total Incidents: <span className="text-white font-semibold">{incidents.length}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-red-400">
                                            ● SEV-1: {incidents.filter(i => i.severity === 'SEV-1').length}
                                        </span>
                                        <span className="text-orange-400">
                                            ● SEV-2: {incidents.filter(i => i.severity === 'SEV-2').length}
                                        </span>
                                        <span className="text-blue-400">
                                            ● SEV-3: {incidents.filter(i => i.severity === 'SEV-3').length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Incident Cards */}
                            {incidents.map((incident) => (
                                <div
                                    key={incident.id}
                                    onClick={() => setSelectedIncident(incident)}
                                    className="bg-slate-800/30 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeClass(incident.severity)}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {incident.id}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                Prompt Injection Detected
                                            </h3>

                                            <div className="bg-slate-950 rounded-lg p-3 mb-3 border border-slate-800">
                                                <div className="text-xs text-slate-500 mb-1">Prompt:</div>
                                                <p className="text-sm text-slate-300 line-clamp-2">
                                                    {incident.prompt}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6 text-xs text-slate-400">
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    {incident.matchedPatterns?.length || 0} patterns
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {new Date(incident.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-4">
                                            <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-xs transition-colors">
                                                View Details →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedIncident && (
                        <IncidentDetail
                            incident={selectedIncident}
                            onClose={() => setSelectedIncident(null)}
                        />
                    )}
                </div>
            </div>
        </Layout>
    );
}
