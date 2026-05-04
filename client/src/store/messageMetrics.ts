import { atomFamily, useRecoilCallback } from 'recoil';

export type MessageMetrics = {
  /** When the user pressed send (T0) */
  submittedAt?: number;
  /** First SSE event of any kind (TTFT — includes thinking, tool calls, content) */
  firstTokenAt?: number;
  /** First user-visible content token (TTFVT — text content only) */
  firstVisibleAt?: number;
  /** When the stream finished or aborted */
  finishedAt?: number;
};

/**
 * Per-message client-side timing atom keyed by the assistant responseMessageId.
 * Populated by the chat submit + SSE handlers; consumed by DebugFooter.
 *
 * In-memory only — page reload wipes timings, which is acceptable for a
 * debug overlay. Survives navigation within an open session.
 */
export const messageMetricsByIdAtom = atomFamily<MessageMetrics, string>({
  key: 'messageMetricsById',
  default: {},
});

function mergeMetrics(prev: MessageMetrics, patch: Partial<MessageMetrics>): MessageMetrics {
  const next: MessageMetrics = { ...prev };
  if (patch.submittedAt != null && next.submittedAt == null) {
    next.submittedAt = patch.submittedAt;
  }
  if (patch.firstTokenAt != null && next.firstTokenAt == null) {
    next.firstTokenAt = patch.firstTokenAt;
  }
  if (patch.firstVisibleAt != null && next.firstVisibleAt == null) {
    next.firstVisibleAt = patch.firstVisibleAt;
  }
  if (patch.finishedAt != null) {
    next.finishedAt = patch.finishedAt;
  }
  return next;
}

export function useRecordMessageMetric() {
  return useRecoilCallback(
    ({ set }) =>
      (messageId: string | undefined, patch: Partial<MessageMetrics>) => {
        if (!messageId) {
          return;
        }
        set(messageMetricsByIdAtom(messageId), (prev) => mergeMetrics(prev, patch));
      },
    [],
  );
}

/**
 * Copy metrics recorded under a temporary client-side id (the placeholder
 * initialResponse.messageId, which ends in `_`) onto the server-assigned
 * final responseMessage.messageId so the DebugFooter — which renders with
 * the final id — can find the timings.
 */
export function useCopyMessageMetrics() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (fromId: string | undefined, toId: string | undefined) => {
        if (!fromId || !toId || fromId === toId) {
          return;
        }
        const source =
          snapshot.getLoadable(messageMetricsByIdAtom(fromId)).valueMaybe() ?? undefined;
        if (!source) {
          return;
        }
        set(messageMetricsByIdAtom(toId), (target) => mergeMetrics(target, source));
      },
    [],
  );
}
