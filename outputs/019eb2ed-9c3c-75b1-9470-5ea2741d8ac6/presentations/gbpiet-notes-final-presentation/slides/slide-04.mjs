import { C, bg, title, footer, sectionLabel, line } from "./_common.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "users", "Role-aware journeys make the same platform useful for different college users.");
  const lanes = [
    ["Students", "Browse notes\nAsk doubts\nFollow contributors\nUse AI assistant", C.teal],
    ["Faculty", "Share resources\nAnswer queries\nGuide discussions\nReview content quality", C.amber],
    ["Administrators", "Monitor reports\nModerate users\nTrack activity\nPrepare analytics", C.coral],
  ];
  let x = 94;
  for (const [role, steps, accent] of lanes) {
    sectionLabel(slide, ctx, role, x, 190, accent);
    const box = ctx.addShape(slide, { left: x, top: 230, width: 330, height: 330, fill: C.white, line: ctx.line("#D9E1E5", 1) });
    box.borderRadius = 8;
    const arr = steps.split("\n");
    arr.forEach((step, i) => {
      const y = 264 + i * 68;
      ctx.addShape(slide, { left: x + 30, top: y, width: 22, height: 22, fill: accent, line: ctx.line(accent, 0) }).borderRadius = 11;
      ctx.addText(slide, { text: step, left: x + 70, top: y - 2, width: 220, height: 28, fontSize: 18, bold: i === 0, color: C.ink });
      if (i < arr.length - 1) line(slide, ctx, x + 40, y + 27, 2, 34, "#CAD5DA");
    });
    x += 380;
  }
  footer(slide, ctx, 4);
  return slide;
}
