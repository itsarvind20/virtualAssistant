function VoiceVisualizer({ text, state }) {
  const active = ["listening", "thinking", "speaking", "waking"].includes(state);

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-cyan-100/70">
        <span>{state}</span>
        <span>{active ? "online" : "standby"}</span>
      </div>
      <div className="flex h-10 items-center gap-1">
        {Array.from({ length: 36 }).map((_, index) => (
          <span
            key={index}
            className={`flex-1 rounded-full bg-cyan-300/80 ${
              active ? "animate-wave" : ""
            }`}
            style={{
              height: `${15 + ((index * 7) % 26)}px`,
              animationDelay: `${index * 35}ms`,
            }}
          />
        ))}
      </div>
      <p className="mt-3 min-h-6 truncate text-sm text-white/70">
        {text || "Awaiting wake phrase..."}
      </p>
    </div>
  );
}

export default VoiceVisualizer;
