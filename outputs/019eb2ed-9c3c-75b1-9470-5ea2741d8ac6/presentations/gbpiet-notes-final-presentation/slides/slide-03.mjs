import { C, bg, title, footer, card, line } from "./_common.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "objectives", "The project objective is a complete academic collaboration ecosystem.");
  const items = [
    ["1", "Structured repository", "Upload, organize, search, preview, download, and manage notes, assignments, tutorials, and PYQs.", C.teal],
    ["2", "Interactive Q&A", "Students can post doubts, add tags/images, answer questions, and preserve solutions.", C.amber],
    ["3", "Community engagement", "Profiles, follows, likes, comments, credits, leaderboards, and activity tracking motivate participation.", C.coral],
    ["4", "AI study support", "Gemini-powered assistant handles text, PDFs, handwritten notes, images, and academic queries.", C.ink],
    ["5", "Scalable foundation", "Architecture leaves room for notifications, recommendations, dashboards, and advanced AI retrieval.", C.teal],
  ];
  let top = 190;
  for (const [num, label, body, accent] of items) {
    ctx.addShape(slide, { left: 90, top: top + 8, width: 42, height: 42, fill: accent, line: ctx.line(accent, 0) }).borderRadius = 21;
    ctx.addText(slide, { text: num, left: 90, top: top + 16, width: 42, height: 24, fontSize: 18, bold: true, color: C.white, align: "center" });
    card(slide, ctx, { title: label, body, left: 154, top, width: 930, height: 64, fill: C.white, accent });
    top += 82;
  }
  line(slide, ctx, 111, 244, 2, 330, "#C9D3D8");
  footer(slide, ctx, 3);
  return slide;
}
