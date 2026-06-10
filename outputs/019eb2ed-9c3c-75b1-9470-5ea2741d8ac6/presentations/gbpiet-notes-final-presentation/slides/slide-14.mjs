import { C, bg, footer, pill } from "./_common.mjs";

export async function slide14(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.ink);
  ctx.addText(slide, { text: "Conclusion", left: 72, top: 70, width: 360, height: 52, fontSize: 42, bold: true, color: C.white, typeface: ctx.fonts.title });
  ctx.addText(slide, { text: "GBPIET Notes demonstrates how a full-stack web application can solve a real campus problem by combining structured resource sharing, peer collaboration, contribution recognition, AI assistance, and safety controls.", left: 74, top: 164, width: 850, height: 132, fontSize: 27, color: C.paper });
  const takeaways = [
    "Centralized academic resources",
    "Searchable Q&A knowledge retention",
    "Community profiles and leaderboards",
    "Secure MERN-style architecture",
    "AI-enabled study support",
  ];
  takeaways.forEach((t, i) => pill(slide, ctx, t, 78 + (i % 2) * 390, 360 + Math.floor(i / 2) * 58, i === 4 ? 330 : 340, i % 2 ? "#F59E0B" : "#0F766E", i % 2 ? C.ink : C.white));
  const box = ctx.addShape(slide, { left: 910, top: 86, width: 250, height: 470, fill: "#F8F3EA", line: ctx.line("#F8F3EA", 0) });
  box.borderRadius = 12;
  ctx.addText(slide, { text: "Viva-ready summary", left: 936, top: 126, width: 200, height: 30, fontSize: 20, bold: true, color: C.ink, align: "center" });
  ctx.addText(slide, { text: "Problem\nScattered resources\n\nSolution\nIntegrated academic platform\n\nTechnology\nReact + Express + MongoDB + Supabase + Gemini\n\nValidation\nMajor modules passed functional checks", left: 942, top: 190, width: 190, height: 280, fontSize: 15, color: C.slate, align: "center" });
  ctx.addText(slide, { text: "Thank You", left: 70, top: 610, width: 400, height: 48, fontSize: 34, bold: true, color: C.white });
  footer(slide, ctx, 14, true);
  return slide;
}
