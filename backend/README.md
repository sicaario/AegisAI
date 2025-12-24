# AegisAI Backend

Express-based REST API server providing LLM observability services.

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

### Submit Prompt
```
POST /api/prompt
Body: { "prompt": "string" }
```
Processes a prompt through the observability pipeline:
1. Runs detection scan
2. Sends to Gemini
3. Logs to Datadog
4. Creates incident if malicious
5. Returns response with metadata

### List Incidents
```
GET /api/incidents
```
Returns all detected incidents.

### Get Incident Details
```
GET /api/incidents/:id
```
Returns specific incident data.

### Generate Autopsy
```
POST /api/incidents/:id/autopsy
```
Generates AI-powered root cause analysis.

### Generate Fix
```
POST /api/incidents/:id/fix
```
Generates safe prompt rewrite with explanation.

### Replay Request
```
POST /api/incidents/:id/replay
Body: { "useFixed": boolean }
```
Replays original or fixed prompt.

### Generate Executive Summary
```
POST /api/incidents/:id/executive-summary
```
Generates non-technical summary for executives.

## Services

- **geminiService** - Google Gemini API integration
- **datadogService** - Datadog Logs/Incidents/Metrics APIs
- **detectionService** - Pattern-based prompt injection detection
- **autopsyService** - AI-generated analysis and fixes
- **replayService** - Request replay with in-memory storage

## Running

```bash
npm install
npm run dev
```

Server starts on port 3001.
