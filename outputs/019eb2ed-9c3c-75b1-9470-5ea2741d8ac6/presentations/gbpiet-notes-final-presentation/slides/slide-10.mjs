import { C, bg, title, footer, node, line, sectionLabel } from "./_common.mjs";

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "AI + safety", "AI assistance and moderation make the platform more useful and accountable.");
  sectionLabel(slide, ctx, "AI chatbot processing", 98, 190, C.teal);
  const ai = [
    ["User prompt", "text + optional files", 92, 238],
    ["Backend context", "history + retrieved project content", 338, 238],
    ["Gemini API", "response generation", 584, 238],
    ["Streaming UI", "chunks saved in local history", 830, 238],
  ];
  ai.forEach(([l, n, x]) => node(slide, ctx, { label: l, note: n, left: x, top: 238, width: 204, height: 96, accent: C.teal }));
  line(slide, ctx, 296, 286, 42); line(slide, ctx, 542, 286, 42); line(slide, ctx, 788, 286, 42);
  sectionLabel(slide, ctx, "Report moderation flow", 98, 405, C.coral);
  const mod = [
    ["Report user", "create report if none exists", 92, 452],
    ["Undo report", "delete report on toggle", 338, 452],
    ["Recalculate", "update report count", 584, 452],
    ["Moderate", "ban state follows report data", 830, 452],
  ];
  mod.forEach(([l, n, x]) => node(slide, ctx, { label: l, note: n, left: x, top: 452, width: 204, height: 96, accent: C.coral }));
  line(slide, ctx, 296, 500, 42); line(slide, ctx, 542, 500, 42); line(slide, ctx, 788, 500, 42);
  footer(slide, ctx, 10);
  return slide;
}
