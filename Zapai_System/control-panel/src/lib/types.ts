export type AgentConfig = {
  id?: number;
  name: string;
  description?: string;
  channel: string;
  status: string;
  model: string;
  temperature: number;
  system_prompt: string;
  rules_prompt: string;
  personality_prompt: string;
};

export type ToolConfig = {
  id?: number;
  name: string;
  description: string;
  parameters: Record<string, any>;
  is_active: boolean;
};

export type InteractionLog = {
  id: number;
  timestamp: string;
  lead_id: string;
  agent_id?: number;
  message_in: string;
  message_out: string;
  tool_used?: string;
  confidence: number;
  error?: string;
};
