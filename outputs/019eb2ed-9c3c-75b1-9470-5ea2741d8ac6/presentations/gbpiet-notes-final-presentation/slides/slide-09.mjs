import { C, bg, title, footer, card, line } from "./_common.mjs";

export async function slide09(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "core workflows", "The main workflows convert one-time sharing into reusable academic knowledge.");
  const flows = [
    ["Notes Upload", ["Select file + metadata", "Backend uploads file", "MongoDB stores note", "Appears in lists/profile"], 92, C.teal],
    ["Q&A Interaction", ["Ask tagged question", "Attach optional images", "Answer inside card", "Like and revisit"], 462, C.amber],
    ["Community Post", ["Create text/images", "Comment and like", "Follow contributor", "Build reputation"], 832, C.coral],
  ];
  for (const [name, steps, left, accent] of flows) {
    card(slide, ctx, { title: name, body: "", left, top: 188, width: 314, height: 390, accent });
    steps.forEach((step, i) => {
      const top = 270 + i * 70;
      ctx.addShape(slide, { left: left + 34, top, width: 34, height: 34, fill: accent, line: ctx.line(accent, 0) }).borderRadius = 17;
      ctx.addText(slide, { text: String(i + 1), left: left + 34, top: top + 7, width: 34, height: 20, fontSize: 14, bold: true, color: C.white, align: "center" });
      ctx.addText(slide, { text: step, left: left + 86, top: top + 2, width: 190, height: 30, fontSize: 16, bold: i === 0, color: C.ink });
      if (i < steps.length - 1) line(slide, ctx, left + 50, top + 38, 2, 27, "#CFD9DE");
    });
  }
  footer(slide, ctx, 9);
  return slide;
}
