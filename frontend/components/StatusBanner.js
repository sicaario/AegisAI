export default function StatusBanner({ hasIncident }) {
    if (!hasIncident) {
        return (
            <div className="bg-emerald-500/10 border-b border-emerald-500/30">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 text-sm font-medium">
                            All systems secure
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-red-500/10 border-b border-red-500/30 animate-pulse-slow">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-400 font-semibold">
                        Security Incident Detected
                    </span>
                    <span className="text-red-500 text-sm">•</span>
                    <a href="/incidents" className="text-red-400 hover:text-red-300 text-sm underline">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    );
}
