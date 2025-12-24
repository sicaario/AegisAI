import '../styles/globals.css';
import { datadogLogs } from '@datadog/browser-logs';

// Initialize Datadog Browser Logs
if (typeof window !== 'undefined') {
    datadogLogs.init({
        clientToken: 'pub4319a5741d7b825a38c4197f95868492',
        site: 'us3.datadoghq.com',
        service: 'aegisai',
        env: 'demo',
        forwardErrorsToLogs: true,
        sampleRate: 100,
    });

    // Send initial log to verify setup
    datadogLogs.logger.info('AegisAI Frontend Initialized', {
        timestamp: new Date().toISOString(),
        source: 'frontend',
    });
}

export default function App({ Component, pageProps }) {
    return <Component {...pageProps} />;
}
