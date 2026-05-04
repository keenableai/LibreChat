import React, { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { Constants } from 'librechat-data-provider';
import type { TMessage } from 'librechat-data-provider';
import { ephemeralAgentByConvoId, messageMetricsByIdAtom } from '~/store';
import { useBadgeRowContext } from '~/Providers';

/**
 * Renders a small red footer under each non-user message with timing and
 * token metrics for debug mode:
 *  - TTFT  — time from submit to the first stream event of any kind
 *            (thinking start, tool call, content delta).
 *  - TTFVT — time from submit to the first user-visible content token.
 *  - e2e   — time from submit to stream completion.
 *  - in    — total input tokens summed across every LLM generation in the
 *            run (LangFuse-style trace aggregate).
 *  - out   — total output tokens summed across every LLM generation.
 *
 * Timings are captured client-side in the SSE pipeline; tokens come from
 * the backend on the streamed responseMessage.
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

  const metrics = useRecoilValue(messageMetricsByIdAtom(message?.messageId ?? ''));

  if (!debugMode) {
    return null;
  }
  if (message?.isCreatedByUser) {
    return null;
  }

  const ttftMs =
    metrics.firstTokenAt != null && metrics.submittedAt != null
      ? Math.max(0, metrics.firstTokenAt - metrics.submittedAt)
      : null;
  const ttfvtMs =
    metrics.firstVisibleAt != null && metrics.submittedAt != null
      ? Math.max(0, metrics.firstVisibleAt - metrics.submittedAt)
      : null;
  const e2eMs =
    metrics.finishedAt != null && metrics.submittedAt != null
      ? Math.max(0, metrics.finishedAt - metrics.submittedAt)
      : null;

  const m = message as unknown as Record<string, unknown>;
  const outTokens =
    typeof m?.tokenCount === 'number'
      ? (m.tokenCount as number)
      : typeof m?.summaryTokenCount === 'number'
        ? (m.summaryTokenCount as number)
        : null;
  const inTokens =
    typeof m?.promptTokens === 'number'
      ? (m.promptTokens as number)
      : typeof m?.inputTokens === 'number'
        ? (m.inputTokens as number)
        : null;

  const fmtSec = (ms: number | null) => (ms == null ? '—' : `${(ms / 1000).toFixed(2)}s`);
  const fmtTok = (t: number | null | undefined) => (t == null ? '—' : `${t}`);

  return (
    <div
      className="mt-1 select-text font-mono text-xs text-red-500 dark:text-red-400"
      data-testid="debug-footer"
    >
      <span>{`TTFT: ${fmtSec(ttftMs)}`}</span>
      <span>{` · TTFVT: ${fmtSec(ttfvtMs)}`}</span>
      <span>{` · e2e: ${fmtSec(e2eMs)}`}</span>
      <span>{` · in: ${fmtTok(inTokens)}`}</span>
      <span>{` · out: ${fmtTok(outTokens)}`}</span>
    </div>
  );
}

export default memo(DebugFooter);
