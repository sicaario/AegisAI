# AegisAI Frontend

Next.js-based frontend providing dark mission-control UI for LLM observability.

## Pages

### Chat Demo (`/`)
Interactive prompt submission interface with:
- Prompt input textarea
- Real-time status banner
- Response display with metadata
- Quick test buttons
- Detection results

### Incidents Dashboard (`/incidents`)
Incident management interface with:
- Incident list view
- Severity badges
- Filtering and stats
- Clickable cards

## Components

### Layout
Shared layout with navigation, branding, and footer.

### StatusBanner
Dynamic banner showing system status:
- Green: Normal operation
- Red: Incident detected

### PromptDiff
Visual diff component showing:
- Side-by-side comparison
- Unified diff view
- Explanation section

### IncidentDetail
Comprehensive modal with all wow factors:
- AI autopsy report generation
- Prompt fix with diff
- One-click replay
- Executive summary generation

## Styling

- **Tailwind CSS** with custom dark theme
- **Glass morphism** effects
- **Gradient buttons** and badges
- **Custom animations** (slide-up, fade-in, pulse)
- **Responsive** design

## Running

```bash
npm install
npm run dev
```

Frontend starts on port 3000 and proxies API calls to backend.
