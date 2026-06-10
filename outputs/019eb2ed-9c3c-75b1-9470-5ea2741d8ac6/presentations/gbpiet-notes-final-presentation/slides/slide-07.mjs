import { C, bg, title, footer, node, line } from "./_common.mjs";

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "data model", "The data model connects users to resources, discussions, activity, and moderation.");
  node(slide, ctx, { label: "User", note: "role, branch, year, profile, skills, links", left: 520, top: 190, width: 230, accent: C.ink });
  const entities = [
    ["Note", "metadata + Supabase file URL", 152, 294, C.teal],
    ["Question", "title, tags, optional images", 390, 398, C.amber],
    ["Answer", "responses, images, likes", 650, 398, C.coral],
    ["Post", "community text/images/comments", 888, 294, C.teal],
    ["Follow", "academic network graph", 276, 188, C.coral],
    ["Report", "moderation signal", 794, 188, C.amber],
  ];
  for (const [label, note, left, top, accent] of entities) node(slide, ctx, { label, note, left, top, width: 210, height: 86, accent });
  line(slide, ctx, 382, 230, 138); line(slide, ctx, 750, 230, 44); line(slide, ctx, 362, 338, 158); line(slide, ctx, 750, 338, 138);
  line(slide, ctx, 498, 438, 54); line(slide, ctx, 750, 438, 54);
  ctx.addText(slide, { text: "MongoDB stores structured records; Supabase stores uploaded binaries; URLs connect the two.", left: 244, top: 595, width: 790, height: 38, fontSize: 20, bold: true, color: C.ink, align: "center" });
  footer(slide, ctx, 7);
  return slide;
}
