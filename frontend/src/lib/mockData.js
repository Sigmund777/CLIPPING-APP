// Mock demo data used as graceful fallback when backend / network fails.
// Keeps the app fully demonstrable in offline / preview-only modes.

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@hookify.ai",
  name: "Maya Reyes",
  role: "user",
  plan: "free",
  avatar: null,
};

export const DEMO_CLIPS = [
  {
    id: "demo-clip-1",
    user_id: "demo-user",
    title: "The 3 hooks that broke a million views",
    duration_seconds: 38,
    viral_score: 96,
    caption_style: "Bold-Yellow",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "What if I told you that the single biggest mistake creators make...",
    created_at: new Date(Date.now() - 0 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-2",
    user_id: "demo-user",
    title: "Three viral patterns creators sleep on",
    duration_seconds: 42,
    viral_score: 89,
    caption_style: "Karaoke",
    is_exported: true,
    thumbnail_color: "#CCFF00",
    transcript_preview: "If your hook doesn't slap, your video is dead on arrival.",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-3",
    user_id: "demo-user",
    title: "Never start your Reel with a static shot",
    duration_seconds: 34,
    viral_score: 84,
    caption_style: "Bold-Yellow",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "Pattern two: use motion in the first frame, never a static shot.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const DEMO_TRANSCRIPT = {
  language: "en",
  segments: [
    { start: 0.0, end: 4.2, text: "What if I told you that the single biggest mistake creators make..." },
    { start: 4.2, end: 8.5, text: "is treating short-form like a shrunken version of their long-form content." },
    { start: 8.5, end: 12.8, text: "Algorithms reward emotional density in the first three seconds." },
    { start: 12.8, end: 17.4, text: "If your hook doesn't slap, your video is dead on arrival." },
    { start: 17.4, end: 22.1, text: "Here are the three patterns that consistently break a million views." },
    { start: 22.1, end: 27.6, text: "Pattern one: open with a contradiction the viewer can't ignore." },
    { start: 27.6, end: 33.0, text: "Pattern two: use motion in the first frame, never a static shot." },
    { start: 33.0, end: 38.9, text: "Pattern three: end on a question that pulls them straight back to the start." },
  ],
};

export const DEMO_SUGGESTIONS = {
  clips: [
    { start: 0.0, end: 38.9, score: 96, reason: "Strong hook with pattern-interrupt opening", title: "The 3 hooks that broke a million views" },
    { start: 17.4, end: 55.0, score: 89, reason: "Clear value list, high retention curve", title: "Three viral patterns creators sleep on" },
    { start: 27.6, end: 62.5, score: 84, reason: "Specific tactical advice, save-worthy", title: "Never start your Reel with a static shot" },
    { start: 41.0, end: 78.4, score: 78, reason: "Curiosity loop ending, drives loops", title: "Why your Reels die in the first 2 seconds" },
  ],
  viral_titles: [
    "POV: You finally cracked the YouTube Shorts algorithm",
    "The 3-second rule that 10x'd my Reels",
    "Stop posting until you watch this",
    "Why your podcast clips aren't going viral (yet)",
    "This editing pattern hit 4M views in 12 hours",
    "Streamers, you're leaving views on the table",
  ],
};

export function getDemoClipById(id) {
  return DEMO_CLIPS.find((c) => c.id === id) || DEMO_CLIPS[0];
}

// Demo "generated clips" returned by the AI pipeline after upload analysis.
// Richer shape than DEMO_CLIPS — includes hook copy, platform fit, confidence, timestamps.
export const DEMO_GENERATED_CLIPS = [
  {
    id: "gen-1",
    start_seconds: 142,
    end_seconds: 188,
    duration_seconds: 46,
    title: "The 3-second hook rule nobody is teaching",
    hook: "If your first frame is static, you've already lost the algorithm.",
    transcript_preview: "If your hook doesn't slap, your video is dead on arrival. Algorithms reward emotional density…",
    platforms: ["TikTok", "Shorts", "Reels"],
    confidence: 96,
    reason: "Pattern-interrupt opener · high emotional density · self-contained payoff",
    thumbnail_color: "#CCFF00",
  },
  {
    id: "gen-2",
    start_seconds: 514,
    end_seconds: 562,
    duration_seconds: 48,
    title: "Why your podcast clips aren't going viral (yet)",
    hook: "Spoiler: it's not the audio. It's the first 1.5 seconds.",
    transcript_preview: "Most creators chop highlights at the wrong beat. The viral cut starts on the inhale, not the punchline…",
    platforms: ["TikTok", "Reels"],
    confidence: 91,
    reason: "Curiosity gap · contrarian framing · save-worthy tactical advice",
    thumbnail_color: "#CCFF00",
  },
  {
    id: "gen-3",
    start_seconds: 938,
    end_seconds: 992,
    duration_seconds: 54,
    title: "Three editing patterns that broke a million views",
    hook: "Pattern one alone added 4.2M views in 12 hours.",
    transcript_preview: "Pattern one: contradiction. Pattern two: motion in the first frame. Pattern three: question loop close…",
    platforms: ["Shorts", "Reels"],
    confidence: 88,
    reason: "Clear value list · numbered structure · strong retention curve",
    thumbnail_color: "#CCFF00",
  },
  {
    id: "gen-4",
    start_seconds: 1387,
    end_seconds: 1428,
    duration_seconds: 41,
    title: "Streamers, you're leaving views on the table",
    hook: "Every VOD has 8–12 viral moments. Most of them die in your archive.",
    transcript_preview: "I stream 30 hours a week. There's gold in those clips — but only if you cut them at the contradiction…",
    platforms: ["TikTok", "Shorts"],
    confidence: 84,
    reason: "Direct call-out to audience · specific quant claim · loop-friendly close",
    thumbnail_color: "#CCFF00",
  },
  {
    id: "gen-5",
    start_seconds: 1812,
    end_seconds: 1855,
    duration_seconds: 43,
    title: "Stop posting until you watch this",
    hook: "The biggest mistake creators make in 2026? Treating short-form like shrunken long-form.",
    transcript_preview: "Short-form isn't a clip — it's a self-contained story with a hook, payoff and loop. Treat it like one…",
    platforms: ["Reels", "TikTok", "Shorts"],
    confidence: 79,
    reason: "Bold contrarian opener · educational hook · multi-platform safe",
    thumbnail_color: "#CCFF00",
  },
];

export function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
