import React, { useContext, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userDataContext";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSignIn = async (event) => {
    event.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { withCredentials: true }
      );

      setUserData(result.data);
      navigate("/");
    } catch (error) {
      setUserData(null);
      setErr(error.response?.data?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#07111f_45%,#050816)] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <form
        className="relative z-10 flex w-full max-w-md flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8"
        onSubmit={handleSignIn}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">assistant os</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Sign in</h1>
        </div>

        <input
          className="h-12 rounded-full border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />

        <div className="relative">
          <input
            className="h-12 w-full rounded-full border border-white/15 bg-black/30 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-cyan-200/60"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {err ? <p className="text-sm text-red-300">{err}</p> : null}

        <button
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          <LogIn size={18} />
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          className="text-sm text-white/70 transition hover:text-cyan-100"
          onClick={() => navigate("/signup")}
          type="button"
        >
          Need an account? <span className="text-cyan-200">Sign up</span>
        </button>
      </form>
    </div>
  );
}

export default SignIn;
