const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Codex";
pptx.subject = "Virtual Assistant project presentation";
pptx.title = "Virtual Assistant Project";
pptx.company = "Virtual Assistant";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "CUSTOM_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "CUSTOM_WIDE";
pptx.margin = 0;

const OUT = path.resolve(__dirname, "../output/virtual-assistant-project-presentation.pptx");
const C = {
  ink: "0B1020",
  ink2: "10172A",
  panel: "151E33",
  panel2: "1F2A44",
  line: "33415F",
  text: "F7FAFF",
  muted: "AAB6CC",
  blue: "4EA7FF",
  cyan: "2FE7D0",
  green: "6FE68B",
  amber: "FFD166",
  red: "FF6B6B",
  white: "FFFFFF"
};

function slideBase(slide, kicker, title, page) {
  slide.background = { color: C.ink };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.ink }, line: { color: C.ink } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.09, fill: { color: C.cyan }, line: { color: C.cyan } });
  slide.addText(kicker.toUpperCase(), {
    x: 0.72, y: 0.42, w: 3.2, h: 0.25, fontFace: "Aptos", fontSize: 9, bold: true,
    color: C.cyan, charSpace: 1.6, margin: 0
  });
  slide.addText(title, {
    x: 0.72, y: 0.72, w: 9.9, h: 0.82, fontFace: "Aptos Display", fontSize: 28,
    bold: true, color: C.text, margin: 0, breakLine: false, fit: "shrink"
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: 12.23, y: 6.96, w: 0.42, h: 0.18, fontSize: 8, color: C.muted, margin: 0, align: "right"
  });
  slide.addShape(pptx.ShapeType.line, { x: 0.72, y: 6.9, w: 11.9, h: 0, line: { color: C.line, width: 0.6 } });
}

function pill(slide, text, x, y, w, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.34, rectRadius: 0.06,
    fill: { color, transparency: 86 },
    line: { color, transparency: 15, width: 0.9 }
  });
  slide.addText(text, { x: x + 0.12, y: y + 0.09, w: w - 0.24, h: 0.14, fontSize: 8, bold: true, color, margin: 0, align: "center" });
}

function metric(slide, value, label, note, x, y, w, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 1.18, rectRadius: 0.06,
    fill: { color: C.panel }, line: { color: C.line, width: 0.9 }
  });
  slide.addText(value, { x: x + 0.18, y: y + 0.19, w: w - 0.36, h: 0.34, fontSize: 22, bold: true, color, margin: 0 });
  slide.addText(label, { x: x + 0.18, y: y + 0.58, w: w - 0.36, h: 0.2, fontSize: 9.5, bold: true, color: C.text, margin: 0 });
  slide.addText(note, { x: x + 0.18, y: y + 0.83, w: w - 0.36, h: 0.2, fontSize: 8.5, color: C.muted, margin: 0, fit: "shrink" });
}

function box(slide, title, body, x, y, w, h, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: C.panel }, line: { color: C.line, width: 0.9 }
  });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h, fill: { color }, line: { color } });
  slide.addText(title, { x: x + 0.22, y: y + 0.2, w: w - 0.42, h: 0.22, fontSize: 11, bold: true, color: C.text, margin: 0 });
  slide.addText(body, { x: x + 0.22, y: y + 0.53, w: w - 0.42, h: h - 0.72, fontSize: 9.2, color: C.muted, margin: 0.02, fit: "shrink", breakLine: false });
}

function node(slide, title, sub, x, y, w, h, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.05, fill: { color: C.panel2 }, line: { color, width: 1.1 } });
  slide.addText(title, { x: x + 0.13, y: y + 0.15, w: w - 0.26, h: 0.22, fontSize: 10.5, bold: true, color: C.text, margin: 0, align: "center" });
  slide.addText(sub, { x: x + 0.13, y: y + 0.46, w: w - 0.26, h: h - 0.58, fontSize: 8.3, color: C.muted, margin: 0, align: "center", fit: "shrink" });
}

function arrow(slide, x1, y1, x2, y2, color = C.line) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width: 1.2, beginArrowType: "none", endArrowType: "triangle" }
  });
}

function bulletList(slide, items, x, y, w, color = C.cyan) {
  items.forEach((item, i) => {
    const yy = y + i * 0.52;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: yy + 0.06, w: 0.1, h: 0.1, fill: { color }, line: { color } });
    slide.addText(item, { x: x + 0.2, y: yy, w, h: 0.28, fontSize: 11, color: C.text, margin: 0, fit: "shrink" });
  });
}

