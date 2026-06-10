import { C, bg, title, footer } from "./_common.mjs";

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "implementation", "Each module is independently implemented but shares authentication, API, and storage services.");
  const headers = ["Module", "Implemented capabilities", "Key backend/frontend concerns"];
  const rows = [
    ["Authentication", "Email login, Google OAuth, profile completion, session restore", "bcrypt, JWT cookies, current-user endpoint"],
    ["Notes", "Upload, list, detail, preview, open, download, like, comments", "multipart upload, Supabase storage, metadata"],
    ["Q&A", "Questions, tags, images, answers, likes, liked-user modal", "route groups, answer controller, image arrays"],
    ["Community", "Posts, multiple images, carousel, comments, edit/delete", "reusable UI patterns and ownership checks"],
    ["Profiles", "Avatar, cover, tabs, links, follow, report", "cleanup during account deletion"],
    ["AI Chatbot", "Streaming response, files, local history", "Gemini API + lightweight retrieval"],
  ];
  const x = [70, 276, 668];
  const w = [180, 360, 430];
  headers.forEach((h, i) => {
    ctx.addText(slide, { text: h, left: x[i], top: 180, width: w[i], height: 28, fontSize: 13, bold: true, color: C.teal });
  });
  rows.forEach((r, ri) => {
    const top = 222 + ri * 62;
    ctx.addShape(slide, { left: 58, top: top - 8, width: 1100, height: 52, fill: ri % 2 ? "#FFFFFF" : "#EEF4F3", line: ctx.line("#D8E1E4", 1) }).borderRadius = 4;
    r.forEach((cell, ci) => ctx.addText(slide, { text: cell, left: x[ci], top: top + 4, width: w[ci], height: 26, fontSize: ci === 0 ? 13 : 11.5, bold: ci === 0, color: ci === 0 ? C.ink : C.slate }));
  });
  footer(slide, ctx, 8);
  return slide;
}
