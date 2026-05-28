import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LogOut, Mic, Moon, Send, Settings } from "lucide-react";
import AssistantOrb from "../components/AssistantOrb";
import CalendarPanel from "../components/CalendarPanel";
import ConfirmationModal from "../components/ConfirmationModal";
import ListeningAnimation from "../components/ListeningAnimation";
import VoiceVisualizer from "../components/VoiceVisualizer";
import { AssistantProvider } from "../context/AssistantContext";
import { userDataContext } from "../context/userDataContext";
import { ASSISTANT_STATES, useAssistantState } from "../hooks/useAssistantState";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { usePorcupineWakeWord } from "../hooks/usePorcupineWakeWord";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useWakeWord } from "../hooks/useWakeWord";
import { createAudioCommandRecorder, transcribeAudioCommand } from "../services/audioCommandRecorder";
import {
  classifyLocalIntent,
  executeCalendarIntent,
  executeLocalBrowserAction,
  isConfirmationResponse,
  parseCalendarIntent,
  prepareCalendarAction,
  processCommand,
} from "../services/commandProcessor";
import { abortTask, createTaskController, isInterruptCommand } from "../services/interruptService";
import { createTtsService } from "../services/ttsService";
import { normalizeSpeechText, requestMicrophonePermission } from "../utils/audioHelpers";
import { createSilenceTimer } from "../utils/silenceDetection";
import { isPorcupineConfigured } from "../services/speechConfig";

const ACTIVE_TIMEOUT_MS = 6500;
const FOLLOW_UP_TIMEOUT_MS = 45000;