// 1. Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.ink };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.ink }, line: { color: C.ink } });
  s.addShape(pptx.ShapeType.arc, { x: 7.75, y: -0.3, w: 4.3, h: 4.3, line: { color: C.cyan, width: 2.2, transparency: 20 }, adjustPoint: 0.18 });
  s.addShape(pptx.ShapeType.arc, { x: 8.6, y: 0.5, w: 2.75, h: 2.75, line: { color: C.blue, width: 1.6, transparency: 15 }, adjustPoint: 0.28 });
  s.addText("VIRTUAL ASSISTANT", { x: 0.75, y: 0.72, w: 4, h: 0.26, fontSize: 9, color: C.cyan, bold: true, charSpace: 1.8, margin: 0 });
  s.addText("A personalized voice assistant built on the MERN stack.", {
    x: 0.72, y: 1.28, w: 7.4, h: 1.28, fontSize: 38, bold: true, color: C.text, margin: 0, fit: "shrink"
  });
  s.addText("The project combines browser voice recognition, AI command understanding, secure user profiles, media control, desktop automation, and Google Calendar workflows in one assistant experience.", {
    x: 0.76, y: 2.85, w: 6.55, h: 0.72, fontSize: 13.5, color: C.muted, margin: 0, breakLine: false, fit: "shrink"
  });
  metric(s, "MERN", "application stack", "React + Express + MongoDB + Node.js", 0.78, 4.54, 2.55, C.cyan);
  metric(s, "Voice", "first interaction", "Wake word, speech recognition, TTS", 3.55, 4.54, 2.55, C.blue);
  metric(s, "AI", "command layer", "Groq parsing with optional OpenAI transcription", 6.32, 4.54, 2.78, C.amber);
  metric(s, "Calendar", "product extension", "OAuth, events, reminders, confirmations", 9.32, 4.54, 2.85, C.green);
  s.addText("Project presentation", { x: 0.76, y: 6.85, w: 2.2, h: 0.18, fontSize: 8.5, color: C.muted, margin: 0 });
}

// 2. Problem
{
  const s = pptx.addSlide();
  slideBase(s, "Product thesis", "The assistant turns scattered digital tasks into one conversational control surface.", 2);
  box(s, "Before", "Users jump between browser tabs, music apps, search, calendar tools, and desktop utilities for small everyday tasks.", 0.82, 2.05, 3.25, 1.75, C.red);
  box(s, "Assistant bridge", "A custom wake word opens a short command window, then the system chooses the right tool path automatically.", 5.0, 1.75, 3.35, 2.35, C.cyan);
  box(s, "After", "The same interface can answer, search, play music, control media, launch apps, and schedule calendar items.", 9.25, 2.05, 3.1, 1.75, C.green);
  arrow(s, 4.18, 2.9, 4.9, 2.9, C.cyan);
  arrow(s, 8.45, 2.9, 9.17, 2.9, C.cyan);
  bulletList(s, [
    "Personalization keeps the assistant name, avatar, and profile tied to each signed-in user.",
    "Voice input and typed input share the same command processor, so the feature set stays consistent.",
    "Confirmation flows make calendar writes safer before events are created, updated, or deleted."
  ], 1.1, 5.0, 10.7, C.amber);
}

// 3. Feature map
{
  const s = pptx.addSlide();
  slideBase(s, "Feature system", "The product is broader than chat: it combines identity, voice, tools, and scheduling.", 3);
  const items = [
    ["User accounts", "JWT cookies, bcrypt password hashing, protected routes"],
    ["Assistant identity", "Custom name as wake word, built-in or uploaded avatar"],
    ["Voice loop", "Wake phrases, fuzzy matching, speech recognition, synthesis"],
    ["AI command parsing", "Groq classifies intent and returns structured command data"],
    ["Media and web", "Google, YouTube search, YouTube Music, pause/resume/next"],
    ["Calendar workflows", "OAuth, event CRUD, reminders, birthdays, free/busy"]
  ];
  items.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    box(s, it[0], it[1], 0.78 + col * 4.12, 1.95 + row * 1.75, 3.45, 1.22, [C.cyan, C.blue, C.amber, C.green, C.red, C.cyan][i]);
  });
  s.addText("Core value: a practical assistant that can move from conversation to action without forcing the user through separate interfaces.", {
    x: 0.88, y: 6.0, w: 11.25, h: 0.34, fontSize: 12.5, color: C.text, bold: true, margin: 0, align: "center"
  });
}

