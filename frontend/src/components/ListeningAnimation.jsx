function ListeningAnimation({ active }) {
  return (
    <div className="flex h-8 shrink-0 items-end justify-center gap-1.5">
      {Array.from({ length: 7 }).map((_, index) => (
        <span
          key={index}
          className={`w-2 rounded-full bg-cyan-200 transition-opacity ${
            active ? "animate-voice-bar opacity-100" : "opacity-25"
          }`}
          style={{
            height: `${10 + (index % 4) * 6}px`,
            animationDelay: `${index * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default ListeningAnimation;
