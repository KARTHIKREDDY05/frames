export interface HighlightSignals {
  likes: number;
  comments: number;
  visualQualityScore?: number;
  faceScore?: number;
  sentimentScore?: number;
  eventScore?: number;
  uniquenessScore?: number;
}

export function calculateHighlightScore(signals: HighlightSignals) {
  const engagementScore = Math.min(1, (signals.likes + signals.comments * 2) / 20);
  return Number(
    (
      engagementScore * 0.3 +
      (signals.visualQualityScore ?? 0.72) * 0.2 +
      (signals.faceScore ?? 0.5) * 0.15 +
      (signals.sentimentScore ?? 0.6) * 0.1 +
      (signals.eventScore ?? 0.45) * 0.15 +
      (signals.uniquenessScore ?? 0.65) * 0.1
    ).toFixed(4)
  );
}
