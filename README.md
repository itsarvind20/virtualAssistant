# Virtual Assistant

Virtual Assistant is a MERN stack voice assistant that can listen for spoken commands, respond with speech, open desktop apps, control media, search the web, play music, and provide a personalized assistant experience with user accounts and custom avatars.

The assistant uses React on the frontend, Node.js/Express on the backend, MongoDB for user data, Cloudinary for uploaded assistant images, Groq for AI command understanding, Puppeteer for YouTube/YouTube Music control, and optional OpenAI transcription for higher-accuracy voice commands.

## Main Functionality

### User Account Features

- Create a new account with name, email, and password.
- Sign in with an existing account.
- Keep users logged in with JWT cookies.
- Log out from the assistant UI.
- Store user profile data in MongoDB.
- Load the current logged-in user automatically when the app starts.
- Protect assistant routes so only authenticated users can access them.
- Hash passwords using bcrypt before storing them.

### Assistant Customization

- Choose an assistant avatar from built-in image options.
- Upload a custom assistant image from the local device.
- Upload custom images to Cloudinary.
- Save the selected assistant image to the user profile.
- Set a custom assistant name.
- Use the assistant name as the wake word.
- Redirect new users to customization before entering the main assistant screen.

### Voice Input And Wake Behavior

- Request microphone permission from the browser.
- Continuously monitor speech when microphone access is available.
- Detect wake phrases based on the custom assistant name.
- Supports wake phrases such as:
  - `assistant name`
  - `hey assistant name`
  - `okay assistant name`
  - `ok assistant name`
  - `hello assistant name`
  - `hi assistant name`
  - `wake up assistant name`
- Supports fuzzy wake-word matching for small pronunciation mistakes.
- Plays a short beep when the wake phrase is detected.
- Allows wake phrase plus command in one sentence.
  - Example: `Hey Robin play perfect`
- Shows interim speech text while listening.
- Uses browser speech recognition by default.
- Can use Vosk offline speech recognition when configured.
- Can use Picovoice Porcupine for offline wake-word detection when configured.
- Automatically restarts browser speech recognition after it ends unexpectedly.
- Pauses microphone recognition while the assistant is speaking to reduce feedback.
- Supports manual wake with the microphone button.
- Supports manual sleep mode with the sleep button.

### Voice Command Recording And Transcription

- Records a short audio command after wake-up.
- Uses silence detection to decide when the user has finished speaking.
- Sends recorded audio to the backend for transcription when configured.
- Uses OpenAI transcription if `OPENAI_API_KEY` is available.
- Falls back to browser speech transcript if cloud transcription fails.
- Normalizes speech text before command processing.

### Assistant Speech Output

- Speaks assistant responses using browser speech synthesis.
- Prefers English India voices when available.
- Falls back to English US or another English voice.
- Cancels speech when interrupted.
- Queues speech responses safely.
- Updates assistant UI states while speaking, thinking, listening, waking, idle, or sleeping.

## Supported Commands

### General AI Conversation

- Answer normal questions through Groq.
- Give short, voice-friendly responses.
- Use recent conversation history for follow-up questions.
- Respond to creator questions such as `who created you`.
- Return structured command data from the AI model.
- Recover from unclear AI output with fallback messages.

Example commands:

- `who created you`
- `what is artificial intelligence`
- `explain this in simple words`
- `what can you do`

### Google Search

- Search Google from voice or typed commands.
- Opens the search in the browser.
- Cleans the query before searching.

Example commands:

- `search Google for React hooks`
- `search for today's weather`
- `Google search JavaScript promises`

### YouTube Search And Video Playback

- Open YouTube directly.
- Search YouTube for videos.
- Play the first YouTube video result using Puppeteer.
- Distinguish YouTube video commands from YouTube Music commands.

Example commands:

- `open YouTube`
- `search YouTube for React tutorial`
- `play JavaScript crash course video on YouTube`
- `show funny coding videos on YouTube`

### YouTube Music Playback