// 4. Architecture
{
  const s = pptx.addSlide();
  slideBase(s, "Architecture", "React handles the live assistant experience while Express owns secure integrations and execution.", 4);
  node(s, "React + Vite UI", "Home, auth, customization, calendar panel", 0.82, 2.1, 2.35, 1.05, C.cyan);
  node(s, "Voice services", "Wake word, recorder, TTS, interrupt logic", 0.82, 4.0, 2.35, 1.05, C.blue);
  node(s, "Express API", "Auth, user, system, calendar, transcription routes", 4.0, 2.95, 2.55, 1.2, C.amber);
  node(s, "MongoDB", "Users, assistant settings, encrypted tokens", 7.35, 1.65, 2.25, 0.95, C.green);
  node(s, "Cloudinary", "Uploaded assistant images", 7.35, 3.0, 2.25, 0.95, C.blue);
  node(s, "AI providers", "Groq commands, optional OpenAI transcription", 7.35, 4.35, 2.25, 0.95, C.cyan);
  node(s, "External actions", "Google Calendar, YouTube, desktop apps", 10.28, 3.0, 2.18, 0.95, C.red);
  arrow(s, 3.17, 2.62, 3.94, 3.28, C.cyan);
  arrow(s, 3.17, 4.52, 3.94, 3.78, C.cyan);
  arrow(s, 6.56, 3.18, 7.28, 2.12, C.green);
  arrow(s, 6.56, 3.35, 7.28, 3.48, C.blue);
  arrow(s, 6.56, 3.72, 7.28, 4.82, C.cyan);
  arrow(s, 9.64, 3.48, 10.2, 3.48, C.red);
  s.addText("Security boundary: provider secrets and Google tokens stay on the backend; the frontend receives user-safe state and action results.", {
    x: 1.02, y: 6.05, w: 10.9, h: 0.32, fontSize: 11.2, color: C.muted, margin: 0, align: "center"
  });
}

// 5. Command flow
{
  const s = pptx.addSlide();
  slideBase(s, "Command flow", "A short wake-to-action pipeline keeps voice commands responsive and recoverable.", 5);
  const steps = [
    ["Wake", "Detect assistant name or manual mic"],
    ["Capture", "Record speech and detect silence"],
    ["Transcribe", "Browser speech or optional OpenAI audio"],
    ["Classify", "Groq maps text to command type"],
    ["Execute", "Route to browser, media, app, calendar, or answer"],
    ["Respond", "Speak result and update assistant state"]
  ];
  steps.forEach((st, i) => {
    const x = 0.72 + i * 2.02;
    node(s, st[0], st[1], x, 2.25, 1.55, 1.2, [C.cyan, C.blue, C.amber, C.green, C.red, C.cyan][i]);
    if (i < steps.length - 1) arrow(s, x + 1.56, 2.85, x + 1.96, 2.85, C.line);
  });
  pill(s, "assistant name / hey assistant / ok assistant", 1.08, 4.48, 3.0, C.cyan);
  pill(s, "play perfect / open calculator / what is on my calendar today", 4.36, 4.48, 4.1, C.amber);
  pill(s, "pause / resume / next / sleep / cancel", 8.72, 4.48, 2.82, C.green);
  s.addText("Fallback design matters: if cloud transcription fails, the browser transcript can still continue the command path.", {
    x: 1.04, y: 5.62, w: 10.9, h: 0.34, fontSize: 12, color: C.text, margin: 0, align: "center"
  });
}

// 6. User experience
{
  const s = pptx.addSlide();
  slideBase(s, "Experience states", "The UI makes the assistant state visible so users know when to speak, wait, or interrupt.", 6);
  const states = [
    ["Sleeping", C.line], ["Waking", C.cyan], ["Listening", C.blue],
    ["Thinking", C.amber], ["Speaking", C.green], ["Idle", C.muted]
  ];
  states.forEach((st, i) => {
    const x = 1.0 + i * 1.82;
    s.addShape(pptx.ShapeType.ellipse, { x, y: 2.1, w: 1.08, h: 1.08, fill: { color: st[1], transparency: i === 0 ? 45 : 20 }, line: { color: st[1], width: 1.4 } });
    s.addText(st[0], { x: x - 0.25, y: 3.42, w: 1.58, h: 0.2, fontSize: 9.2, bold: true, color: C.text, align: "center", margin: 0 });
  });
  box(s, "Home screen", "Assistant avatar/orb, latest message, visualizer, status, sleep, mic, customization, logout, typed command input.", 0.88, 4.42, 3.65, 1.32, C.cyan);
  box(s, "Authentication", "Sign up, sign in, current-user loading, protected assistant routes, secure logout through JWT cookies.", 4.86, 4.42, 3.65, 1.32, C.amber);
  box(s, "Customization", "Choose built-in avatars, upload a custom image to Cloudinary, and set the assistant name used as wake word.", 8.84, 4.42, 3.65, 1.32, C.green);
}

