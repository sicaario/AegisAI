import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT',
  'DATADOG_API_KEY',
  'DATADOG_APP_KEY',
  'DATADOG_SITE',
  'DD_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ ERROR: Missing required environment variables:\n');
  missingVars.forEach(varName => {
    console.error(`  - ${varName}`);
  });
  console.error('\nPlease create a .env file in the project root with all required variables.');
  console.error('See .env.example for reference.\n');
  process.exit(1);
}

export const config = {
  gemini: {
    project: process.env.GOOGLE_CLOUD_PROJECT
  },
  datadog: {
    apiKey: process.env.DATADOG_API_KEY,
    appKey: process.env.DATADOG_APP_KEY,
    site: process.env.DATADOG_SITE,
    env: process.env.DD_ENV
  },
  server: {
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};

console.log('✅ Configuration loaded successfully');
console.log(`   Environment: ${config.datadog.env}`);
console.log(`   Datadog Site: ${config.datadog.site}`);
console.log(`   Server Port: ${config.server.port}`);
