import { C, bg, title, footer, node, line, pill } from "./_common.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "architecture", "The system uses a clean client-server architecture with separate data, storage, and AI services.");
  const y = 262;
  node(slide, ctx, { label: "Frontend", note: "React, Vite, Tailwind, Router, Axios", left: 70, top: y, width: 190, accent: C.teal });
  node(slide, ctx, { label: "API Layer", note: "Express routes, controllers, middleware", left: 330, top: y, width: 190, accent: C.amber });
  node(slide, ctx, { label: "MongoDB", note: "Users, notes metadata, Q&A, posts, reports", left: 590, top: y, width: 190, accent: C.coral });
  node(slide, ctx, { label: "Supabase", note: "PDFs, images, uploaded academic files", left: 850, top: y, width: 190, accent: C.teal });
  node(slide, ctx, { label: "Gemini API", note: "Study assistant responses and file analysis", left: 590, top: 432, width: 190, accent: C.ink });
  line(slide, ctx, 260, y + 46, 70); line(slide, ctx, 520, y + 46, 70); line(slide, ctx, 780, y + 46, 70);
  line(slide, ctx, 685, 354, 2, 78); line(slide, ctx, 780, 477, 70);
  pill(slide, ctx, "HTTP-only cookies + JWT sessions", 164, 558, 292, C.ink, C.white);
  pill(slide, ctx, "Google OAuth profile completion", 468, 558, 292, C.mist, C.ink);
  pill(slide, ctx, "REST-style route groups", 772, 558, 232, C.mist, C.ink);
  footer(slide, ctx, 6);
  return slide;
}
