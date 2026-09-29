import { sessionMatchesModel } from '@shared/agentSessionModel';
import { buildSpawnCommand, tokenizeCommand, type AgentProvider, type HarnessConfig } from '../store/config';
import type { Agent } from '../store/store';
import { roleForHiveSpawn } from '@shared/agentRole';

type SwitchApi = Pick<Window['cth'], 'toolsStatus' | 'gitIsRepo' | 'killPty' | 'spawnPty' | 'listPtys'>;
/** Preflight before stopping the old process. Never resume a different model's conversation. */
export async function switchAgentModel(
  agent: Agent, config: HarnessConfig, provider: AgentProvider, model: string | undefined,
  dependencies: {
    api: SwitchApi;
    prepareTerminal: (id: string) => { cols: number; rows: number };
    update: (patch: Partial<Agent>) => void;
    missingEngine: (label: string) => string;
    failed: string;
  }
): Promise<void> {
  const { api, update } = dependencies;
  const tool = (await api.toolsStatus()).find(tool => tool.id === `engine:${provider}`);
  if (tool && !tool.found) throw new Error(dependencies.missingEngine(tool.label));
  let cwd = agent.cwd;
  if (agent.worktreePath && await api.gitIsRepo(agent.worktreePath)) cwd = agent.worktreePath;
  const command = buildSpawnCommand(config, model, provider);
  const [exe, ...args] = tokenizeCommand(command);
  const id = agent.ptyId ?? `pty-${agent.id}`;
  if (agent.ptyId) {
    const killed = await api.killPty(id, { preserveWorktree: true });
    if (!killed.ok && !/^no pty:/.test(killed.error ?? '')) throw new Error(killed.error ?? dependencies.failed);
  }
  try {
    const dimensions = dependencies.prepareTerminal(id);
    const result = await api.spawnPty({
      id, cwd, command: exe, args, provider, ...dimensions, isolate: false, resume: false,
      hive: { id: agent.id, name: agent.name, cwd: agent.cwd, provider,
        isGod: agent.isGod, isAssistant: agent.isAssistant, role: roleForHiveSpawn(agent) }
    });
    if (!result.ok) throw new Error(result.error ?? dependencies.failed);
    const live = (await api.listPtys()).find(session => session.id === id);
    if (!sessionMatchesModel(live, provider, model)) throw new Error(dependencies.failed);
    update({ provider, model, command, ptyId: id, status: 'idle', action: '',
      contextTokens: 0, contextLimit: undefined, progress: 0,
      recentAssistantText: undefined, recentTextTs: undefined, lastPrompt: undefined,
      blockReason: undefined, carrying: undefined });
  } catch (error) {
    // Keep the old recipe on failure; the editor stays open for correction/retry.
    update({ status: 'blocked', action: dependencies.failed });
    throw error;
  }
}