// 7. Calendar deep dive
{
  const s = pptx.addSlide();
  slideBase(s, "Calendar extension", "Google Calendar turns the assistant from a responder into a trusted scheduler.", 7);
  node(s, "Connect", "OAuth URL, consent, callback", 0.95, 2.0, 2.0, 1.05, C.cyan);
  node(s, "Protect", "Store tokens backend-side and encrypt them", 3.25, 2.0, 2.05, 1.05, C.blue);
  node(s, "Understand", "Parse natural dates and calendar intent", 5.65, 2.0, 2.05, 1.05, C.amber);
  node(s, "Confirm", "Ask before create, update, delete", 8.05, 2.0, 2.05, 1.05, C.green);
  node(s, "Act", "Events, reminders, birthdays, search, free/busy", 10.45, 2.0, 2.05, 1.05, C.red);
  [2.96, 5.31, 7.71, 10.11].forEach((x) => arrow(s, x, 2.52, x + 0.25, 2.52, C.line));
  box(s, "Supported asks", "Today's schedule, this week's meetings, next event, event search, free/busy checks, recurring reminders, birthday events, and Google Meet links.", 1.0, 4.2, 5.1, 1.34, C.cyan);
  box(s, "Safety rule", "Create, update, and delete actions are prepared first, then committed only after the user confirms the assistant's understanding.", 7.0, 4.2, 5.1, 1.34, C.green);
}

// 8. Tech proof
{
  const s = pptx.addSlide();
  slideBase(s, "Implementation proof", "The codebase is organized around service boundaries that match the product behavior.", 8);
  const left = [
    ["Frontend", "React 19, Vite, Tailwind CSS, Framer Motion, Lucide React"],
    ["Voice", "Web Speech API, SpeechSynthesis, optional Vosk and Porcupine"],
    ["State and UI", "AssistantContext, UserContext, hooks, pages, components"]
  ];
  const right = [
    ["Backend", "Node.js, Express 5, routes, controllers, services"],
    ["Data and identity", "MongoDB Atlas, Mongoose, JWT, bcrypt, Cloudinary"],
    ["Automation", "Puppeteer, desktop launch routes, Google APIs, chrono-node"]
  ];
  left.forEach((it, i) => box(s, it[0], it[1], 0.9, 1.9 + i * 1.35, 5.25, 0.92, [C.cyan, C.blue, C.amber][i]));
  right.forEach((it, i) => box(s, it[0], it[1], 7.1, 1.9 + i * 1.35, 5.25, 0.92, [C.green, C.cyan, C.red][i]));
  s.addText("Representative files: Home.jsx, commandProcessor.js, useSpeechRecognition.js, user.controllers.js, googleCalendarService.js, dateParser.js.", {
    x: 1.0, y: 6.03, w: 11.25, h: 0.25, fontSize: 10.5, color: C.muted, align: "center", margin: 0
  });
}

// 9. Roadmap / close
{
  const s = pptx.addSlide();
  slideBase(s, "Roadmap", "The next lift is reliability: harden integrations, close feature gaps, and improve observability.", 9);
  const lanes = [
    ["Short term", "Polish command fallback messages, complete email handling, improve weather with a dedicated API."],
    ["Medium term", "Add test coverage for calendar parsing, command classification, auth flows, and speech fallbacks."],
    ["Long term", "Package desktop automation more safely, add analytics for command success, and expand multilingual support."]
  ];
  lanes.forEach((l, i) => {
    box(s, l[0], l[1], 1.0 + i * 4.05, 2.05, 3.25, 2.35, [C.cyan, C.amber, C.green][i]);
  });
  s.addShape(pptx.ShapeType.line, { x: 1.18, y: 5.28, w: 10.9, h: 0, line: { color: C.line, width: 1.0 } });
  ["Demo ready", "Integration ready", "Production ready"].forEach((t, i) => {
    const x = 1.1 + i * 5.15;
    s.addShape(pptx.ShapeType.ellipse, { x, y: 5.13, w: 0.3, h: 0.3, fill: { color: [C.cyan, C.amber, C.green][i] }, line: { color: [C.cyan, C.amber, C.green][i] } });
    s.addText(t, { x: x - 0.42, y: 5.58, w: 1.2, h: 0.18, fontSize: 8.5, bold: true, color: C.text, align: "center", margin: 0 });
  });
  s.addText("Closing claim: Virtual Assistant is already a full-stack, voice-first productivity system; the strongest next step is reliability engineering around the highest-value integrations.", {
    x: 1.05, y: 6.28, w: 11.1, h: 0.35, fontSize: 12.2, color: C.text, bold: true, align: "center", margin: 0, fit: "shrink"
  });
}

pptx.writeFile({ fileName: OUT });
