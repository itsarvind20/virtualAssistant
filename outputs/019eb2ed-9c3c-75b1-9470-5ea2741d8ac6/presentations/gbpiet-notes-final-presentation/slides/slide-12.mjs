import { C, bg, title, footer } from "./_common.mjs";

export async function slide12(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "testing", "Module-wise testing showed the final system works across features and devices.");
  const rows = [
    ["Authentication", "Login, signup, Google auth, profile completion, logout", "Passed"],
    ["Notes", "Upload, list, preview, detail, open, download, like, comments", "Passed"],
    ["Q&A", "Ask question, tags, images, answers, likes, liked users", "Passed"],
    ["Community", "Post text/images, carousel, comments, edit, delete, likes", "Passed"],
    ["Profile & Settings", "Avatar, cover, stats, tabs, links, password, delete account", "Passed"],
    ["AI + Moderation", "Streaming, file upload, history, report toggle, count update", "Passed"],
    ["Responsive UI", "Mobile, tablet, laptop, and desktop layout checks", "Passed"],
  ];
  ctx.addShape(slide, { left: 82, top: 184, width: 1080, height: 42, fill: C.ink, line: ctx.line(C.ink, 0) }).borderRadius = 5;
  ctx.addText(slide, { text: "Module", left: 110, top: 195, width: 220, height: 18, fontSize: 12.5, bold: true, color: C.white });
  ctx.addText(slide, { text: "Validation focus", left: 348, top: 195, width: 560, height: 18, fontSize: 12.5, bold: true, color: C.white });
  ctx.addText(slide, { text: "Result", left: 1010, top: 195, width: 90, height: 18, fontSize: 12.5, bold: true, color: C.white, align: "center" });
  rows.forEach((r, i) => {
    const top = 236 + i * 54;
    ctx.addShape(slide, { left: 82, top, width: 1080, height: 44, fill: i % 2 ? C.white : "#EEF4F3", line: ctx.line("#D8E1E4", 1) });
    ctx.addText(slide, { text: r[0], left: 110, top: top + 12, width: 220, height: 18, fontSize: 13, bold: true, color: C.ink });
    ctx.addText(slide, { text: r[1], left: 348, top: top + 12, width: 560, height: 18, fontSize: 12, color: C.slate });
    ctx.addText(slide, { text: r[2], left: 1000, top: top + 12, width: 100, height: 18, fontSize: 12.5, bold: true, color: C.teal, align: "center" });
  });
  footer(slide, ctx, 12);
  return slide;
}
