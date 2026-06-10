import { C, bg, title, footer, card } from "./_common.mjs";

export async function slide11(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  title(slide, ctx, "security + quality", "The implementation protects accounts, ownership, files, and project maintainability.");
  const controls = [
    ["Authentication security", "Passwords are hashed with bcrypt; JWT access and refresh tokens use HTTP-only cookies.", 80, 200, C.ink],
    ["Authorization", "Protected routes enforce current-user identity, role checks, and ownership before sensitive actions.", 430, 200, C.teal],
    ["Upload safety", "Multer and dedicated upload middleware coordinate files before cloud storage and metadata saving.", 780, 200, C.amber],
    ["Cleanup consistency", "Account deletion removes associated content, relations, reports, likes, comments, and uploaded files where applicable.", 80, 410, C.coral],
    ["Reusable structure", "Route groups, controllers, Mongoose models, contexts, and reusable components keep the code maintainable.", 430, 410, C.teal],
    ["Validation checks", "Frontend lint/build and backend node --check helped catch syntax and integration issues.", 780, 410, C.ink],
  ];
  for (const [t, b, left, top, accent] of controls) card(slide, ctx, { title: t, body: b, left, top, width: 310, height: 150, accent });
  footer(slide, ctx, 11);
  return slide;
}
