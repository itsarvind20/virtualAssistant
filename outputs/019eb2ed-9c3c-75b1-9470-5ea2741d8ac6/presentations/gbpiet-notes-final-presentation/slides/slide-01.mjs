import { C, bg, footer, pill } from "./_common.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx, C.ink);
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill: C.ink, line: ctx.line(C.ink, 0) });
  ctx.addShape(slide, { left: 752, top: 0, width: 528, height: 720, fill: "#0F766E", line: ctx.line("#0F766E", 0) });
  ctx.addShape(slide, { left: 808, top: 92, width: 340, height: 340, fill: "#F8F3EA22", line: ctx.line("#F8F3EA66", 2) }).borderRadius = 18;
  ctx.addText(slide, { text: "Platform map", left: 842, top: 124, width: 260, height: 26, fontSize: 19, bold: true, color: C.white, align: "center" });
  const mapItems = [
    ["Resources", "notes, PYQs, assignments"],
    ["Community", "Q&A, posts, follows"],
    ["Recognition", "credits, activity, leaderboard"],
    ["Assistance", "Gemini-powered study chat"],
  ];
  mapItems.forEach((item, i) => {
    const top = 176 + i * 54;
    ctx.addShape(slide, { left: 848, top, width: 248, height: 40, fill: "#F8F3EA", line: ctx.line("#F8F3EA", 0) }).borderRadius = 8;
    ctx.addText(slide, { text: item[0], left: 864, top: top + 8, width: 100, height: 20, fontSize: 14, bold: true, color: C.ink });
    ctx.addText(slide, { text: item[1], left: 970, top: top + 9, width: 108, height: 18, fontSize: 11, color: C.slate });
  });
  ctx.addText(slide, { text: "GBPIET Notes", left: 64, top: 116, width: 660, height: 76, fontSize: 58, bold: true, color: C.white, typeface: ctx.fonts.title });
  ctx.addText(slide, { text: "College Community Web Application", left: 68, top: 198, width: 600, height: 42, fontSize: 26, color: "#BFD7D4" });
  ctx.addText(slide, { text: "A centralized academic platform for notes, Q&A, community interaction, contribution tracking, AI study support, and moderation.", left: 68, top: 292, width: 595, height: 110, fontSize: 23, color: "#F8F3EA" });
  pill(slide, ctx, "React", 70, 455, 96, "#F59E0B", C.ink);
  pill(slide, ctx, "Node.js", 178, 455, 110, "#E7EEF0", C.ink);
  pill(slide, ctx, "MongoDB", 300, 455, 126, "#E7EEF0", C.ink);
  pill(slide, ctx, "Gemini API", 438, 455, 142, "#E76F51", C.white);
  ctx.addText(slide, { text: "Presented by\nSaket Singh | Vaibhav Rawat | Yash Bhatt | Akshay Tomar", left: 820, top: 476, width: 340, height: 86, fontSize: 18, color: C.white, bold: true });
  ctx.addText(slide, { text: "Guide: Dr. Papendra Kumar\nDepartment of Computer Science & Engineering\nG.B. Pant Institute of Engineering and Technology", left: 820, top: 585, width: 360, height: 76, fontSize: 14, color: "#E7EEF0" });
  footer(slide, ctx, 1, true);
  return slide;
}
