import React, { useContext, useState } from "react";
import axios from "axios";
import { Bot, CheckCircle2, Eye, EyeOff, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userDataContext";

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSignUp = async (event) => {
    event.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password },
        { withCredentials: true }
      );

      setUserData(result.data);
      navigate("/customize");
    } catch (error) {
      setUserData(null);
      setErr(error.response?.data?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020617] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#07111f_45%,#050816)]" />
      <div className="signup-ambient-gradient pointer-events-none absolute inset-0 opacity-35 mix-blend-screen" />
      <div className="signup-drift-band pointer-events-none absolute -left-24 top-10 h-[72vh] w-[135vw] opacity-25 blur-2xl mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-5">
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-white"
          onClick={() => navigate("/signin")}
          type="button"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-cyan-300 text-black shadow-lg shadow-cyan-950/20">
            <Bot size={18} />
          </span>
          Virtual Assistant
        </button>

        <button
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 shadow-sm backdrop-blur transition hover:bg-white/20 hover:text-white"
          onClick={() => navigate("/signin")}
          type="button"
        >
          Login
        </button>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 hidden min-h-[560px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-gradient-to-br from-white/10 via-white/[0.04] to-cyan-300/10 p-6">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-[32px] bg-cyan-300/10 rotate-12" />
            <div className="absolute bottom-10 left-8 h-24 w-24 rounded-[28px] bg-fuchsia-400/10 -rotate-12" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/60">AI workspace</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Your voice assistant, ready in minutes.
                </h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-black shadow-xl shadow-cyan-950/25">
                <Sparkles size={22} />
              </span>
            </div>

            <div className="relative mt-10 grid gap-4">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 shadow-xl shadow-black/20 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                    <MessageCircle size={21} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">Hey Robin</p>
                    <p className="text-sm text-white/55">Play the first YouTube Music result</p>
                  </div>
                </div>
                <div className="mt-5 h-2 rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300" />
                </div>
              </div>

              <div className="ml-auto w-[82%] rounded-[24px] border border-white/10 bg-black/45 p-5 text-white shadow-xl shadow-black/30">
                <p className="text-sm text-white/60">Assistant</p>
                <p className="mt-2 text-lg font-semibold">Playing your song now.</p>
              </div>
            </div>

            <div className="relative mt-auto grid grid-cols-3 gap-3">
              {["Voice wake", "Music", "Search"].map((label) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/20 backdrop-blur">
                  <CheckCircle2 className="text-emerald-300" size={19} />
                  <p className="mt-3 text-sm font-semibold text-white/85">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <form
          className="order-1 mx-auto flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
          onSubmit={handleSignUp}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/60">start free</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Create your assistant</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Set up your account, then choose the assistant image and wake name.
            </p>
          </div>

          <input
            className="h-12 rounded-full border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60 focus:ring-4 focus:ring-cyan-200/10"
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            type="text"
            value={name}
          />
          <input
            className="h-12 rounded-full border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60 focus:ring-4 focus:ring-cyan-200/10"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />

          <div className="relative">
            <input
              className="h-12 w-full rounded-full border border-white/15 bg-black/30 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60 focus:ring-4 focus:ring-cyan-200/10"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {err ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</p> : null}

          <button
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-semibold text-black shadow-xl shadow-cyan-950/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            <UserPlus size={18} />
            {loading ? "Creating..." : "Create account"}
          </button>

          <button
            className="text-sm font-medium text-white/60 transition hover:text-cyan-100"
            onClick={() => navigate("/signin")}
            type="button"
          >
            Already have an account? <span className="font-semibold text-cyan-200">Sign in</span>
          </button>
        </form>
      </main>
    </div>
  );
}

export default SignUp;
