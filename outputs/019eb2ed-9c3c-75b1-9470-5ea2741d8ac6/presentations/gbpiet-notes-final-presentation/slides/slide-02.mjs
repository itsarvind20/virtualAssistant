import { C, bg, title, footer, node, line } from "./_common.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "problem", "Academic content exists, but it is scattered across temporary channels.");
  const pains = [
    ["Messaging groups", "Notes and PYQs get buried in long chat histories.", 92, 220, C.coral],
    ["Personal drives", "Useful files depend on individual links and access.", 92, 360, C.amber],
    ["Repeated doubts", "Good answers disappear because chats are not searchable.", 486, 220, C.teal],
    ["No recognition", "Helpful contributors are hard to identify or follow.", 486, 360, C.ink],
  ];
  for (const [label, note, left, top, accent] of pains) node(slide, ctx, { label, note, left, top, width: 300, height: 104, accent });
  line(slide, ctx, 390, 272, 86); line(slide, ctx, 390, 412, 86); line(slide, ctx, 786, 272, 95); line(slide, ctx, 786, 412, 95);
  const center = ctx.addShape(slide, { left: 900, top: 264, width: 254, height: 176, fill: C.ink, line: ctx.line(C.ink, 0) });
  center.borderRadius = 10;
  ctx.addText(slide, { text: "Student friction", left: 930, top: 300, width: 194, height: 30, fontSize: 24, bold: true, color: C.white, align: "center" });
  ctx.addText(slide, { text: "More time searching,\nless time learning.", left: 938, top: 350, width: 178, height: 56, fontSize: 18, color: "#BFD7D4", align: "center" });
  footer(slide, ctx, 2);
  return slide;
}
