import { inferAgentProvider, type AgentProvider } from './agentProvider';
export interface LiveModelSession {
  id: string;
  command: string;
  model?: string;
  /** Older running main processes cannot report a model, only the executable. */
  modelKnown?: boolean;
}
export function sessionMatchesModel(session: LiveModelSession | undefined, provider: AgentProvider, model?: string): boolean {
  if (!session || inferAgentProvider(session.command) !== provider) return false;
  return !session.modelKnown || session.model === model;
}
