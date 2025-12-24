# Datadog Observability Strategy for AegisAI

## Overview

AegisAI demonstrates **production-grade LLM observability** using Datadog's comprehensive monitoring platform. This document explains our observability strategy, the signals we track, why they matter for LLM applications, and how Datadog empowers AI engineers to build safer, more reliable systems.

---

## 1. What We Track: The 5 Core Metrics

### **aegisai.request.count** (Counter)
- **What**: Total number of prompt requests processed
- **How**: Incremented at the start of every request in [`prompt.js:24`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L24)
- **Tags**: None (global counter)
- **Purpose**: Baseline for calculating error rates and understanding system load

```javascript
// Code: prompt.js line 24
metricsService.incrementRequestCount();
```

---

### **aegisai.request.latency** (Gauge, milliseconds)
- **What**: End-to-end response time from prompt submission to response delivery
- **How**: Measured as `Date.now() - startTime` in [`prompt.js:29`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L29)
- **Tags**: `malicious:true/false`, `severity:SEV-1/2/3/none`
- **Purpose**: Detect performance degradation, SLO compliance, user experience issues

```javascript
// Code: prompt.js lines 12, 29, 44
const startTime = Date.now();
// ... processing happens ...
const totalLatency = Date.now() - startTime;
metricsService.recordLatency(totalLatency, metricTags);
```

**Why This Matters for LLMs**:
- Gemini API calls can be slow (500-3000ms typical)
- Users abandon apps with latency > 3 seconds
- High latency may indicate API throttling or network issues

---

### **aegisai.request.error** (Counter)
- **What**: Count of failed requests (5xx errors, exceptions)
- **How**: Incremented in catch block in [`prompt.js:101`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L101)
- **Tags**: `error_type:500`, `error_name:UnknownError` (or actual error name)
- **Purpose**: Track system reliability and identify systemic issues

```javascript
// Code: prompt.js lines 101-106
catch (error) {
    metricsService.incrementError({
        error_type: '500',
        error_name: error.name || 'UnknownError'
    });
}
```

**Why This Matters for LLMs**:
- LLM APIs can fail due to rate limits, quota exhaustion, or downtime
- Zero errors is the ideal state—any error needs immediate investigation
- Error spikes may indicate credential issues or API outages

---

### **aegisai.tokens.used** (Gauge)
- **What**: Number of tokens consumed per request (input + output tokens)
- **How**: Recorded from Gemini API response in [`prompt.js:45`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L45)
- **Tags**: `malicious:true/false`, `severity:SEV-1/2/3/none`
- **Purpose**: **Direct cost tracking**—every token costs money

```javascript
// Code: prompt.js line 45
metricsService.recordTokensUsed(geminiResponse.tokenCount, metricTags);
```

**Why This Matters for LLMs**:
- **Tokens = Money**: Gemini charges per token (e.g., $0.00025/1K tokens for Gemini 1.5 Flash)
- **Budget Control**: Anomalies can indicate abuse (e.g., prompt stuffing attacks)
- **Capacity Planning**: Track usage trends to predict scaling needs

**Real-World Example**:
If a bad actor sends 1000 requests with 10,000 tokens each, that's 10M tokens = **$2,500** in a single attack. This metric catches that.

---

### **aegisai.prompt.risk** (Gauge: 0=low, 1=medium, 2=high)
- **What**: Security risk level of the prompt based on detection patterns
- **How**: Derived from `detectionResult.severity` in [`prompt.js:32-36`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L32-L36)
- **Tags**: `malicious:true/false`, `severity:SEV-1/2/3/none`
- **Purpose**: Real-time security threat visualization

```javascript
// Code: prompt.js lines 32-36
const riskLevel = detectionResult.isMalicious 
    ? (detectionResult.severity === 'SEV-1' ? 2 : 
       detectionResult.severity === 'SEV-2' ? 1 : 0)
    : 0;
metricsService.recordPromptRisk(riskLevel, metricTags);
```

**Risk Level Mapping**:
- **0 (Low)**: Normal, safe prompts
- **1 (Medium)**: SEV-2 or SEV-3 threats (e.g., suspicious patterns but not critical)
- **2 (High)**: SEV-1 critical threats (e.g., prompt injection, data exfiltration)

**Why This Matters for LLMs**:
- **Security Posture**: Visualize attack patterns in real-time
- **Threat Intelligence**: Identify emerging attack vectors
- **Compliance**: Demonstrate security controls for SOC 2, ISO 27001 audits

