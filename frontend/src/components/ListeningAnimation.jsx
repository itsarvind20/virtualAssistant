function ListeningAnimation({ active }) {
  return (
    <div className="flex h-12 items-end justify-center gap-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <span
          key={index}
          className={`w-2 rounded-full bg-cyan-200 transition-opacity ${
            active ? "animate-voice-bar opacity-100" : "opacity-25"
          }`}
          style={{
            height: `${14 + (index % 4) * 8}px`,
            animationDelay: `${index * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default ListeningAnimation;
