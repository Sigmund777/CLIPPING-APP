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
    is_exported: true,
    thumbnail_color: "#CCFF00",
    transcript_preview: "What if I told you that the single biggest mistake creators make...",
    source_video: "founders-lab-ep142.mp4",
    platforms: ["TikTok", "Shorts", "Reels"],
    performance: { views: 1248000, likes: 96400, shares: 12800, comments: 3140, ctr: 11.4 },
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
    source_video: "founders-lab-ep142.mp4",
    platforms: ["TikTok", "Reels"],
    performance: { views: 412000, likes: 31200, shares: 4100, comments: 980, ctr: 8.7 },
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
    source_video: "riya-stream-mar-08.mov",
    platforms: ["Shorts", "Reels"],
    performance: { views: 0, likes: 0, shares: 0, comments: 0, ctr: 0 },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-4",
    user_id: "demo-user",
    title: "Why your podcast clips aren't going viral",
    duration_seconds: 48,
    viral_score: 91,
    caption_style: "Minimal",
    is_exported: true,
    thumbnail_color: "#CCFF00",
    transcript_preview: "Spoiler: it's not the audio. It's the first 1.5 seconds.",
    source_video: "founders-lab-ep142.mp4",
    platforms: ["TikTok", "Reels"],
    performance: { views: 287000, likes: 19400, shares: 2200, comments: 612, ctr: 9.2 },
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-5",
    user_id: "demo-user",
    title: "Streamers, you're leaving views on the table",
    duration_seconds: 41,
    viral_score: 84,
    caption_style: "Beast",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "Every VOD has 8–12 viral moments. Most of them die in your archive.",
    source_video: "riya-stream-mar-08.mov",
    platforms: ["TikTok", "Shorts"],
    performance: { views: 0, likes: 0, shares: 0, comments: 0, ctr: 0 },
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-6",
    user_id: "demo-user",
    title: "Stop posting until you watch this",
    duration_seconds: 43,
    viral_score: 79,
    caption_style: "Cinema",
    is_exported: true,
    thumbnail_color: "#CCFF00",
    transcript_preview: "The biggest mistake creators make in 2026? Treating short-form like shrunken long-form.",
    source_video: "deep-dive-creator-econ.mp4",
    platforms: ["Reels", "TikTok", "Shorts"],
    performance: { views: 178000, likes: 9800, shares: 1340, comments: 410, ctr: 7.1 },
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

export const DEMO_RECENT_UPLOADS = [
  {
    id: "upl-1",
    filename: "founders-lab-ep142.mp4",
    source_label: "Podcast · Episode 142",
    duration_minutes: 74,
    size_mb: 412,
    clips_generated: 8,
    status: "ready",
    processed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "upl-2",
    filename: "riya-stream-mar-08.mov",
    source_label: "Twitch VOD · 8 Mar",
    duration_minutes: 218,
    size_mb: 1840,
    clips_generated: 14,
    status: "ready",
    processed_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    id: "upl-3",
    filename: "youtube-creator-econ.mp4",
    source_label: "YouTube · Deep dive",
    duration_minutes: 42,
    size_mb: 256,
    clips_generated: 6,
    status: "processing",
    progress: 64,
    processed_at: null,
  },
  {
    id: "upl-4",
    filename: "marcus-keynote-disrupt.mp4",
    source_label: "Conference · Disrupt 2026",
    duration_minutes: 31,
    size_mb: 198,
    clips_generated: 5,
    status: "ready",
    processed_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
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

export function formatViews(n) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function formatRelative(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
