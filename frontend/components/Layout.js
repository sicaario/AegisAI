import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
    const router = useRouter();

    const navLinks = [
        { name: 'Chat', href: '/', icon: '💬' },
        { name: 'Incidents', href: '/incidents', icon: '🚨' },
    ];

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Modern Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">AegisAI</span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-lg transition-all ${router.pathname === link.href
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="mr-2">{link.icon}</span>
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0">
                {children}
            </main>

            {/* Modern Footer */}
            <footer className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>System Operational</span>
                            </div>
                            <span>•</span>
                            <span>Powered by <strong className="text-slate-300">Vertex AI</strong></span>
                            <span>•</span>
                            <span>Monitored by <strong className="text-slate-300">Datadog</strong></span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>© 2025 AegisAI</span>
                            <a href="https://cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer"
                                className="hover:text-slate-300 transition-colors">
                                About Vertex AI
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
