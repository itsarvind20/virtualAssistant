import { motion } from "framer-motion";

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
  return (
    <div className="relative grid h-52 w-52 place-items-center sm:h-64 sm:w-64">
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

      <div className="relative h-40 w-40 overflow-hidden rounded-full border border-white/30 bg-black/50 shadow-[0_0_80px_rgba(34,211,238,0.35)] sm:h-48 sm:w-48">
        {image ? (
          <img className="h-full w-full object-cover" src={image} alt={name} />
        ) : (
          <div className="h-full w-full bg-black" />
        )}
      </div>
    </div>
  );
}

export default AssistantOrb;
