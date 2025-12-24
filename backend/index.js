import './src/utils/config.js';
import express from 'express';
import cors from 'cors';
import { config } from './src/utils/config.js';
import logger from './src/utils/logger.js';
import promptRouter from './src/routes/prompt.js';
import incidentsRouter from './src/routes/incidents.js';

const app = express();
const PORT = config.server.port;

app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'aegisai-backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.use('/api/prompt', promptRouter);
app.use('/api/incidents', incidentsRouter);

app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path
    });

    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log('\n🚀 AegisAI Backend is running');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${config.datadog.env}`);
    console.log(`   CORS Origin: ${config.server.corsOrigin}`);
    console.log(`   Health Check: http://localhost:${PORT}/health\n`);
    logger.info('Server started', { port: PORT });
});

export default app;
