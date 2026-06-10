import { C, bg, title, footer, card, line } from "./_common.mjs";

export async function slide13(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "outcomes", "The delivered system is a working foundation with clear future extension paths.");
  card(slide, ctx, { title: "Major outcomes", body: "Central resource repository, Q&A knowledge base, community feed, contribution analytics, secure authentication, file storage, AI assistant, and moderation workflow.", left: 80, top: 210, width: 390, height: 180, accent: C.teal });
  card(slide, ctx, { title: "Current limitations", body: "Focused on GBPIET use case, depends on external cloud/API services, and starts with lightweight AI retrieval rather than a full vector database.", left: 80, top: 424, width: 390, height: 150, accent: C.coral });
  const roadmap = [
    ["Notifications", "real-time academic updates"],
    ["Recommendations", "personalized notes and questions"],
    ["Admin dashboard", "moderation and analytics control"],
    ["Advanced AI retrieval", "better context-aware answers"],
  ];
  ctx.addText(slide, { text: "Future scope", left: 570, top: 210, width: 270, height: 34, fontSize: 24, bold: true, color: C.ink });
  roadmap.forEach((r, i) => {
    const x = 570 + i * 145;
    ctx.addShape(slide, { left: x, top: 300, width: 92, height: 92, fill: i % 2 ? C.amber : C.teal, line: ctx.line(i % 2 ? C.amber : C.teal, 0) }).borderRadius = 46;
    ctx.addText(slide, { text: String(i + 1), left: x, top: 328, width: 92, height: 34, fontSize: 28, bold: true, color: C.white, align: "center" });
    ctx.addText(slide, { text: r[0], left: x - 12, top: 420, width: 116, height: 26, fontSize: 15, bold: true, color: C.ink, align: "center" });
    ctx.addText(slide, { text: r[1], left: x - 18, top: 454, width: 128, height: 44, fontSize: 11.5, color: C.slate, align: "center" });
    if (i < roadmap.length - 1) line(slide, ctx, x + 94, 344, 50, 2, "#B7C4CA");
  });
  footer(slide, ctx, 13);
  return slide;
}
