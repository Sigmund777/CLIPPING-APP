import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  loadSettings, saveSettings, PLATFORM_OPTIONS, CAPTION_STYLE_OPTIONS,
  CLIP_LENGTH_OPTIONS, BRAND_TONE_OPTIONS, DEFAULT_SETTINGS,
} from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { Settings as SettingsIcon, Save, Check, User, Smartphone, Type, Clock, Speaker, RotateCcw } from "lucide-react";
import { toast } from "sonner";

function Field({ label, icon: Icon, children, hint }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-volt" /> {label}
      </label>
      {children}
      {hint && <div className="text-[11px] text-zinc-600 mt-1.5">{hint}</div>}
    </div>
  );
}

function ChipGroup({ value, options, onChange, testid }) {
  return (
    <div className="flex flex-wrap gap-2" data-testid={testid}>
      {options.map((opt) => {
        const active = String(value) === String(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`text-xs px-3 py-2 rounded-md border transition-colors ${active ? "border-volt/50 bg-volt/10 text-volt" : "border-white/10 text-zinc-300 hover:text-white hover:border-white/20"}`}
            data-testid={`${testid}-${String(opt).toLowerCase().replace(/\s/g, '-')}`}
          >
            {active && <Check className="inline w-3 h-3 mr-1" />}
            {opt}{typeof opt === "number" ? "s" : ""}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(loadSettings());
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    // Prefill creator name from auth user on first visit
    setSettings((prev) => {
      if (!prev.creator_name && user?.name) return { ...prev, creator_name: user.name };
      return prev;
    });
  }, [user?.name]);

  const update = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = (e) => {
    e?.preventDefault?.();
    const ok = saveSettings(settings);
    if (ok) {
      setSaved(true);
      setDirty(false);
      toast.success("Settings saved", { description: "Your preferences will be applied to your next clip." });
      setTimeout(() => setSaved(false), 2400);
    } else {
      toast.error("Could not save settings");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Reset all settings to default?")) return;
    const next = { ...DEFAULT_SETTINGS, creator_name: user?.name || "" };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setDirty(false);
    toast.success("Settings reset to default");
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <DashboardLayout>
      <div className="px-6 lg:px-10 py-10 max-w-3xl mx-auto" data-testid="settings-page">
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 border border-volt/30 bg-volt/5 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse-glow" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-volt">Early access beta</span>
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-zinc-500" /> Settings
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
            These preferences shape the clip ideas Hookify suggests. Saved locally in your browser — no account changes yet.
          </p>
        </header>

        <form onSubmit={handleSave} className="bg-ink-900 border border-white/5 rounded-lg p-6 sm:p-8 space-y-7" data-testid="settings-form">

          <Field label="Creator name" icon={User} hint="Shown on your shareable clip pages once real exports go live.">
            <input
              type="text"
              value={settings.creator_name}
              onChange={(e) => update({ creator_name: e.target.value })}
              placeholder="e.g. Maya Reyes"
              className="w-full bg-ink-950 border border-white/10 rounded-md px-3 py-2.5 text-sm focus:border-volt focus:outline-none transition-colors"
              data-testid="setting-creator-name"
            />
          </Field>

          <Field label="Preferred platform" icon={Smartphone} hint="We bias hook + caption suggestions toward this platform's algorithm.">
            <ChipGroup
              value={settings.preferred_platform}
              options={PLATFORM_OPTIONS}
              onChange={(v) => update({ preferred_platform: v })}
              testid="setting-platform"
            />
          </Field>

          <Field label="Caption style" icon={Type} hint="Drives caption formatting on every generated idea.">
            <ChipGroup
              value={settings.caption_style}
              options={CAPTION_STYLE_OPTIONS}
              onChange={(v) => update({ caption_style: v })}
              testid="setting-caption"
            />
          </Field>

          <Field label="Default clip length" icon={Clock} hint="Suggestions will target this length (±10 seconds).">
            <ChipGroup
              value={settings.default_clip_length}
              options={CLIP_LENGTH_OPTIONS}
              onChange={(v) => update({ default_clip_length: v })}
              testid="setting-length"
            />
          </Field>

          <Field label="Brand tone" icon={Speaker} hint="Steers the voice of every suggested hook and title.">
            <ChipGroup
              value={settings.brand_tone}
              options={BRAND_TONE_OPTIONS}
              onChange={(v) => update({ brand_tone: v })}
              testid="setting-tone"
            />
          </Field>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="text-[11px] text-zinc-500">
              {saved ? <span className="text-volt inline-flex items-center gap-1.5"><Check className="w-3 h-3" /> Saved to this browser</span>
                     : dirty ? "Unsaved changes" : "All up to date"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 px-4 py-2.5 rounded-md text-sm transition-colors"
                data-testid="settings-reset"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-volt text-black font-medium px-5 py-2.5 rounded-md hover:bg-volt-300 transition-colors text-sm disabled:opacity-60"
                data-testid="settings-save"
              >
                <Save className="w-4 h-4" /> Save settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