function Home() {
  const { userData, serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const assistant = useAssistantState();

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Say "Hey ${userData?.assistantName || "Assistant"}" to wake me.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [interimText, setInterimText] = useState("");
  const [micReady, setMicReady] = useState(false);
  const [micPaused, setMicPaused] = useState(false);
  const [manualSleep, setManualSleep] = useState(false);
  const [pendingCalendarAction, setPendingCalendarAction] = useState(null);

  const historyRef = useRef([]);
  const taskControllerRef = useRef(createTaskController());
  const ttsRef = useRef(null);
  const activeCommandRef = useRef("");
  const activeStateRef = useRef(assistant.state);
  const silenceTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const recorderRef = useRef(createAudioCommandRecorder());
  const endRef = useRef(null);

  const assistantName = userData?.assistantName || "Assistant";
  const userName = userData?.name || "there";
  const googleCalendar = useGoogleCalendar({ serverUrl, enabled: Boolean(userData) });

  useEffect(() => {
    activeStateRef.current = assistant.state;
  }, [assistant.state]);

  useEffect(() => {
    ttsRef.current = createTtsService();

    return () => {
      ttsRef.current?.cancel();
    };
  }, []);

  const addMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  }, []);

  const buildSystemPrompt = useCallback(
    () =>
      `
You are ${assistantName}, a concise real-time voice assistant for ${userName}.
Classify commands accurately, keep replies short, and never claim an action happened if it failed.
For interruption commands, respond with a short acknowledgement.
`.trim(),
    [assistantName, userName]
  );

  const speak = useCallback(
    async (text, nextState = ASSISTANT_STATES.SLEEPING) => {
      if (!text) return;

      assistant.setState(ASSISTANT_STATES.SPEAKING);
      setMicPaused(true);

      await ttsRef.current?.speak(text, {
        onEnd: () => {
          setMicPaused(false);
          assistant.setState(nextState);
        },
        onError: () => {
          setMicPaused(false);
          assistant.setState(nextState);
        },
      });
    },
    [assistant]
  );

  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const startFollowUpSession = useCallback(() => {
    clearSessionTimer();

    sessionTimerRef.current = setTimeout(() => {
      activeCommandRef.current = "";
      setInterimText("");
      assistant.setState(ASSISTANT_STATES.SLEEPING);
    }, FOLLOW_UP_TIMEOUT_MS);
  }, [assistant, clearSessionTimer]);

  const handleInterrupt = useCallback(async () => {
    abortTask(taskControllerRef);
    ttsRef.current?.cancel();
    recorderRef.current.cancel();
    activeCommandRef.current = "";
    silenceTimerRef.current?.clear();
    clearSessionTimer();
    setInterimText("");
    setMicPaused(false);
    assistant.setState(ASSISTANT_STATES.IDLE);

    try {
      await processCommand({
        command: "stop",
        serverUrl,
        history: historyRef.current,
        systemPrompt: buildSystemPrompt(),
        signal: taskControllerRef.current.signal,
      });
    } catch {
      // Cancellation should be quiet. The local state has already stopped.
    }

    addMessage("assistant", "Stopped.");
  }, [addMessage, assistant, buildSystemPrompt, clearSessionTimer, serverUrl]);

  const endConversation = useCallback(async (response = "Conversation ended. Say my name when you need me again.") => {
    abortTask(taskControllerRef);
    ttsRef.current?.cancel();
    recorderRef.current.cancel();
    silenceTimerRef.current?.clear();
    clearSessionTimer();
    activeCommandRef.current = "";
    historyRef.current = [];
    setInterimText("");
    setMicPaused(false);
    setManualSleep(false);
    assistant.setState(ASSISTANT_STATES.SLEEPING);
    addMessage("assistant", response);
    await speak(response, ASSISTANT_STATES.SLEEPING);
  }, [addMessage, assistant, clearSessionTimer, speak]);

  const runPreparedCalendarIntent = useCallback(
    async (intent) => {
      silenceTimerRef.current?.clear();
      activeCommandRef.current = "";
      setInterimText("");
      assistant.setState(ASSISTANT_STATES.THINKING);

      const controller = abortTask(taskControllerRef);

      let prepared;

      try {
        prepared = await prepareCalendarAction({
          intent,
          serverUrl,
          signal: controller.signal,
        });
      } catch (error) {
        const response =
          error.response?.status === 401
            ? "Google Calendar is not connected yet. Use the calendar panel to connect it first."
            : error.response?.data?.message || "I had trouble preparing that calendar action.";
        addMessage("assistant", response);
        await speak(response, ASSISTANT_STATES.IDLE);
        startFollowUpSession();
        return;
      }

      if (controller.signal.aborted || !prepared) return;

      if (prepared.ready === false) {
        const response = prepared.response || "I could not prepare that calendar action.";
        addMessage("assistant", response);
        await speak(response, ASSISTANT_STATES.IDLE);
        startFollowUpSession();
        return;
      }

      if (prepared.confirmation) {
        setPendingCalendarAction(prepared.confirmation);
        addMessage("assistant", prepared.confirmation.message);
        await speak(prepared.confirmation.message, ASSISTANT_STATES.IDLE);
        startFollowUpSession();
        return;
      }

      const result = await executeCalendarIntent({
        intent,
        serverUrl,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (result.events) {
        googleCalendar.setEvents(result.events);
      } else {
        googleCalendar.refresh().catch(() => {});
      }

      addMessage("assistant", result.response);
      await speak(result.response, ASSISTANT_STATES.IDLE);
      startFollowUpSession();
    },
    [addMessage, assistant, googleCalendar, serverUrl, speak, startFollowUpSession]
  );

  const confirmCalendarAction = useCallback(async () => {
    if (!pendingCalendarAction?.intent) return;

    const action = pendingCalendarAction;
    setPendingCalendarAction(null);
    assistant.setState(ASSISTANT_STATES.THINKING);

    const controller = abortTask(taskControllerRef);
    const result = await executeCalendarIntent({
      intent: action.intent,
      serverUrl,
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    googleCalendar.refresh().catch(() => {});
    addMessage("assistant", result.response);
    await speak(result.response, ASSISTANT_STATES.IDLE);
    startFollowUpSession();
  }, [addMessage, assistant, googleCalendar, pendingCalendarAction, serverUrl, speak, startFollowUpSession]);

  const cancelCalendarAction = useCallback(async () => {
    setPendingCalendarAction(null);

    const response = "Okay, I will not change your calendar.";
    addMessage("assistant", response);
    await speak(response, ASSISTANT_STATES.IDLE);
    startFollowUpSession();
  }, [addMessage, speak, startFollowUpSession]);

  const runCommand = useCallback(
    async (rawCommand) => {
      const command = normalizeSpeechText(rawCommand);

      if (!command) {
        assistant.setState(ASSISTANT_STATES.SLEEPING);
        return;
      }

      if (pendingCalendarAction) {
        const confirmation = isConfirmationResponse(command);

        if (confirmation === "confirm") {
          addMessage("user", command);
          await confirmCalendarAction();
          return;
        }

        if (confirmation === "cancel") {
          addMessage("user", command);
          await cancelCalendarAction();
          return;
        }
      }

      if (isInterruptCommand(command)) {
        await handleInterrupt();
        return;
      }

      const localIntent = classifyLocalIntent(command);

      if (localIntent?.type === "end-conversation") {
        addMessage("user", command);
        await endConversation(localIntent.response);
        return;
      }

      if (localIntent?.type === "sleep-assistant") {
        addMessage("user", command);
        addMessage("assistant", localIntent.response);
        await speak(localIntent.response, ASSISTANT_STATES.SLEEPING);
        return;
      }

      const calendarIntent = parseCalendarIntent(command);

      if (calendarIntent) {
        addMessage("user", command);
        await runPreparedCalendarIntent(calendarIntent);
        return;
      }

      silenceTimerRef.current?.clear();
      activeCommandRef.current = "";
      setInterimText("");
      assistant.setState(ASSISTANT_STATES.THINKING);
      addMessage("user", command);

      const previousHistory = historyRef.current.slice(-20);
      const nextHistory = [...previousHistory, { role: "user", content: command }].slice(-20);

      try {
        const controller = abortTask(taskControllerRef);
        const data = await processCommand({
          command,
          serverUrl,
          history: previousHistory,
          systemPrompt: buildSystemPrompt(),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        executeLocalBrowserAction(data || {});

        const response = data?.response || "I did not get a clear answer.";
        historyRef.current = [...nextHistory, { role: "assistant", content: response }].slice(-20);
        addMessage("assistant", response);
        await speak(response, ASSISTANT_STATES.IDLE);
        startFollowUpSession();
      } catch (error) {
        if (error.name === "CanceledError" || error.name === "AbortError") return;

        const response = "I had trouble completing that.";
        addMessage("assistant", response);
        await speak(response, ASSISTANT_STATES.IDLE);
        startFollowUpSession();
      }
    },
    [
      addMessage,
      assistant,
      buildSystemPrompt,
      cancelCalendarAction,
      confirmCalendarAction,
      endConversation,
      handleInterrupt,
      pendingCalendarAction,
      runPreparedCalendarIntent,
      serverUrl,
      speak,
      startFollowUpSession,
    ]
  );

  const finishVoiceCommand = useCallback(async () => {
    const browserTranscript = activeCommandRef.current;

    silenceTimerRef.current?.clear();
    activeCommandRef.current = "";
    setInterimText("");
    assistant.setState(ASSISTANT_STATES.THINKING);

    try {
      const controller = abortTask(taskControllerRef);
      const audioBlob = await recorderRef.current.stop();
      const cloudTranscript = await transcribeAudioCommand({
        serverUrl,
        audioBlob,
        signal: controller.signal,
      }).catch(() => "");
      const command = cloudTranscript || browserTranscript;

      await runCommand(command);
    } catch (error) {
      if (error.name === "CanceledError" || error.name === "AbortError") return;

      await runCommand(browserTranscript);
    }
  }, [assistant, runCommand, serverUrl]);

  const enterListeningMode = useCallback(
    (seedCommand = "") => {
      setManualSleep(false);
      clearSessionTimer();
      assistant.setState(ASSISTANT_STATES.WAKING);
      activeCommandRef.current = seedCommand;
      setInterimText(seedCommand);

      window.setTimeout(() => {
        if (seedCommand) {
          runCommand(seedCommand);
          return;
        }

        assistant.setState(ASSISTANT_STATES.LISTENING);
        recorderRef.current.start().catch((error) => {
          assistant.setError(error.message || "Command recorder unavailable.");
        });
        silenceTimerRef.current?.clear();
        silenceTimerRef.current = createSilenceTimer({
          timeoutMs: ACTIVE_TIMEOUT_MS,
          onTimeout: finishVoiceCommand,
        });
        silenceTimerRef.current.reset();
      }, 250);
    },
    [assistant, clearSessionTimer, finishVoiceCommand, runCommand]
  );

  const wakeWord = useWakeWord({
    assistantName,
    onWake: (phrase) => {
      assistant.setLastWakePhrase(phrase);
    },
  });

  const porcupineWake = usePorcupineWakeWord({
    enabled:
      micReady &&
      !manualSleep &&
      isPorcupineConfigured() &&
      [ASSISTANT_STATES.SLEEPING, ASSISTANT_STATES.IDLE].includes(assistant.state),
    assistantName,
    onWake: (phrase) => {
      assistant.setLastWakePhrase(phrase);
      enterListeningMode();
    },
    onError: (error) => {
      assistant.setError(error?.message || "Porcupine wake word unavailable.");
    },
  });

  const handleSpeechResult = useCallback(
    (text) => {
      const normalized = normalizeSpeechText(text);
      const currentState = activeStateRef.current;

      if (!normalized) return;

      if (isInterruptCommand(normalized) && currentState !== ASSISTANT_STATES.SLEEPING) {
        handleInterrupt();
        return;
      }

      if ([ASSISTANT_STATES.SLEEPING, ASSISTANT_STATES.IDLE].includes(currentState)) {
        if (currentState === ASSISTANT_STATES.IDLE) {
          enterListeningMode();
          activeCommandRef.current = normalized;
          setInterimText(normalized);
          return;
        }

        const wake = wakeWord.detect(normalized);

        if (wake) {
          enterListeningMode(wake.trailingCommand);
        }

        return;
      }

      if (currentState === ASSISTANT_STATES.LISTENING) {
        activeCommandRef.current = `${activeCommandRef.current} ${normalized}`.trim();
        setInterimText(activeCommandRef.current);
        silenceTimerRef.current?.reset();
      }
    },
    [enterListeningMode, handleInterrupt, wakeWord]
  );

  const handleInterim = useCallback((text) => {
    if (activeStateRef.current === ASSISTANT_STATES.LISTENING) {
      setInterimText(text);
      silenceTimerRef.current?.reset();
    }
  }, []);

  const speech = useSpeechRecognition({
    enabled: micReady && !manualSleep,
    paused:
      micPaused ||
      (
        porcupineWake.active &&
        [ASSISTANT_STATES.SLEEPING, ASSISTANT_STATES.IDLE].includes(assistant.state)
      ),
    onResult: handleSpeechResult,
    onInterim: handleInterim,
    onError: (event) => {
      assistant.setError(event?.message || event?.error || "Microphone error");
    },
  });

  const setAssistantState = assistant.setState;
  const setAssistantError = assistant.setError;

  useEffect(() => {
    const controller = taskControllerRef.current;
    const recorder = recorderRef.current;

    requestMicrophonePermission()
      .then(() => {
        setMicReady(true);
        setAssistantState(ASSISTANT_STATES.SLEEPING);
      })
      .catch((error) => {
        setAssistantError(error.message || "Microphone permission is required.");
        setAssistantState(ASSISTANT_STATES.IDLE);
      });

    return () => {
      silenceTimerRef.current?.clear();
      clearSessionTimer();
      recorder.cancel();
      controller?.abort();
    };
  }, [clearSessionTimer, setAssistantError, setAssistantState]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text = input) => {
      const command = text.trim();

      if (!command) return;

      setInput("");
      await runCommand(command);
    },
    [input, runCommand]
  );

  const sleepAssistant = useCallback(() => {
    abortTask(taskControllerRef);
    ttsRef.current?.cancel();
    silenceTimerRef.current?.clear();
    clearSessionTimer();
    recorderRef.current.cancel();
    activeCommandRef.current = "";
    setInterimText("");
    setMicPaused(false);
    setManualSleep(true);
    assistant.setState(ASSISTANT_STATES.SLEEPING);
    addMessage("assistant", "Sleeping. Press the mic button to wake me.");
  }, [addMessage, assistant, clearSessionTimer]);

  const wakeAssistantManually = useCallback(() => {
    setManualSleep(false);

    if (!micReady) {
      requestMicrophonePermission()
        .then(() => {
          setMicReady(true);
          enterListeningMode();
        })
        .catch((error) => {
          assistant.setError(error.message || "Microphone permission is required.");
        });

      return;
    }

    enterListeningMode();
  }, [assistant, enterListeningMode, micReady]);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setUserData(null);
      navigate("/signin");
    }
  };

  const latestAssistantMessage =
    [...messages].reverse().find((message) => message.role === "assistant")?.content || "";

  const assistantContextValue = useMemo(
    () => ({
      ...assistant,
      micReady,
      manualSleep,
      speechSupported: speech.supported,
      wakePhrases: wakeWord.phrases,
      interrupt: handleInterrupt,
    }),
    [assistant, handleInterrupt, manualSleep, micReady, speech.supported, wakeWord.phrases]
  );

  return (
    <AssistantProvider value={assistantContextValue}>
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#07111f_45%,#050816)] px-4 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative z-30 flex items-center justify-between py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/60">assistant os</p>
            <h1 className="mt-1 text-2xl font-semibold">{assistantName}</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Sleep"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
              onClick={sleepAssistant}
            >
              <Moon size={18} />
            </button>
            <button
              type="button"
              aria-label="Customize assistant"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
              onClick={() => navigate("/customize")}
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              aria-label="Logout"
              className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
              onClick={handleLogOut}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-5 pb-28 pt-2">
          <AssistantOrb state={assistant.state} image={userData?.assistantImage} name={assistantName} />

          <div className="text-center">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">
              {manualSleep
                ? "manual sleep mode"
                : micReady
                  ? "continuous wake monitoring"
                  : "microphone permission needed"}
            </p>
            <h2 className="mt-2 max-w-3xl text-balance text-xl font-medium leading-8 text-white/90 sm:text-2xl">
              {latestAssistantMessage}
            </h2>
          </div>

          <ListeningAnimation active={assistant.isListening || assistant.isSpeaking || assistant.isThinking} />

          <div className="grid w-full max-w-4xl gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <VoiceVisualizer text={interimText} state={assistant.state} />

            <div className="grid gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/60">wake phrases</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wakeWord.phrases.slice(0, 5).map((phrase) => (
                    <span key={phrase} className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-sm">
                      {phrase}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/65">
                  {assistant.error ||
                    (manualSleep
                      ? "Microphone is paused. Press the mic button to wake me."
                      : null) ||
                    (speech.active
                      ? `Listening with ${speech.provider}.`
                      : porcupineWake.active
                        ? "Offline wake word engine is listening."
                        : "Recognition is restarting or waiting for permission.")}
                </p>
              </div>

              <CalendarPanel
                connected={googleCalendar.connected}
                error={googleCalendar.error}
                events={googleCalendar.events}
                loading={googleCalendar.loading}
                onConnect={googleCalendar.connect}
                onRefresh={() => googleCalendar.refresh()}
              />
            </div>
          </div>

          <div ref={endRef} />
        </main>

        <footer className="absolute bottom-4 left-1/2 z-30 flex w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/50 p-2 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            aria-label="Start listening"
            title="Start listening"
            className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full transition hover:scale-105 ${
              speech.active ? "bg-emerald-500" : "bg-slate-700 hover:bg-slate-600"
            }`}
            onClick={wakeAssistantManually}
          >
            <Mic size={18} />
          </button>
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/40"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
            placeholder={`Type a command, or say "Hey ${assistantName}"...`}
            value={input}
          />
          <button
            type="button"
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-cyan-300 text-black transition hover:bg-cyan-200"
            onClick={() => sendMessage()}
          >
            <Send size={18} />
          </button>
        </footer>

        <ConfirmationModal
          message={pendingCalendarAction?.message}
          onCancel={cancelCalendarAction}
          onConfirm={confirmCalendarAction}
          open={Boolean(pendingCalendarAction)}
        />
      </div>
    </AssistantProvider>
  );
}

export default Home;
