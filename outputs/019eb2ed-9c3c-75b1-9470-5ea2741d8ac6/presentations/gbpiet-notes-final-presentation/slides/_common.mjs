export const C = {
  ink: "#14213D",
  paper: "#F8F3EA",
  teal: "#0F766E",
  amber: "#F59E0B",
  coral: "#E76F51",
  slate: "#374151",
  mist: "#E7EEF0",
  white: "#FFFFFF",
  muted: "#6B7280",
};

export function bg(slide, ctx, fill = C.paper) {
  ctx.addShape(slide, { left: 0, top: 0, width: 1280, height: 720, fill, line: ctx.line(fill, 0) });
}

export function title(slide, ctx, kicker, claim, dark = false) {
  const color = dark ? C.white : C.ink;
  const muted = dark ? "#BFD7D4" : C.teal;
  ctx.addText(slide, {
    text: kicker.toUpperCase(),
    left: 64,
    top: 36,
    width: 260,
    height: 28,
    fontSize: 13,
    bold: true,
    color: muted,
    typeface: ctx.fonts.body,
  });
  ctx.addText(slide, {
    text: claim,
    left: 64,
    top: 68,
    width: 900,
    height: 92,
    fontSize: 36,
    bold: true,
    color,
    typeface: ctx.fonts.title,
  });
}

export function footer(slide, ctx, n, dark = false) {
  ctx.addText(slide, {
    text: `GBPIET Notes final project | ${String(n).padStart(2, "0")}`,
    left: 64,
    top: 686,
    width: 420,
    height: 18,
    fontSize: 10,
    color: dark ? "#BFD7D4" : C.muted,
  });
}

export function pill(slide, ctx, text, left, top, width, fill = C.mist, color = C.ink) {
  const s = ctx.addShape(slide, { left, top, width, height: 34, fill, line: ctx.line(fill, 0) });
  s.borderRadius = 12;
  s.text = text;
  s.text.fontSize = 14;
  s.text.bold = true;
  s.text.color = color;
  s.text.typeface = ctx.fonts.body;
  s.text.alignment = "center";
  s.text.verticalAlignment = "middle";
  return s;
}

export function node(slide, ctx, { label, note, left, top, width = 210, height = 92, fill = C.white, accent = C.teal }) {
  const box = ctx.addShape(slide, { left, top, width, height, fill, line: ctx.line("#D7DEE2", 1) });
  box.borderRadius = 6;
  ctx.addShape(slide, { left, top, width: 7, height, fill: accent, line: ctx.line(accent, 0) });
  ctx.addText(slide, { text: label, left: left + 18, top: top + 14, width: width - 30, height: 24, fontSize: 17, bold: true, color: C.ink });
  ctx.addText(slide, { text: note, left: left + 18, top: top + 42, width: width - 30, height: Math.max(26, height - 56), fontSize: 11.5, color: C.slate });
  return box;
}

export function line(slide, ctx, left, top, width, height = 2, fill = "#AAB7BF") {
  return ctx.addShape(slide, { left, top, width, height, fill, line: ctx.line(fill, 0) });
}

export function card(slide, ctx, { title: t, body, left, top, width, height, fill = C.white, accent = C.teal }) {
  const s = ctx.addShape(slide, { left, top, width, height, fill, line: ctx.line("#D9E1E5", 1) });
  s.borderRadius = 8;
  ctx.addShape(slide, { left: left + 18, top: top + 18, width: 40, height: 5, fill: accent, line: ctx.line(accent, 0) });
  ctx.addText(slide, { text: t, left: left + 18, top: top + 32, width: width - 36, height: 28, fontSize: 18, bold: true, color: C.ink });
  ctx.addText(slide, { text: body, left: left + 18, top: top + 68, width: width - 36, height: height - 78, fontSize: 13.5, color: C.slate });
  return s;
}

export function sectionLabel(slide, ctx, text, left, top, color = C.teal) {
  ctx.addText(slide, { text: text.toUpperCase(), left, top, width: 220, height: 24, fontSize: 12, bold: true, color });
}
