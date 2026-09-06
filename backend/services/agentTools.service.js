/**
 * Agent Tool Use Service
 * 
 * Simplified for production. Replaces the simulated fake APIs
 * with a transparent "Simulated Clinical Evidence" indicator.
 */

const AGENT_TOOLS = {
  simulated_clinical_evidence: {
    id: 'simulated_clinical_evidence',
    name: 'Simulated Clinical Database',
    description: 'Generic simulated data for demonstration purposes',
    agent: 'all',
    icon: '📊',
    simulatedDelay: 300
  }
};

const TOOL_RESULTS = {
  simulated_clinical_evidence: (params) => ({
    status: 'Simulated Data Provided',
    note: 'This is simulated evidence and not from a live API.'
  })
};

async function executeTool(toolId, params = {}) {
  const tool = AGENT_TOOLS.simulated_clinical_evidence;
  await new Promise(resolve => setTimeout(resolve, tool.simulatedDelay));
  
  return {
    toolId: tool.id,
    toolName: tool.name,
    executedAt: Date.now(),
    params,
    result: TOOL_RESULTS.simulated_clinical_evidence(params),
    duration: tool.simulatedDelay
  };
}

function getAgentTools(agentId) {
  return [AGENT_TOOLS.simulated_clinical_evidence];
}

function generateToolSequence(agentId, patientData) {
  const tool = AGENT_TOOLS.simulated_clinical_evidence;
  return [{
    tool: tool.id,
    toolName: tool.name,
    icon: tool.icon,
    description: tool.description,
    action: 'Querying Simulated Clinical Database...'
  }];
}

function generateToolAction(toolId, patientData) {
  return 'Querying Simulated Clinical Database...';
}

function getAllTools() {
  return AGENT_TOOLS;
}

function getTool(toolId) {
  return AGENT_TOOLS.simulated_clinical_evidence;
}

module.exports = {
  AGENT_TOOLS,
  executeTool,
  getAgentTools,
  generateToolSequence,
  generateToolAction,
  getAllTools,
  getTool
};
