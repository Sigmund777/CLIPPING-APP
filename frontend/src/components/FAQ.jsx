import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const FAQS = [
  { q: "How long does it take Hookify to process a 1-hour podcast?", a: "Most 60-minute uploads finish in 3–5 minutes on the Creator plan. Studio plan users get a priority queue that typically returns clips in under 90 seconds." },
  { q: "Will my brand kit (fonts, colours, logo) survive the export?", a: "Yes. Save up to 3 brand presets on Creator and unlimited on Studio. Captions, lower-thirds and logo bugs are applied frame-accurately." },
  { q: "Do I own the clips Hookify generates?", a: "100%. You retain full commercial rights to every clip, transcript and asset. We never train models on your private uploads." },
  { q: "What if the AI picks the wrong moment?", a: "You can re-roll any suggestion, adjust start/end frames by 1/30s, regenerate captions and try a different hook in two clicks." },
  { q: "Can I cancel anytime?", a: "Yes. Plans are month-to-month. We'll keep your clips, brand kits and history available for 90 days after cancellation." },
  { q: "Do you support YouTube URLs and live streams?", a: "Drop a YouTube, Twitch VOD, Vimeo or Dropbox link and we'll ingest directly. Native upload supports MP4, MOV, MKV up to 8 hours." },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-28" data-testid="section-faq">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <div className="text-center mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-volt mb-4">FAQ</div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight">Questions we get every week.</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-white/5 rounded-lg bg-ink-900 px-6 data-[state=open]:border-volt/30" data-testid={`faq-${i}`}>
              <AccordionTrigger className="text-left font-heading font-medium text-base hover:no-underline py-5">{f.q}</AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-sm leading-relaxed pb-5">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
