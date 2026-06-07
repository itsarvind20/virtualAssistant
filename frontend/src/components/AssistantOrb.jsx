import { motion } from "framer-motion";
import { useState } from "react";

const MotionDiv = motion.div;

const stateColor = {
  idle: "from-cyan-300 via-sky-500 to-indigo-500",
  waking: "from-emerald-300 via-cyan-400 to-blue-500",
  listening: "from-lime-300 via-emerald-400 to-cyan-500",
  thinking: "from-amber-300 via-fuchsia-400 to-sky-500",
  speaking: "from-pink-300 via-violet-400 to-cyan-400",
  sleeping: "from-slate-500 via-slate-700 to-black",
};

const stateScale = {
  idle: [1, 1.02, 1],
  waking: [1, 1.08, 1],
  listening: [1, 1.12, 1.03],
  thinking: [1, 1.04, 0.98],
  speaking: [1, 1.1, 1],
  sleeping: [0.96, 1, 0.96],
};

function AssistantOrb({ state, image, name }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(image) && !imageFailed;
  const initial = name?.trim()?.[0]?.toUpperCase() || "A";

  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center sm:h-44 sm:w-44 lg:h-48 lg:w-48">
      <MotionDiv
        animate={{
          scale: stateScale[state] || stateScale.idle,
          rotate: state === "thinking" ? [0, 10, -8, 0] : 0,
        }}
        transition={{
          duration: state === "sleeping" ? 4 : 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 rounded-full bg-gradient-to-br ${
          stateColor[state] || stateColor.idle
        } opacity-80 blur-xl`}
      />

      <MotionDiv
        animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.16, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-3 rounded-full border border-cyan-200/40"
      />

      <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border border-white/30 bg-slate-950/80 shadow-[0_0_64px_rgba(34,211,238,0.35)] sm:h-36 sm:w-36">
        {showImage ? (
          <img
            className="h-full w-full object-cover"
            src={image}
            alt={name || "Assistant avatar"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_35%_25%,rgba(34,211,238,0.35),transparent_32%),linear-gradient(135deg,#0f172a,#020617)] text-4xl font-semibold text-cyan-100 sm:text-5xl">
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssistantOrb;
