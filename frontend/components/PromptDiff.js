import { diffLines } from 'diff';

export default function PromptDiff({ original, fixed, explanation }) {
    if (!original || !fixed) {
        return (
            <div className="text-gray-400 text-sm">
                No diff available
            </div>
        );
    }

    const diff = diffLines(original, fixed);

    return (
        <div className="space-y-4">
            <div className="glass-panel p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Prompt Changes</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs font-semibold text-red-400 mb-2 flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            Original (Unsafe)
                        </div>
                        <div className="bg-gray-900/50 rounded p-3 border border-red-500/30">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                {original}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-green-400 mb-2 flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            Fixed (Safe)
                        </div>
                        <div className="bg-gray-900/50 rounded p-3 border border-green-500/30">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                                {fixed}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h5 className="text-xs font-semibold text-gray-400 mb-2">Unified Diff</h5>
                    <div className="bg-gray-950 rounded p-3 font-mono text-xs overflow-x-auto">
                        {diff.map((part, index) => (
                            <div
                                key={index}
                                className={
                                    part.added
                                        ? 'code-diff-add'
                                        : part.removed
                                            ? 'code-diff-remove'
                                            : 'text-gray-400'
                                }
                            >
                                {part.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {explanation && (
                <div className="glass-panel p-4 border-l-4 border-aegis-blue">
                    <h4 className="text-sm font-semibold text-aegis-blue mb-2">💡 Why This Fix Works</h4>
                    <p className="text-sm text-gray-300">{explanation}</p>
                </div>
            )}
        </div>
    );
}
