# BioTwin - Hackathon Demo Guide

## Overview
BioTwin is a multi-agent AI system for personalized medicine that demonstrates cutting-edge agentic AI patterns. This guide helps you showcase the 5 advanced features we built for the hackathon.

---

## Quick Start

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

Open: http://localhost:5173/consensus/demo-patient

---

## 5 Advanced Features Demo Script

### Feature 1: Interactive HITL Steering
**What it shows:** Doctors can inject constraints mid-deliberation, and agents dynamically acknowledge and re-negotiate.

**Demo Steps:**
1. Click "Start Consensus" to begin agent deliberation
2. Wait for agents to start analyzing (tool use badges appear)
3. In the command line at the bottom of the feed, type:
   - `"Patient had severe GI issues with Metformin"`
   - Press Enter or click "Inject"
4. Watch the **Endocrinologist** flash yellow and respond:
   - `"INTERCEPTING: Patient history noted. Withdrawing Metformin..."`
5. See the re-negotiation trigger

**Key Talking Point:** "Real doctors need to inject clinical context that wasn't in the records. Our agents don't just acknowledge - they pivot their entire recommendation strategy."

---

### Feature 2: Dynamic Agent Swarming
**What it shows:** Agents can spawn sub-agents (specialists) when case complexity demands it.

**Demo Steps:**
1. The demo patient has cardiovascular markers
2. When the Endocrinologist runs, watch for:
   - "SUB-AGENT SUMMONED" message (pink/fuchsia)
   - "Cardiologist Sub-Agent" appears
3. The sub-agent provides a specialized ruling with recommendations
4. Sub-agent responses appear indented with a violet border

**Key Talking Point:** "This is the Agent-as-a-Manager pattern. Instead of hardcoding specialists, our agents dynamically recognize when they need expert backup."

---

### Feature 3: Live Tool-Use Overlay
**What it shows:** Agents actively query external databases and APIs in real-time.

**Demo Steps:**
1. As agents analyze, watch for sky-blue "tool use" cards:
   - "PharmGKB Lookup" - genetic database
   - "PubMed Interactions API" - literature search
   - "GoodRx Pricing API" - drug costs
   - "CPIC Guidelines" - pharmacogenomics
2. Each tool shows the specific query being made

**Key Talking Point:** "We're showing the 'why' behind the AI's reasoning. Doctors can see that the Pharmacologist actually checked PubMed for interaction data, not just hallucinating it."

---

### Feature 4: Consensus Gravity Graph
**What it shows:** A live 2D visualization of multi-agent debate and consensus formation.

**Demo Steps:**
1. Toggle "Gravity Graph" button in the header
2. The patient is at the center, agents orbit around
3. Watch connection lines during deliberation:
   - **Purple dashed** = Analyzing
   - **Green solid** = Agreement
   - **Red dashed** = Veto
4. When consensus is reached:
   - All connections turn green
   - Center node shows checkmark
   - Agent-to-agent connections appear

**Key Talking Point:** "This gives an at-a-glance view of where the AI system is in its reasoning. You can instantly see if there's contention or alignment."

---

### Feature 5: Agent Memory & Self-Reflection
**What it shows:** Agents learn from past cases and proactively apply that knowledge.

**Demo Steps:**
1. Look for the dashed-border "reflection" cards (indigo/slate)
2. HERA will show: "Recalling past cases with budget constraints..."
3. The reflection influences the agent's behavior
4. When HERA vetoes, note it mentions "Based on past case memory"

**Key Talking Point:** "This is episodic memory for AI agents. HERA remembers that last time it approved a biologic for a similar budget, the patient couldn't afford it. It applies that learning proactively."

---

## Key Demo Scenarios

### Scenario A: Budget-Constrained Diabetic
- Patient has $150/month medication budget
- HERA learns from past cases to veto expensive drugs early
- Demonstrates Feature 5 (Memory) + Feature 3 (Tool Use)

### Scenario B: Complex Cardiac Case
- Patient has cardiovascular comorbidity
- Endocrinologist summons Cardiologist sub-agent
- Demonstrates Feature 2 (Swarming)

### Scenario C: Doctor Override
- Start consensus, then type "Patient allergic to Metformin"
- Watch Pharmacologist intercept with safety flag
- Demonstrates Feature 1 (HITL Steering)

---

## Architecture Highlights

```
Frontend (React + Vite)
├── ConsensusWorkspace.jsx    # Main orchestration
├── AgentActivityFeed.jsx     # Live chat with all message types
├── ConsensusGravityGraph.jsx # SVG visualization
└── SidebarHITLPanel.jsx      # Quick intervention buttons

Backend (Node.js + Express)
├── agentNegotiation.service.js  # Core negotiation loop
├── agentMemory.service.js       # Episodic memory system
├── agentSwarming.service.js     # Sub-agent registry
└── agentTools.service.js        # Tool simulation
```

---

## Technical Differentiators

1. **Actor Model Pattern**: Agents run in parallel, not sequential
2. **Guardian Agent (HERA)**: Economic constraints have veto power
3. **WebSocket Telemetry**: Real-time streaming of agent thoughts
4. **Pure React/SVG**: No heavy D3 dependency for visualization
5. **Graceful Fallback**: Works with or without AI API keys

---

## Troubleshooting

**Backend won't start:**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# Kill the process if needed
```

**No AI responses:**
- The system works in "demo mode" without API keys
- For real AI, set `OPENROUTER_API_KEY` in `.env`

**WebSocket not connecting:**
- Check backend console for "WebSocket telemetry server initialized"
- Frontend should show "Live Connected" in header

---

## Demo Checklist

- [ ] Backend running (shows "MongoDB Connected")
- [ ] Frontend running (http://localhost:5173)
- [ ] Gravity Graph toggle is visible
- [ ] "Start Consensus" button works
- [ ] Tool-use cards appear during deliberation
- [ ] HITL command line accepts input
- [ ] Sub-agent summon appears for demo patient
- [ ] Consensus reached with confidence score

---

## Winning Points

1. **Not just chat** - We show structured agent reasoning with tool use
2. **Human stays in control** - HITL steering isn't an afterthought
3. **Agents collaborate** - Sub-agent swarming shows emergent behavior
4. **Memory persists** - Agents learn across cases, not just within one
5. **Beautiful UX** - Medical professionals can actually use this

Good luck with the demo!
