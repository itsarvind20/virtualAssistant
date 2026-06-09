import React, { useContext, useEffect, useRef } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import image1 from "../assets/image1.png";
import image2 from "../assets/image2.jpg";
import image3 from "../assets/authBg.png";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.jpeg";
import image7 from "../assets/image7.jpeg";
import { userDataContext } from "../context/userDataContext";

function Customize() {
  const {
    frontendImage,
    selectedImage,
    userData,
    setBackendImage,
    setFrontendImage,
    setSelectedImage,
  } = useContext(userDataContext);
  const navigate = useNavigate();
  const inputImage = useRef(null);

  const handleImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!selectedImage && userData?.assistantImage) {
      setSelectedImage(userData.assistantImage);
    }
  }, [selectedImage, setSelectedImage, userData?.assistantImage]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_30%),linear-gradient(135deg,#020617,#07111f_45%,#050816)] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <header className="relative z-10 flex items-center justify-between py-4">
        <button
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
          onClick={() => navigate("/")}
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/60">assistant os</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Choose avatar</h1>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 py-8">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">customize identity</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Select your assistant image</h2>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Card image={image1} />
          <Card image={image2} />
          <Card image={image3} />
          <Card image={image4} />
          <Card image={image5} />
          <Card image={image6} />
          <Card image={image7} />

          <button
            className={`relative aspect-[3/5] w-[78px] overflow-hidden rounded-lg border bg-white/5 shadow-lg transition sm:w-[120px] lg:w-[150px] ${
              selectedImage === "input"
                ? "border-cyan-200 ring-2 ring-cyan-200/35"
                : "border-white/10 hover:border-cyan-200/70"
            }`}
            onClick={() => {
              inputImage.current?.click();
              setSelectedImage("input");
            }}
            type="button"
          >
            {frontendImage || (selectedImage === "input" && userData?.assistantImage) ? (
              <img
                alt="Uploaded assistant avatar"
                className="h-full w-full object-cover"
                src={frontendImage || userData?.assistantImage}
              />
            ) : (
              <span className="grid h-full w-full place-items-center text-white/75">
                <ImagePlus size={28} />
              </span>
            )}
          </button>
          <input accept="image/*" hidden onChange={handleImage} ref={inputImage} type="file" />
        </div>

        {selectedImage ? (
          <button
            className="inline-flex h-12 min-w-36 items-center justify-center rounded-full bg-cyan-300 px-6 text-sm font-semibold text-black transition hover:bg-cyan-200"
            onClick={() => navigate("/customize2")}
            type="button"
          >
            Next
          </button>
        ) : null}
      </main>
    </div>
  );
}

export default Customize;
