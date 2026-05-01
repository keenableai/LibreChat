import React, { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { Constants } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import { ephemeralAgentByConvoId } from '~/store';
import { useBadgeRowContext } from '~/Providers';

/**
 * Renders a small red footer under each non-user message with the metrics
 * that are easily extractable from the message object:
 *  - End-to-end latency (updatedAt − createdAt)
 *  - Output token count (message.tokenCount)
 *
 * TTFT and total input tokens are not yet available without backend
 * instrumentation; they show as "—" for now.
 *
 * Reads debug_mode from BOTH the message's conversationId atom AND the
 * BadgeRowContext's atom (typically the same, but they diverge briefly
 * when a new conversation transitions from 'new' to its real UUID — the
 * dialog wrote under 'new', the rendered message has the UUID).
 */
function DebugFooter({ message }: { message: TMessage }) {
  const ctx = useBadgeRowContext();
  const messageConvoKey = (message?.conversationId as string) ?? Constants.NEW_CONVO;
  const ctxConvoKey = ctx?.conversationId ?? Constants.NEW_CONVO;
  const messageAgent = useRecoilValue(ephemeralAgentByConvoId(messageConvoKey));
  const ctxAgent = useRecoilValue(ephemeralAgentByConvoId(ctxConvoKey));
  const newAgent = useRecoilValue(ephemeralAgentByConvoId(Constants.NEW_CONVO));
  const debugMode =
    messageAgent?.debug_mode ?? ctxAgent?.debug_mode ?? newAgent?.debug_mode ?? false;

  if (!debugMode) {
    return null;
  }
  if (message?.isCreatedByUser) {
    return null;
  }

  const created = message?.createdAt ? new Date(message.createdAt).getTime() : null;
  const updated = message?.updatedAt ? new Date(message.updatedAt).getTime() : null;
  const latencyMs =
    created != null && updated != null && updated > created ? updated - created : null;
  const outTokens = message?.tokenCount;

  const fmtSec = (ms: number | null) => (ms == null ? '—' : `${(ms / 1000).toFixed(2)}s`);
  const fmtTok = (t: number | null | undefined) => (t == null ? '—' : `${t}`);

  return (
    <div
      className="mt-1 select-text font-mono text-xs text-red-500 dark:text-red-400"
      data-testid="debug-footer"
    >
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <span>TTFT: —</span>
      {' · '}
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <span>e2e: {fmtSec(latencyMs)}</span>
      {' · '}
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <span>in: —</span>
      {' · '}
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <span>out: {fmtTok(outTokens)}</span>
    </div>
  );
}

export default memo(DebugFooter);
