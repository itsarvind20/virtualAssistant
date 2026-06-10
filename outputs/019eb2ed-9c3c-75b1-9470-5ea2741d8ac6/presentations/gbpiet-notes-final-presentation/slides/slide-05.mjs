import { C, bg, title, footer, card } from "./_common.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "solution", "GBPIET Notes combines repository, discussion, social learning, and AI support.");
  const hub = ctx.addShape(slide, { left: 500, top: 278, width: 280, height: 130, fill: C.ink, line: ctx.line(C.ink, 0) });
  hub.borderRadius = 12;
  ctx.addText(slide, { text: "GBPIET\nNotes", left: 536, top: 302, width: 210, height: 78, fontSize: 34, bold: true, color: C.white, align: "center" });
  const cards = [
    ["Notes Repository", "Upload, browse, preview, download, like, and comment on academic resources.", 86, 190, C.teal],
    ["Q&A Community", "Tagged doubts, answers, images, upvotes, and searchable knowledge retention.", 86, 430, C.amber],
    ["Profiles & Follows", "Academic identity, public contributions, skills, links, and follow networks.", 820, 190, C.coral],
    ["AI Assistant", "Gemini-powered explanations with file and image support.", 820, 430, C.ink],
    ["Leaderboards", "Contribution analytics and recognition for active users.", 390, 500, C.teal],
    ["Moderation", "Report/undo-report workflow keeps the platform accountable.", 390, 142, C.coral],
  ];
  for (const [t, body, left, top, accent] of cards) card(slide, ctx, { title: t, body, left, top, width: 318, height: 112, accent });
  footer(slide, ctx, 5);
  return slide;
}