---

## 2. Dashboard: LLM Health at a Glance

**Dashboard Location**: [`datadog/dashboard.json`](file:///Users/harman/Desktop/AegisAI/datadog/dashboard.json)

### Key Widgets

#### 🛡️ **LLM Health Overview** (Text Widget)
Explains what "healthy" looks like:
- Latency < 2000ms (P95)
- Risk level mostly at 0 (low)
- Error rate < 1%
- Token usage steady and predictable

#### 📊 **Request Latency Over Time**
- **Metric**: `sum:aegisai.request.latency{*}`
- **Type**: Line chart
- **Use**: Spot latency spikes that degrade UX

#### 🔢 **Total Requests**
- **Metric**: `sum:aegisai.request.count{*}`
- **Type**: Query value
- **Use**: Understand system load

#### 🚨 **Error Count Over Time**
- **Metric**: `sum:aegisai.request.error{*}.as_count()`
- **Type**: Bar chart
- **Use**: Identify error spikes needing investigation

#### 🎯 **Prompt Risk Level**
- **Metric**: `avg:aegisai.prompt.risk{*} by {severity}`
- **Type**: Line chart
- **Use**: Visualize security threats in real-time

#### 💰 **Token Usage Over Time**
- **Metric**: `sum:aegisai.tokens.used{*}`
- **Type**: Bar chart
- **Use**: Track costs and detect abuse

---

## 3. Monitors: Automated Threat Detection

### Monitor 1: **High-Risk Prompt Detected** (SEV-1)

**File**: [`datadog/monitors/prompt-injection-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/prompt-injection-monitor.json)

**Trigger Condition**:
```
logs("service:aegisai status:warn @prompt_injection:true")
  .index("*")
  .rollup("count")
  .last("5m") > 0
```

**Threshold**: **1+ malicious prompt in 5 minutes**

**Why SEV-1**:
- Prompt injection is a **critical security vulnerability**
- Can lead to data leaks, unauthorized access, or model manipulation
- Requires immediate incident response

**Alert Message**:
```markdown
## ⚠️ Prompt Injection Detected

**SEV-1 Security Alert**

A malicious prompt injection attempt has been detected by AegisAI.

**Service:** aegisai
**Environment:** {{env.name}}
**Detection Time:** {{last_triggered_at}}
**Matched Patterns:** {{@matched_patterns.name}}

**Action Required:**
1. Review the incident in the AegisAI dashboard
2. Analyze the AI autopsy report
3. Implement suggested prompt fixes
```

---

### Monitor 2: **High Latency** (SEV-2)

**File**: [`datadog/monitors/latency-slo-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/latency-slo-monitor.json)

**Trigger Condition**:
```
avg(last_5m):avg:aegisai.request.latency{*} > 2000
```

**Thresholds**:
- **Warning**: 1500ms
- **Critical**: 2000ms

**Why SEV-2**:
- High latency degrades user experience but doesn't pose immediate security risk
- May indicate upstream API issues or resource exhaustion
- Requires investigation but not emergency response

**Alert Message**:
```markdown
## ⚠️ High Latency Detected in AegisAI

**SEV-2 Performance Alert**

The average response latency has exceeded the 2-second SLO threshold.

**Current Latency:** {{value}}ms
**Threshold:** 2000ms

**Impact:**
- User experience degradation
- Potential timeout issues
- SLO compliance risk

**Recommended Actions:**
1. Check Gemini API performance
2. Review backend resource utilization
3. Investigate slow database queries
4. Check network connectivity
```

---

### Monitor 3: **Token Usage Spike** (SEV-3)

**File**: [`datadog/monitors/token-spike-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/token-spike-monitor.json)

**Trigger Condition**:
```
avg(last_10m):anomalies(
  avg:aegisai.tokens.used{*}, 
  'basic', 
  3, 
  direction='above', 
  interval=60, 
  alert_window='last_15m'
) >= 1
```

**Threshold**: **Anomaly score ≥ 1** (3 standard deviations above baseline)

**Why SEV-3**:
- Cost concern but not critical security or availability issue
- May indicate abuse, but could also be legitimate traffic spike
- Warrants investigation to prevent budget overruns

**Alert Message**:
```markdown
## ⚠️ Unusual Token Usage Detected

**SEV-3 Cost/Abuse Alert**

AegisAI has detected an anomalous spike in token consumption.

**Potential Causes:**
- Unusually long prompts or responses
- High volume of requests
- Malicious activity (prompt stuffing)
- API abuse

**Impact:**
- Increased Gemini API costs
- Potential rate limiting
- Budget overrun risk

**Recommended Actions:**
1. Review recent prompts for abnormal length
2. Check for automated/bot traffic
3. Verify rate limiting is active
4. Review cost dashboard
```

---

## 4. Incident Management

### Automatic Incident Creation

AegisAI **automatically creates Datadog Incidents** when malicious prompts are detected:

**Code**: [`datadogService.js:55-109`](file:///Users/harman/Desktop/AegisAI/backend/src/services/datadogService.js#L55-L109)

```javascript
async createIncident(title, severity, description, fields = {}) {
    const incidentPayload = {
        data: {
            type: 'incidents',
            attributes: {
                title,
                customer_impact_scope: description,
                fields: {
                    severity: { type: 'dropdown', value: severity },
                    state: { type: 'dropdown', value: 'active' },
                    ...fields
                }
            }
        }
    };

    const response = await axios.post(
        `${this.baseUrl}/api/v2/incidents`,
        incidentPayload,
        { headers: this.headers }
    );

    return {
        id: response.data.data.id,
        url: `https://${this.site}/incidents/${incidentId}`
    };
}
```

**When Triggered**:
- Every time `detectionResult.isMalicious === true` (see [`prompt.js:48-74`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js#L48-L74))
- Incident includes:
  - **Title**: "Prompt Injection Detected: [patterns]"
  - **Severity**: SEV-1, SEV-2, or SEV-3
  - **Fields**: Prompt snippet (first 500 chars), matched patterns
  - **URL**: Direct link to Datadog Incident Management UI

---

### Manual Incident Creation (If Needed)

While AegisAI auto-creates incidents for detected threats, you can also manually create incidents:

**Steps**:
1. **Navigate to Datadog Incidents**: `https://us3.datadoghq.com/incidents`
2. **Click "Declare Incident"** in the top-right
3. **Fill in details**:
   - **Title**: "AegisAI: [Brief description]"
   - **Severity**: SEV-1 (Critical), SEV-2 (High), SEV-3 (Medium)
   - **Customer Impact**: Describe what users/customers are experiencing
4. **Link Evidence**:
   - Click "Add Link" → Paste Datadog log query URL
   - Example: `https://us3.datadoghq.com/logs?query=service:aegisai @prompt_injection:true`
5. **Assign Responder**: Tag the on-call engineer or team
6. **Update Status**: Set to "Investigating", "Identified", "Monitoring", or "Resolved"

**Best Practice**: Always link to relevant logs or monitor alerts when creating manual incidents.

---

### Monitor-to-Incident Workflow

**How Monitors Create Incidents**:

Datadog monitors **do not automatically create incidents by default**. However, you can configure this:

**Option 1: Use Datadog Workflows** (Recommended)
1. Go to **Datadog Workflows**: `https://us3.datadoghq.com/workflow`
2. Create a new workflow: **"Monitor Alert → Create Incident"**
3. **Trigger**: Monitor alert state changes to "Alert"
4. **Action**: Create incident via API with monitor details
5. **Save** and link to your monitors

**Option 2: Manual Workflow (Current Implementation)**
1. Monitor fires → Sends alert to Slack/PagerDuty
2. Engineer reviews alert
3. If incident-worthy, declares incident manually (steps above)
4. Links monitor alert to incident for context

**AegisAI's Approach**:
- **Application-level incidents**: Auto-created via `datadogService.createIncident()` for prompt injections
- **Monitor alerts**: Sent to notification channels; incident creation is manual or via Workflows

---

## 5. Why This Matters for LLM Applications

### **Cost Visibility**
- **Problem**: LLM API costs can spiral unpredictably
- **Solution**: `aegisai.tokens.used` tracks every token, allowing cost attribution and budgeting
- **Example**: If token usage spikes 10x, you know immediately and can investigate before the bill arrives

### **Security Posture**
- **Problem**: Prompt injection attacks can bypass LLM safety filters
- **Solution**: `aegisai.prompt.risk` + monitors provide **real-time threat detection**
- **Example**: Detect and block "Ignore all instructions" attacks before they cause damage

### **User Experience**
- **Problem**: Slow LLM responses cause user abandonment
- **Solution**: `aegisai.request.latency` monitors ensure SLOs are met
- **Example**: If latency > 2s, investigate Gemini API performance or network issues

### **Reliability**
- **Problem**: LLM APIs can fail silently or return errors
- **Solution**: `aegisai.request.error` tracks failure rates
- **Example**: If errors spike, you know to check API credentials or rate limits

### **Compliance & Auditing**
- **Problem**: Regulators require proof of security controls
- **Solution**: Datadog provides **immutable audit logs** and incident history
- **Example**: For SOC 2, show judges that you detect and respond to threats within minutes

---

## 6. How Datadog Helps AI Engineers Act

### **Real-Time Insights**
- **Dashboard**: See LLM health at a glance—no manual log parsing
- **Alerts**: Automated notifications via Slack/PagerDuty when thresholds breach
- **Logs**: Searchable, structured logs with full context (prompt, response, patterns)

### **Root Cause Analysis**
- **Distributed Tracing**: (If APM enabled) Trace requests from frontend → backend → Gemini API
- **Correlations**: Link latency spikes to specific Gemini API calls
- **Autopsy Reports**: AegisAI generates AI-powered root cause analysis (via Gemini)

### **Proactive Prevention**
- **Anomaly Detection**: Catch unusual patterns before they become incidents
- **SLO Tracking**: Monitor latency against SLOs (e.g., 95% of requests < 2s)
- **Cost Forecasting**: Predict monthly Gemini API bill based on token trends

### **Incident Response**
- **Centralized Command Center**: Datadog Incident Management brings together alerts, logs, metrics, and team communication
- **Automated Workflow**: Monitors fire → Slack alert → Engineer investigates → Incident created → Root cause identified → Fix deployed → Incident resolved
- **Postmortems**: Export incident timeline for blameless postmortems

---

## 7. Testing Your Observability Setup

### **Run the Traffic Generator**

```bash
cd /Users/harman/Desktop/AegisAI
node scripts/trafficGenerator.js
```

**What It Does**:
- **Phase 1**: Sends 10 normal prompts (baseline traffic)
- **Phase 2**: Sends 15 malicious prompts (triggers **SEV-1 monitor**)
- **Phase 3**: Sends 10 long prompts (triggers **SEV-3 token spike monitor**)
- **Phase 4**: Sends 15 concurrent requests (may trigger **SEV-2 latency monitor**)

**Expected Outcomes**:
1. **Datadog Logs**: 50+ log entries in `https://us3.datadoghq.com/logs?query=service:aegisai`
2. **Metrics**: All 5 metrics visible in Metrics Explorer
3. **Monitors**: At least 2/3 monitors triggered (Prompt Injection + Token Spike guaranteed)
4. **Incidents**: 15 auto-created incidents for malicious prompts

---

### **Verify Metrics in Datadog**

1. Go to **Metrics Explorer**: `https://us3.datadoghq.com/metric/explorer`
2. Search for:
   - `aegisai.request.count`
   - `aegisai.request.latency`
   - `aegisai.request.error`
   - `aegisai.tokens.used`
   - `aegisai.prompt.risk`
3. **Confirm**: Metrics show data from the last 15 minutes
4. **Check Tags**: Verify `malicious:true/false`, `severity:SEV-1/2/3` tags are present

---

### **Import Dashboard**

1. Go to **Dashboards**: `https://us3.datadoghq.com/dashboard/lists`
2. Click **"New Dashboard"** → **"Import Dashboard JSON"**
3. Paste contents of [`datadog/dashboard.json`](file:///Users/harman/Desktop/AegisAI/datadog/dashboard.json)
4. **Save** and view the dashboard
5. **Confirm**: All widgets display data (may take 1-2 minutes for metrics to propagate)

---

### **Create Monitors**

**For each monitor JSON file**:
1. Go to **Monitors**: `https://us3.datadoghq.com/monitors/manage`
2. Click **"New Monitor"** → **"Import Monitor JSON"**
3. Paste contents of:
   - [`prompt-injection-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/prompt-injection-monitor.json)
   - [`latency-slo-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/latency-slo-monitor.json)
   - [`token-spike-monitor.json`](file:///Users/harman/Desktop/AegisAI/datadog/monitors/token-spike-monitor.json)
4. **Save** each monitor
5. **Run traffic generator** to trigger alerts

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                            │
│                     (Submit Prompt via UI)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEXT.JS FRONTEND (Port 3000)                   │
│  • Sends POST /api/prompt to backend                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               NODE.JS BACKEND (Port 3001)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. metricsService.incrementRequestCount()                │  │
│  │    → StatsD → Datadog Agent (localhost:8125)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. detectionService.detectPromptInjection(prompt)        │  │
│  │    → Checks 16 malicious patterns → Returns risk level  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. metricsService.recordPromptRisk(riskLevel)            │  │
│  │    → StatsD → Datadog Agent                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. geminiService.generateResponse(prompt)                │  │
│  │    → Calls Vertex AI Gemini 2.0 via ADC                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. metricsService.recordLatency(totalLatency)            │  │
│  │    metricsService.recordTokensUsed(tokenCount)           │  │
│  │    → StatsD → Datadog Agent                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. datadogService.logPromptRequest(...)                  │  │
│  │    → HTTP POST to Datadog Logs API                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 7. IF malicious: datadogService.createIncident(...)      │  │
│  │    → HTTP POST to Datadog Incidents API                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATADOG PLATFORM                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AGENT (Docker, Port 8125 StatsD)                         │  │
│  │  • Receives metrics via StatsD (fire-and-forget UDP)     │  │
│  │  • Aggregates and forwards to Datadog cloud              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ METRICS (Metrics Explorer)                               │  │
│  │  • aegisai.request.count                                 │  │
│  │  • aegisai.request.latency                               │  │
│  │  • aegisai.request.error                                 │  │
│  │  • aegisai.tokens.used                                   │  │
│  │  • aegisai.prompt.risk                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ LOGS (Log Explorer)                                      │  │
│  │  • Full prompt + response text                           │  │
│  │  • Detection patterns matched                            │  │
│  │  • Latency, tokens, risk level                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ MONITORS (Alerting)                                      │  │
│  │  • Prompt Injection (SEV-1)                              │  │
│  │  • High Latency (SEV-2)                                  │  │
│  │  • Token Spike (SEV-3)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ INCIDENTS (Incident Management)                          │  │
│  │  • Auto-created for malicious prompts                    │  │
│  │  • Includes prompt snippet, patterns, severity           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DASHBOARD (Visualization)                                │  │
│  │  • LLM Health Overview                                   │  │
│  │  • Request Latency, Token Usage, Risk Level charts       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Quick Reference

### **Metric Names**
| Metric | Type | Unit | Purpose |
|--------|------|------|---------|
| `aegisai.request.count` | Counter | count | Track total requests |
| `aegisai.request.latency` | Gauge | milliseconds | Monitor response time |
| `aegisai.request.error` | Counter | count | Track failures |
| `aegisai.tokens.used` | Gauge | count | Cost tracking |
| `aegisai.prompt.risk` | Gauge | 0/1/2 | Security threat level |

### **Monitor Thresholds**
| Monitor | Severity | Threshold | Purpose |
|---------|----------|-----------|---------|
| Prompt Injection | SEV-1 | 1+ in 5min | Security threat |
| High Latency | SEV-2 | > 2000ms avg | SLO breach |
| Token Spike | SEV-3 | 3σ anomaly | Cost control |

### **Code Locations**
| Component | File | Lines |
|-----------|------|-------|
| StatsD Client | [`metricsService.js`](file:///Users/harman/Desktop/AegisAI/backend/src/services/metricsService.js) | All |
| Metric Emission | [`prompt.js`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js) | 24, 44-46, 101-106 |
| Risk Calculation | [`prompt.js`](file:///Users/harman/Desktop/AegisAI/backend/src/routes/prompt.js) | 32-36 |
| Incident Creation | [`datadogService.js`](file:///Users/harman/Desktop/AegisAI/backend/src/services/datadogService.js) | 55-109 |
| Dashboard | [`datadog/dashboard.json`](file:///Users/harman/Desktop/AegisAI/datadog/dashboard.json) | All |
| Monitors | [`datadog/monitors/`](file:///Users/harman/Desktop/AegisAI/datadog/monitors) | All 3 files |

---

## 10. Summary: Why Judges Should Care

**AegisAI demonstrates**:

1. **Real Datadog Integration**: Not mock data—actual StatsD metrics, HTTP API calls, and incident creation
2. **LLM-Specific Observability**: Metrics designed for AI/LLM workloads (tokens, risk, latency)
3. **Production-Ready**: Error handling, structured logging, and comprehensive monitoring
4. **Security-First**: Automated threat detection with SEV-1/2/3 severity classification
5. **Cost Control**: Token usage tracking for budget visibility
6. **Incident Response**: Automated incident creation with full context

**This is not a hackathon demo—it's a blueprint for production LLM observability.**

---

**Questions?** See [`README.md`](file:///Users/harman/Desktop/AegisAI/README.md) or reach out to the AegisAI team.
