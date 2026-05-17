// Mock demo data used as graceful fallback when backend / network fails.
// Keeps the app fully demonstrable in offline / preview-only modes.
// IMPORTANT: This is beta-mode sample data. No real performance, views, or revenue claims.

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@hookify.ai",
  name: "Maya Reyes",
  role: "user",
  plan: "beta",
  avatar: null,
};

// Saved clips used as fallback for the editor. No performance / views claims.
export const DEMO_CLIPS = [
  {
    id: "demo-clip-1",
    user_id: "demo-user",
    title: "The 3 hooks that broke a million views",
    duration_seconds: 38,
    caption_style: "Bold",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "What if I told you that the single biggest mistake creators make...",
    source_video: "founders-lab-ep142.mp4",
    created_at: new Date(Date.now() - 0 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-2",
    user_id: "demo-user",
    title: "Three viral patterns creators sleep on",
    duration_seconds: 42,
    caption_style: "Educational",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "If your hook doesn't slap, your video is dead on arrival.",
    source_video: "founders-lab-ep142.mp4",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "demo-clip-3",
    user_id: "demo-user",
    title: "Never start your Reel with a static shot",
    duration_seconds: 34,
    caption_style: "Clean",
    is_exported: false,
    thumbnail_color: "#CCFF00",
    transcript_preview: "Pattern two: use motion in the first frame, never a static shot.",
    source_video: "riya-stream-mar-08.mov",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Recent uploaded source videos — appear in dashboard "Recent projects" section.
export const DEMO_RECENT_UPLOADS = [
  {
    id: "upl-1",
    filename: "founders-lab-ep142.mp4",
    source_label: "Podcast · Episode 142",
    duration_minutes: 74,
    size_mb: 412,
    clips_suggested: 8,
    status: "ready",
    processed_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: "upl-2",
    filename: "riya-stream-mar-08.mov",
    source_label: "Twitch VOD · 8 Mar",
    duration_minutes: 218,
    size_mb: 1840,
    clips_suggested: 14,
    status: "ready",
    processed_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
  {
    id: "upl-3",
    filename: "youtube-creator-econ.mp4",
    source_label: "YouTube · Deep dive",
    duration_minutes: 42,
    size_mb: 256,
    clips_suggested: 0,
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
    clips_suggested: 5,
    status: "ready",
    processed_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
  },
];

// Transcript shown in the clip editor (demo).
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

// AI-style suggestions surfaced after upload analysis. EXACTLY 3 entries.
// Honest framing — each item is a *suggestion*, not a performance number.
export const DEMO_GENERATED_CLIPS = [
  {
    id: "gen-1",
    start_seconds: 142,
    end_seconds: 188,
    duration_seconds: 46,
    title: "The 3-second hook rule nobody is teaching",
    hook: "If your first frame is static, you've already lost the algorithm.",
    transcript_preview: "Algorithms reward emotional density in the first three seconds. If your hook doesn't slap, your video is dead on arrival.",
    platform: "TikTok",
    caption_style: "Bold",
    caption_text: "ALGORITHMS reward density.\nIf your hook doesn't SLAP\n→ you're dead on arrival.",
    reason: "Pattern-interrupt opener · educational angle · works on all three platforms",
  },
  {
    id: "gen-2",
    start_seconds: 514,
    end_seconds: 562,
    duration_seconds: 48,
    title: "Why your podcast clips aren't going viral (yet)",
    hook: "Spoiler: it's not the audio. It's the first 1.5 seconds.",
    transcript_preview: "Most creators chop highlights at the wrong beat. The viral cut starts on the inhale, not the punchline.",
    platform: "YouTube Shorts",
    caption_style: "Educational",
    caption_text: "Most creators cut\non the punchline.\n\nThe viral cut starts\non the inhale.",
    reason: "Curiosity gap · contrarian framing · save-worthy tactical advice",
  },
  {
    id: "gen-3",
    start_seconds: 938,
    end_seconds: 992,
    duration_seconds: 54,
    title: "Three editing patterns worth stealing",
    hook: "Pattern one alone could change how you post forever.",
    transcript_preview: "Pattern one: contradiction. Pattern two: motion in the first frame. Pattern three: question loop close.",
    platform: "Instagram Reels",
    caption_style: "Clean",
    caption_text: "1. Contradiction\n2. Motion-first frame\n3. Question loop close",
    reason: "Clear value list · numbered structure · loop-friendly close",
  },
];

// Short-form content templates surfaced on the Templates page.
export const DEMO_TEMPLATES = [
  {
    id: "tpl-gaming",
    name: "Gaming clutch moment",
    description: "Highlight a clutch play, callout, or POV reaction with high-energy pacing.",
    accent: "Gaming",
    hook_style: "Open on the exact frame before the clutch. No intro, no setup.",
    caption_style: "Bold",
    pacing: "Cuts every 1.2s · zoom punches on impact · slow-mo on the kill cam",
    title_examples: [
      "This 1v4 shouldn't have been possible",
      "Watch his crosshair at 0:03 — chef's kiss",
      "How I cooked Diamond lobby with one util",
    ],
  },
  {
    id: "tpl-podcast",
    name: "Podcast highlight",
    description: "Lift a single contrarian or insightful moment from a longer conversation.",
    accent: "Podcast",
    hook_style: "Lead with the spiciest 6-word claim from the guest.",
    caption_style: "Educational",
    pacing: "Static frame · word-by-word captions · zoom in on key phrases",
    title_examples: [
      '"You should never hire a junior editor"',
      "The one founder mistake that kills 90% of startups",
      "Why he stopped reading books in 2024",
    ],
  },
  {
    id: "tpl-reaction",
    name: "Funny streamer reaction",
    description: "Capture a genuine streamer reaction with meme-style captioning.",
    accent: "Reaction",
    hook_style: "Cold open the reaction itself — no context for 2 seconds.",
    caption_style: "Meme",
    pacing: "Fast cuts · zoom on facial reactions · sound effects on punchline",
    title_examples: [
      "His face when chat caught him slipping",
      "POV: you read your own donation out loud",
      "Streamer realises he's been muted for 20 minutes",
    ],
  },
  {
    id: "tpl-educational",
    name: "Educational tip",
    description: "Teach one tactical takeaway in under 60 seconds with clear structure.",
    accent: "Educational",
    hook_style: "Pose the problem in 4 words, then promise the fix.",
    caption_style: "Clean",
    pacing: "Slower cuts · whiteboard or B-roll inserts · numbered steps on screen",
    title_examples: [
      "The 3-second hook rule",
      "Stop writing your CTAs at the end",
      "Why your first frame matters more than your edit",
    ],
  },
  {
    id: "tpl-storytime",
    name: "Storytime clip",
    description: "Pull a personal-story beat that earns shares and saves.",
    accent: "Storytime",
    hook_style: "Drop the listener mid-conflict, withhold the ending.",
    caption_style: "Clean",
    pacing: "Steady frame · captions follow speech rhythm · pause for emphasis",
    title_examples: [
      "I got fired the day I funded my own company",
      "She didn't know the mic was still on",
      "We almost lost the deal over a typo",
    ],
  },
  {
    id: "tpl-hottake",
    name: "Hot take / opinion clip",
    description: "Surface a sharp, debate-starting opinion that drives comments.",
    accent: "Hot take",
    hook_style: "Open with a flat, unhedged claim. No softening.",
    caption_style: "Bold",
    pacing: "Tight 0.8s cuts · pulse zoom on the claim · cut-to-black close",
    title_examples: [
      "Most creator advice is recycled garbage",
      "Stop posting daily. It's making you worse.",
      "The 'algorithm' isn't real. Your hook is bad.",
    ],
  },
];

// Defaults for the Settings page.
export const DEFAULT_SETTINGS = {
  creator_name: "",
  preferred_platform: "TikTok",
  caption_style: "Bold",
  default_clip_length: 30,
  brand_tone: "Energetic",
};

export const PLATFORM_OPTIONS = ["TikTok", "YouTube Shorts", "Instagram Reels"];
export const CAPTION_STYLE_OPTIONS = ["Clean", "Bold", "Meme", "Educational"];
export const CLIP_LENGTH_OPTIONS = [15, 30, 45, 60];
export const BRAND_TONE_OPTIONS = ["Funny", "Serious", "Energetic", "Professional"];

// Helpers
export function getDemoClipById(id) {
  return DEMO_CLIPS.find((c) => c.id === id) || DEMO_CLIPS[0];
}

export function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

// Suggestions object returned by mocked /ai/suggestions endpoint (used by editor).
export const DEMO_SUGGESTIONS = {
  clips: DEMO_GENERATED_CLIPS,
  viral_titles: DEMO_GENERATED_CLIPS.map((c) => c.title).concat([
    "Stop posting until you watch this",
    "Streamers, you're leaving views on the table",
    "POV: you finally cracked the algorithm",
  ]),
};

// Settings localStorage helpers
const SETTINGS_KEY = "hookify_settings";
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}
export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return true; } catch (_) { return false; }
}

// Active clip context — used to pass a selected AI clip suggestion into the editor.
const ACTIVE_CLIP_KEY = "hookify_active_clip";
export function setActiveClip(payload) {
  try { localStorage.setItem(ACTIVE_CLIP_KEY, JSON.stringify(payload)); } catch (_) {}
}
export function getActiveClip() {
  try {
    const raw = localStorage.getItem(ACTIVE_CLIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function clearActiveClip() {
  try { localStorage.removeItem(ACTIVE_CLIP_KEY); } catch (_) {}
}

// Templates localStorage helper — used by Upload flow to read the "active" template.
const ACTIVE_TEMPLATE_KEY = "hookify_active_template";
export function setActiveTemplate(tpl) {
  try { localStorage.setItem(ACTIVE_TEMPLATE_KEY, JSON.stringify(tpl)); } catch (_) {}
}
export function getActiveTemplate() {
  try {
    const raw = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
export function clearActiveTemplate() {
  try { localStorage.removeItem(ACTIVE_TEMPLATE_KEY); } catch (_) {}
}