- Play songs on YouTube Music.
- Search YouTube Music for the requested song, artist, album, or playlist.
- Click the first large top-result song card when available.
- Fall back to the first normal song result when no top card is available.
- Reuse the existing music browser window when possible.
- Bring the music browser window to the front.
- Attempt to skip YouTube ads automatically.

Example commands:

- `play perfect`
- `play Wish You Were Here`
- `play music by Arijit Singh`
- `listen to lo-fi beats`
- `put on a playlist`
- `play the song faded`

### Media Controls

- Stop current music or media.
- Pause music.
- Resume music.
- Skip to the next song.
- Cancel current assistant work.
- Interrupt speech while the assistant is speaking.
- Keep the assistant idle after stopping music instead of sending it to sleep.

Example commands:

- `stop`
- `cancel`
- `mute`
- `never mind`
- `pause`
- `resume`
- `continue`
- `next`
- `skip`
- `next song`
- `skip track`

### Desktop App Commands

The backend can launch common Windows desktop applications.

- Open Google Chrome.
- Open Notepad.
- Open Visual Studio Code.
- Open Calculator.

Example commands:

- `open Chrome`
- `launch Google Chrome`
- `open Notepad`
- `start VS Code`
- `open calculator`

### Website Shortcuts

- Open YouTube.
- Open Instagram.
- Open Facebook.
- Show weather by opening a Google weather search.

Example commands:

- `open YouTube`
- `open Instagram`
- `open Facebook`
- `show weather`
- `what is the weather`
- `temperature today`

### Date And Time

- Tell the current date.
- Tell the current time.
- Tell the current day.
- Tell the current month.

Example commands:

- `what time is it`
- `current time`
- `today date`
- `what day is it`
- `current month`

### Sleep And Conversation Control

- Put the assistant into sleep mode.
- End the current conversation.
- Clear recent conversation context when ending the conversation.
- Wake again with the assistant name or the mic button.

Example commands:

- `sleep`
- `go to sleep`
- `standby`
- `shutdown listening`
- `end conversation`
- `goodbye`
- `bye`
- `that's all`
- `we are done`

### Text Input Commands

- Type a command instead of speaking.
- Send typed commands through the same command processor used by voice.
- Use Enter key or the send button to submit text.

## UI Functionality

- Home screen shows the assistant avatar/orb.
- Shows current assistant status:
  - sleeping
  - waking
  - listening
  - thinking
  - speaking
  - idle
- Shows the latest assistant message.
- Shows live/interim recognized speech in the voice visualizer.
- Shows available wake phrases.
- Shows microphone or speech-recognition errors.
- Provides buttons for:
  - starting listening
  - sleeping
  - customization
  - logout
  - sending typed commands
- Authentication and customization pages use the same dark assistant UI style as the Home page.

## Backend API Functionality

### Authentication Routes

- `POST /api/auth/signup`
  - Creates a user account.
- `POST /api/auth/signin`
  - Signs in a user.
- `GET /api/auth/logout`
  - Logs out the current user.

### User Routes

- `GET /api/user/current`
  - Returns the authenticated user's profile.
- `POST /api/user/update`
  - Updates assistant name and assistant image.
- `POST /api/user/asktoassistant`
  - Processes typed or spoken assistant commands.
- `POST /api/user/transcribe`
  - Transcribes recorded audio commands when OpenAI transcription is configured.

## Command Types Used Internally

The assistant classifies commands into these internal types:

- `general`
- `google-search`
- `youtube-search`
- `youtube-play`
- `get-time`
- `get-date`
- `get-day`
- `get-month`
- `calculator-open`
- `instagram-open`
- `facebook-open`
- `weather-show`
- `open-chrome`
- `open-notepad`
- `open-vscode`
- `open-youtube`
- `play-music`
- `youtube-music-play`
- `pause-media`
- `resume-media`
- `next-media`
- `cancel-command`
- `end-conversation`
- `send-email`

Note: `send-email` is included in the AI command schema, but email sending is not fully implemented in the current command handler.

## Optional Offline And Advanced Voice Features

### Vosk Speech Recognition

If a Vosk browser model is provided, the assistant can use offline speech recognition instead of browser speech recognition.

Frontend variable:

```env
VITE_VOSK_MODEL_PATH=/voice-models/vosk-model-small-en-us-0.15.tar.gz
```

### Porcupine Wake Word

If Picovoice Porcupine is configured, the assistant can use offline wake-word detection.

Frontend variables:

```env
VITE_PICOVOICE_ACCESS_KEY=
VITE_PORCUPINE_KEYWORD_PATH=/voice-models/assistant.ppn
VITE_PORCUPINE_MODEL_PATH=/porcupine_params.pv
VITE_PORCUPINE_SENSITIVITY=0.65
```

### OpenAI Audio Transcription

If OpenAI transcription is configured, recorded commands can be transcribed more accurately on the backend.

Backend variables:

```env
OPENAI_API_KEY=
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
```

## Google Calendar Integration

The assistant can connect to Google Calendar through OAuth and manage calendar events using voice or typed commands.

### Calendar Features

- Connect Google Calendar with OAuth.
- Store Google tokens only on the backend.
- Encrypt stored Google access and refresh tokens before saving them to MongoDB.
- Refresh expired Google tokens automatically through `googleapis`.
- Create normal calendar events.
- Create reminder-style calendar events.
- Create yearly all-day birthday events.
- View today's schedule.
- View this week's schedule.
- View this month's schedule.
- View the next upcoming event.
- Search calendar events.
- Update event title, date, time, location, description, attendees, recurrence, and Google Meet link.
- Delete events only after confirmation.
- Check free/busy availability.
- Ask for confirmation before create, update, and delete actions.

### Calendar Voice Examples

- `Hey Robin, add a meeting tomorrow at 5 PM`
- `Schedule project discussion with Rahul on Monday at 10 AM`
- `Add Aman birthday on 15 August every year`
- `Remind me to submit assignment tomorrow morning`
- `What is on my calendar today?`
- `Show my meetings this week`
- `Move my 5 PM meeting to 6 PM`
- `Cancel my meeting with Rahul`
- `Delete tomorrow's reminder`
- `Am I free tomorrow evening?`
- `Add Google Meet link to my next meeting`
- `Create an event every Monday at 9 AM`
- `Remind me every day at 8 PM to revise DSA`

### Calendar Files

Backend files:

- `backend/server.js`
- `backend/routes/calendarRoutes.js`
- `backend/controllers/calendarController.js`
- `backend/services/googleCalendarService.js`
- `backend/middleware/authMiddleware.js`
- `backend/utils/dateParser.js`

Frontend files:

- `frontend/src/services/calendarService.js`
- `frontend/src/services/calendarIntentService.js`
- `frontend/src/hooks/useGoogleCalendar.js`
- `frontend/src/components/CalendarPanel.jsx`
- `frontend/src/components/EventCard.jsx`
- `frontend/src/components/ConfirmationModal.jsx`
- `frontend/src/services/commandProcessor.js`
- `frontend/src/pages/Home.jsx`

### Calendar API Routes

- `GET /api/calendar/status`
  - Checks if Google Calendar is connected.
- `POST /api/calendar/auth-url`
  - Creates a Google OAuth URL for the logged-in user.
- `GET /api/calendar/oauth/callback`
  - Receives the Google OAuth callback.
- `POST /api/calendar/create-event`
  - Creates a Google Calendar event.
- `POST /api/calendar/create-birthday`
  - Creates a yearly all-day birthday event.
- `POST /api/calendar/create-reminder`
  - Creates a reminder-style calendar event.
- `GET /api/calendar/events/today`
  - Lists today's events.
- `GET /api/calendar/events/week`
  - Lists this week's events.
- `GET /api/calendar/events`
  - Lists events by range.
- `GET /api/calendar/events/next`
  - Returns the next upcoming event.
- `GET /api/calendar/search`
  - Searches events.
- `PATCH /api/calendar/update-event/:eventId`
  - Updates an event.
- `DELETE /api/calendar/delete-event/:eventId`
  - Deletes an event.
- `POST /api/calendar/freebusy`
  - Checks availability.

### Install Calendar Packages

Backend:

```bash
cd backend
npm install googleapis chrono-node
```

Frontend:

