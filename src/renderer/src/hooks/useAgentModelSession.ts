import { useEffect, useState } from 'react';
import type { LiveModelSession } from '@shared/agentSessionModel';
export function useAgentModelSession(ptyId?: string) {
  const [state, setState] = useState<{ ready: boolean; session?: LiveModelSession; error?: boolean }>({ ready: false });
  useEffect(() => {
    let active = true;
    setState({ ready: false });
    const refresh = async () => {
      try {
        const sessions = await window.cth.listPtys();
        if (active) setState({ ready: true, session: sessions.find(s => s.id === ptyId) });
      } catch { if (active) setState({ ready: true, error: true }); }
    };
    void refresh();
    const interval = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [ptyId]);
  return state;
}
