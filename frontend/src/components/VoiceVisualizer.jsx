function VoiceVisualizer({ text, state }) {
  const active = ["listening", "thinking", "speaking", "waking"].includes(state);

  return (
    <div className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-100/70">
        <span>{state}</span>
        <span>{active ? "online" : "standby"}</span>
      </div>
      <div className="flex h-7 items-center gap-1">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            className={`flex-1 rounded-full bg-cyan-300/80 ${
              active ? "animate-wave" : ""
            }`}
            style={{
              height: `${10 + ((index * 7) % 18)}px`,
              animationDelay: `${index * 35}ms`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 min-h-5 truncate text-xs text-white/70 sm:text-sm">
        {text || "Awaiting wake phrase..."}
      </p>
    </div>
  );
}

export default VoiceVisualizer;
