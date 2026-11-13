// Suggestions for the design mockup. Codes must stay within the existing
// closed feedback vocabulary (controllers/useFeedbackController.ts).
// A 3-star rating asks what could be improved; 4–5 shows positives only.
export const REASON_SUGGESTIONS = {
  guide: {
    positive: ['interesting_stories', 'clear_delivery'],
    needsWork: ['too_long', 'hard_to_navigate', 'audio_problem', 'description_mismatch'],
  },
  place: {
    positive: ['worth_visiting'],
    needsWork: ['description_mismatch', 'hard_to_reach', 'access_problem'],
  },
};

export function scoreGroup(score) {
  if (!Number.isInteger(score) || score < 1 || score > 5) return null;
  return score >= 4 ? 'positive' : 'needsWork';
}

export function suggestedReasons(kind, score) {
  const group = scoreGroup(score);
  if (!group || !Object.hasOwn(REASON_SUGGESTIONS, kind)) return [];
  return REASON_SUGGESTIONS[kind][group];
}

// Changing stars preserves only suggestions that remain relevant: incompatible
// positive/negative chips cannot be submitted together.
export function keepCompatibleReasons(kind, nextScore, selected) {
  const allowed = new Set(suggestedReasons(kind, nextScore));
  return [...selected].filter((code) => allowed.has(code));
}
