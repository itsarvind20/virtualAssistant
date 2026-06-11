import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Sparkles, Venus, Mars, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userDataContext";

const voiceOptions = [
  { id: "female", label: "Female", Icon: Venus },
  { id: "male", label: "Male", Icon: Mars },
  { id: "auto", label: "Auto", Icon: Wand2 },
];

function Customize2() {
  const { userData, backendImage, selectedImage, serverUrl, setUserData } =
    useContext(userDataContext);
  const [assistantName, setAssistantName] = useState(userData?.assistantName || "");
  const [assistantVoice, setAssistantVoice] = useState(userData?.assistantVoice || "auto");
  const [assistantVoiceName, setAssistantVoiceName] = useState(userData?.assistantVoiceName || "");
  const [browserVoices, setBrowserVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];

      setBrowserVoices(
        voices
          .map((voice) => ({
            id: `${voice.name}-${voice.lang}`,
            name: voice.name,
            lang: voice.lang,
          }))
          .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name))
      );
    };

    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  const handleUpdateAssistant = async () => {
    if (!assistantName.trim()) return;

    if (selectedImage === "input" && !backendImage && !userData?.assistantImage) {
      setErrorMessage("Please go back and choose an image file again.");
      return;
    }

    if (!selectedImage && !userData?.assistantImage) {
      setErrorMessage("Please choose an assistant image first.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("assistantName", assistantName.trim());
      formData.append("assistantVoice", assistantVoice);
      formData.append("assistantVoiceName", assistantVoiceName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else {
        formData.append(
          "imageUrl",
          selectedImage === "input"
            ? userData?.assistantImage || ""
            : selectedImage || userData?.assistantImage || ""
        );
      }

      const result = await axios.post(`${serverUrl}/api/user/update`, formData, {
        withCredentials: true,
      });

      setUserData(result.data);
      navigate("/");
    } catch (error) {
      console.log(error);
      setErrorMessage(error.response?.data?.message || "Could not save your assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#07111f_45%,#050816)] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="relative z-10 flex items-center justify-between py-4">
        <button
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
          onClick={() => navigate("/customize")}
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">assistant os</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Name assistant</h1>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">customize identity</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Enter your assistant name</h2>
        </div>

        <input
          className="h-12 w-full rounded-full border border-white/15 bg-black/30 px-4 text-center text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60"
          onChange={(event) => setAssistantName(event.target.value)}
          placeholder="Robin"
          required
          type="text"
          value={assistantName}
        />

        <div className="grid w-full grid-cols-3 gap-2">
          {voiceOptions.map(({ id, label, Icon }) => (
            <button
              className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition ${
                assistantVoice === id
                  ? "border-cyan-200 bg-cyan-200 text-black"
                  : "border-white/15 bg-black/30 text-white hover:border-cyan-200/60"
              }`}
              key={id}
              onClick={() => setAssistantVoice(id)}
              type="button"
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>

        <select
          className="h-12 w-full rounded-lg border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-cyan-200/60"
          onChange={(event) => setAssistantVoiceName(event.target.value)}
          value={assistantVoiceName}
        >
          <option className="bg-slate-950" value="">
            Use best matching browser voice
          </option>
          {browserVoices.map((voice) => (
            <option className="bg-slate-950" key={voice.id} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>

        {errorMessage ? (
          <p className="rounded-lg border border-red-300/20 bg-red-500/10 px-4 py-2 text-sm text-red-100">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !assistantName.trim()}
          onClick={handleUpdateAssistant}
          type="button"
        >
          <Sparkles size={18} />
          {loading ? "Creating..." : "Create assistant"}
        </button>
      </main>
    </div>
  );
}

export default Customize2;