```bash
cd frontend
npm install chrono-node
```

### Google Cloud Console Setup

1. Open Google Cloud Console.
2. Create a new project or select an existing project.
3. Go to `APIs & Services`.
4. Enable `Google Calendar API`.
5. Go to `OAuth consent screen`.
6. Select app type and fill in the required app information.
7. Add yourself as a test user if the app is in testing mode.
8. Go to `Credentials`.
9. Create `OAuth client ID`.
10. Choose `Web application`.
11. Add this authorized JavaScript origin:

```text
http://localhost:5173
```

12. Add this authorized redirect URI for this project:

```text
http://localhost:8000/api/calendar/oauth/callback
```

If you change the backend `PORT`, update the redirect URI in Google Cloud Console and in `backend/.env`.

### Calendar Environment Variables

Add these values to `backend/.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/calendar/oauth/callback
GOOGLE_TOKEN_ENCRYPTION_SECRET=
FRONTEND_URL=http://localhost:5173
CALENDAR_TIME_ZONE=Asia/Kolkata
```

Add this value to `frontend/.env`:

```env
VITE_SERVER_URL=http://localhost:8000
```

For Hindi speech recognition and Hindi voice responses, add:

```env
VITE_SPEECH_PROVIDER=browser
VITE_SPEECH_RECOGNITION_LANG=hi-IN
VITE_TTS_LANG=hi-IN
VITE_ASSISTANT_RESPONSE_LANG=hi
```

Do not put `GOOGLE_CLIENT_SECRET` in the frontend.

### Calendar Confirmation Flow

Create, update, and delete commands are prepared first. The assistant then asks for confirmation.

Create flow:

```text
User: Hey Robin, schedule meeting with Rahul tomorrow at 5 PM
Assistant: I understood: Meeting with Rahul. Should I create this event?
User: Yes
Assistant: Done. I added it to your Google Calendar.
```

Delete flow:

```text
User: Cancel my meeting with Rahul tomorrow
Assistant: I found Meeting with Rahul at 5 PM. Should I delete it?
User: Yes, delete it
Assistant: Done. I deleted the event.
```

### Calendar Testing

Backend syntax checks:

```bash
node --check backend/services/googleCalendarService.js
node --check backend/controllers/calendarController.js
node --check backend/routes/calendarRoutes.js
node --check backend/utils/dateParser.js
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Manual test:

1. Start backend.
2. Start frontend.
3. Sign in.
4. Use the Calendar panel on the Home page to connect Google Calendar.
5. Approve Calendar permissions in Google.
6. Return to the assistant.
7. Try `What is on my calendar today?`
8. Try `Add a meeting tomorrow at 5 PM`.
9. Say or type `yes` when the assistant asks for confirmation.

## Environment Variables

Backend `.env` values:

```env
PORT=8000
MONGODB_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
OPENAI_API_KEY=
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
EMAIL_USER=
EMAIL_PASS=
```

Frontend `.env` values:

```env
VITE_SPEECH_PROVIDER=auto
VITE_PICOVOICE_ACCESS_KEY=
VITE_PORCUPINE_KEYWORD_PATH=/voice-models/assistant.ppn
VITE_PORCUPINE_MODEL_PATH=/porcupine_params.pv
VITE_PORCUPINE_SENSITIVITY=0.65
VITE_VOSK_MODEL_PATH=/voice-models/vosk-model-small-en-us-0.15.tar.gz
```

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Lucide React
- Backend: Node.js, Express.js
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT, bcrypt
- File upload: Multer, Cloudinary
- AI command parsing: Groq chat completions
- Audio transcription: OpenAI audio transcription, optional
- Browser automation: Puppeteer
- Voice APIs: Web Speech API, SpeechSynthesis, optional Vosk, optional Porcupine

## Current Limitations

- Desktop app commands are Windows-focused.
- Browser speech recognition depends on browser support.
- Music and YouTube playback depend on YouTube/YouTube Music page structure.
- Email credentials exist in environment examples, but full email sending is not wired into the assistant command handler yet.
- Weather currently opens a Google weather search instead of using a dedicated weather API.
