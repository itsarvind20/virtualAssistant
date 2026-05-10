import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";

function Home() {

  const {
    userData,
    serverUrl,
    setUserData,
    getGeminiResponse
  } = useContext(userDataContext);

  const navigate = useNavigate();



  // =========================================
  // STATES
  // =========================================

  const [listening, setListening] =
    useState(false);

  const [aiText, setAiText] =
    useState("");



  // =========================================
  // EMAIL STATES
  // =========================================

  const [emailMode, setEmailMode] =
    useState(false);

  const [emailStep, setEmailStep] =
    useState("");

  const [emailData, setEmailData] =
    useState({

      to: "",

      subject: "",

      message: ""
    });



  // =========================================
  // REFS
  // =========================================

  const recognitionRef = useRef(null);

  const isSpeakingRef = useRef(false);

  const isRecognitionActiveRef =
    useRef(false);

  const synth = window.speechSynthesis;



  // =========================================
  // LOGOUT
  // =========================================

  const handleLogOut = async () => {

    try {

      await axios.get(

        `${serverUrl}/api/auth/logout`,

        {
          withCredentials: true
        }
      );

      setUserData(null);

      navigate("/signin");

    } catch (error) {

      console.log(error);

      setUserData(null);
    }
  };



  // =========================================
  // SPEAK FUNCTION
  // =========================================

  const speak = (text) => {

    if (!text) return;

    synth.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";

    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.volume = 1;

    isSpeakingRef.current = true;

    utterance.onstart = () => {

      try {

        recognitionRef.current?.stop();

      } catch {}
    };

    utterance.onend = () => {

      isSpeakingRef.current = false;

      setTimeout(() => {

        startRecognition();

      }, 500);
    };

    synth.speak(utterance);
  };



  // =========================================
  // START RECOGNITION
  // =========================================

  const startRecognition = () => {

    if (
      !recognitionRef.current ||
      isRecognitionActiveRef.current
    ) return;

    try {

      recognitionRef.current.start();

      isRecognitionActiveRef.current = true;

    } catch (error) {

      console.log(error);
    }
  };



  // =========================================
  // STOP RECOGNITION
  // =========================================

  const stopRecognition = () => {

    try {

      recognitionRef.current?.stop();

      isRecognitionActiveRef.current = false;

    } catch {}
  };



  // =========================================
  // HANDLE COMMANDS
  // =========================================

  const handleCommand = (data) => {

    const {
      type,
      userInput,
      response
    } = data;

    setAiText(response);

    speak(response);



    // =====================================
    // EMAIL MODE
    // =====================================

    if (type === "send-email") {

      setEmailMode(true);

      setEmailStep("to");

      speak("Tell me recipient email");

      return;
    }



    // =====================================
    // GOOGLE SEARCH
    // =====================================

    if (type === "google-search") {

      window.open(

        `https://www.google.com/search?q=${encodeURIComponent(userInput)}`,

        "_blank"
      );
    }



    // =====================================
    // YOUTUBE
    // =====================================

    if (
      type === "youtube-search" ||
      type === "youtube-play"
    ) {

      window.open(

        `https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`,

        "_blank"
      );
    }



    // =====================================
    // CALCULATOR
    // =====================================

    if (type === "calculator-open") {

      window.open(

        `https://www.google.com/search?q=calculator`,

        "_blank"
      );
    }



    // =====================================
    // INSTAGRAM
    // =====================================

    if (type === "instagram-open") {

      window.open(

        `https://instagram.com`,

        "_blank"
      );
    }



    // =====================================
    // FACEBOOK
    // =====================================

    if (type === "facebook-open") {

      window.open(

        `https://facebook.com`,

        "_blank"
      );
    }



    // =====================================
    // WEATHER
    // =====================================

    if (type === "weather-show") {

      window.open(

        `https://www.google.com/search?q=weather`,

        "_blank"
      );
    }
  };



  // =========================================
  // CLEAN COMMAND
  // =========================================

  const cleanCommand = (text) => {

    return text
      .toLowerCase()
      .replace(/[^\w\s@.]/gi, "")
      .trim();
  };



  // =========================================
  // USE EFFECT
  // =========================================

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      alert("Please use Google Chrome");

      return;
    }



    // =====================================
    // CREATE RECOGNITION
    // =====================================

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "en-IN";

    recognition.maxAlternatives = 3;

    recognitionRef.current =
      recognition;



    // =====================================
    // START AFTER USER CLICK
    // =====================================

    const startOnce = () => {

      startRecognition();

      document.removeEventListener(
        "click",
        startOnce
      );
    };

    document.addEventListener(
      "click",
      startOnce
    );



    // =====================================
    // ON START
    // =====================================

    recognition.onstart = () => {

      setListening(true);

      isRecognitionActiveRef.current = true;
    };



    // =====================================
    // ON END
    // =====================================

    recognition.onend = () => {

      setListening(false);

      isRecognitionActiveRef.current = false;

      if (!isSpeakingRef.current) {

        setTimeout(() => {

          startRecognition();

        }, 1000);
      }
    };



    // =====================================
    // ON ERROR
    // =====================================

    recognition.onerror = (event) => {

      console.log(event.error);

      setListening(false);

      isRecognitionActiveRef.current = false;

      if (!isSpeakingRef.current) {

        setTimeout(() => {

          startRecognition();

        }, 1500);
      }
    };



    // =====================================
    // ON RESULT
    // =====================================

    recognition.onresult = async (
      event
    ) => {

      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const transcript =
          event.results[i][0].transcript;

        if (
          event.results[i].isFinal
        ) {

          finalTranscript += transcript;
        }
      }

      if (!finalTranscript.trim())
        return;

      const cleanedText =
        cleanCommand(finalTranscript);

      console.log(cleanedText);



      // =====================================
      // EMAIL FLOW
      // =====================================

      if (emailMode) {

        // EMAIL

        if (emailStep === "to") {

          setEmailData(prev => ({

            ...prev,

            to: cleanedText
          }));

          setEmailStep("subject");

          speak("Tell me subject");

          return;
        }



        // SUBJECT

        if (emailStep === "subject") {

          setEmailData(prev => ({

            ...prev,

            subject: cleanedText
          }));

          setEmailStep("message");

          speak("Tell me message");

          return;
        }



        // MESSAGE

        if (emailStep === "message") {

          const finalEmailData = {

            ...emailData,

            message: cleanedText
          };

          try {

            speak("Sending email");

            await axios.post(

              `${serverUrl}/api/user/send-email`,

              finalEmailData,

              {
                withCredentials: true
              }
            );

            speak(
              "Email sent successfully"
            );

            setAiText(
              "Email sent successfully"
            );

          } catch (error) {

            console.log(error);

            speak(
              "Failed to send email"
            );
          }

          setEmailMode(false);

          setEmailStep("");

          setEmailData({

            to: "",

            subject: "",

            message: ""
          });

          return;
        }
      }



      // =====================================
      // WAKE WORD DETECTION
      // =====================================

      const assistantName =
        userData?.assistantName
          ?.toLowerCase();

      if (
        assistantName &&
        cleanedText.includes(
          assistantName
        )
      ) {

        const command =
          cleanedText
            .replace(
              assistantName,
              ""
            )
            .trim();

        if (!command) {

          speak("Yes?");
          return;
        }

        try {

          stopRecognition();

          const data =
            await getGeminiResponse(
              command
            );

          handleCommand(data);

        } catch (error) {

          console.log(error);

          speak(
            "Sorry, something went wrong"
          );
        }
      }
    };



    // =====================================
    // GREETING
    // =====================================

    const greeting =
      new SpeechSynthesisUtterance(

        `Hello ${userData?.name || "User"}, say ${userData?.assistantName} to wake me up`
      );

    greeting.lang = "en-IN";

    synth.speak(greeting);



    // =====================================
    // CLEANUP
    // =====================================

    return () => {

      stopRecognition();

      synth.cancel();
    };

  }, [emailMode, emailStep, emailData]);



  return (

    <div className='w-full h-[100vh] bg-gradient-to-t from-black to-[#02023d] flex flex-col items-center justify-center gap-4 overflow-hidden'>

      {/* CUSTOMIZE */}

      <button
        className='absolute top-20 right-5 min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hover:scale-105 transition-all duration-300'
        onClick={() => navigate("/customize")}
      >
        Customize
      </button>



      {/* LOGOUT */}

      <button
        onClick={handleLogOut}
        className='absolute top-5 right-5 bg-white px-5 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-300'
      >
        Logout
      </button>



      {/* ASSISTANT IMAGE */}

      <div className='w-[250px] h-[300px] rounded-3xl overflow-hidden shadow-2xl border border-white/20'>

        <img
          src={userData?.assistantImage}
          className='h-full w-full object-cover'
        />
      </div>



      {/* ASSISTANT NAME */}

      <h1 className='text-white text-2xl font-semibold tracking-wide'>

        {userData?.assistantName}
      </h1>



      {/* GIF */}

      {!aiText ? (

        <img
          src={userImg}
          className='w-[140px]'
        />

      ) : (

        <img
          src={aiImg}
          className='w-[140px]'
        />
      )}



      {/* AI TEXT */}

      <h2 className='text-white text-center px-6 max-w-[700px] text-lg font-light leading-8 min-h-[70px]'>

        {aiText}
      </h2>



      {/* VOICE ANIMATION */}

      <div className='flex items-center justify-center mt-2 h-[40px]'>

        {listening && (

          <div className='flex gap-2 items-end h-[40px]'>

            <span className='w-2 bg-white rounded-full animate-bounce h-3'></span>

            <span
              className='w-2 bg-white rounded-full animate-bounce h-6'
              style={{ animationDelay: "0.1s" }}
            ></span>

            <span
              className='w-2 bg-white rounded-full animate-bounce h-10'
              style={{ animationDelay: "0.2s" }}
            ></span>

            <span
              className='w-2 bg-white rounded-full animate-bounce h-6'
              style={{ animationDelay: "0.3s" }}
            ></span>

            <span
              className='w-2 bg-white rounded-full animate-bounce h-3'
              style={{ animationDelay: "0.4s" }}
            ></span>

          </div>
        )}
      </div>

    </div>
  );
}

export default Home;