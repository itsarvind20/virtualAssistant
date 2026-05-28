import React, { useContext } from "react";
import { Check } from "lucide-react";
import { userDataContext } from "../context/userDataContext";

function Card({ image }) {
  const { selectedImage, setBackendImage, setFrontendImage, setSelectedImage } =
    useContext(userDataContext);
  const selected = selectedImage === image;

  return (
    <button
      className={`group relative aspect-[3/5] w-[78px] overflow-hidden rounded-lg border bg-white/5 shadow-lg transition sm:w-[120px] lg:w-[150px] ${
        selected
          ? "border-cyan-200 ring-2 ring-cyan-200/35"
          : "border-white/10 hover:border-cyan-200/70"
      }`}
      onClick={() => {
        setSelectedImage(image);
        setBackendImage(null);
        setFrontendImage(null);
      }}
      type="button"
    >
      <img
        alt="Assistant avatar option"
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        src={image}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      {selected ? (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-cyan-300 text-black">
          <Check size={16} />
        </span>
      ) : null}
    </button>
  );
}

export default Card;
