import { AgentConfig, ToolConfig, InteractionLog } from "./types";

const BASE_URL = "http://localhost:8001";

export async function getAgents(): Promise<AgentConfig[]> {
    const res = await fetch(`${BASE_URL}/agents/`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch agents");
    return res.json();
}

export async function getAgent(id: number): Promise<AgentConfig> {
    const res = await fetch(`${BASE_URL}/agents/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch agent");
    return res.json();
}

export async function createAgent(agent: AgentConfig): Promise<AgentConfig> {
    const res = await fetch(`${BASE_URL}/agents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
    });
    if (!res.ok) throw new Error("Failed to create agent");
    return res.json();
}

export async function updateAgent(id: number, agent: Partial<AgentConfig>): Promise<AgentConfig> {
    const res = await fetch(`${BASE_URL}/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
    });
    if (!res.ok) throw new Error("Failed to update agent");
    return res.json();
}

export async function deleteAgent(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/agents/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete agent");
}

export async function getLogs(): Promise<InteractionLog[]> {
    const res = await fetch(`${BASE_URL}/logs/`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
}

export async function getTools(): Promise<ToolConfig[]> {
    const res = await fetch(`${BASE_URL}/tools/`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch tools");
    return res.json();
}
