import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import userImg from "../assets/user.gif"

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()

  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")

  const recognitionRef = useRef(null)
  const isSpeakingRef = useRef(false)

  const synth = window.speechSynthesis

  // ✅ LOGOUT
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  // ✅ SPEAK FUNCTION
  const speak = (text) => {
    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-US"

    isSpeakingRef.current = true

    utterance.onend = () => {
      isSpeakingRef.current = false
    }

    synth.cancel()
    synth.speak(utterance)
  }

  // ✅ HANDLE COMMANDS
  const handleCommand = (data) => {
    const { type, userInput, response } = data

    setAiText(response)
    speak(response)

    if (type === 'google-search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, '_blank')
    }

    if (type === 'youtube-search' || type === 'youtube-play') {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(userInput)}`, '_blank')
    }

    if (type === 'calculator-open') {
      window.open(`https://www.google.com/search?q=calculator`, '_blank')
    }

    if (type === 'instagram-open') {
      window.open(`https://www.instagram.com/`, '_blank')
    }

    if (type === 'facebook-open') {
      window.open(`https://www.facebook.com/`, '_blank')
    }

    if (type === 'weather-show') {
      window.open(`https://www.google.com/search?q=weather`, '_blank')
    }
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Use Google Chrome for Speech Recognition")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognitionRef.current = recognition

    // ✅ START LISTENING (after 1 user click anywhere)
    const startOnce = () => {
      try {
        recognition.start()
        console.log("Mic started after user interaction")
      } catch (e) {
        console.log("Already started")
      }
    }

    document.addEventListener("click", startOnce, { once: true })

    // ✅ EVENTS
    recognition.onstart = () => {
      console.log("Listening...")
      setListening(true)
    }

    recognition.onend = () => {
      console.log("Restarting mic...")
      setListening(false)

      if (!isSpeakingRef.current) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {}
        }, 1000)
      }
    }

    recognition.onerror = (event) => {
      console.log("Error:", event.error)
      setListening(false)

      if (!isSpeakingRef.current) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {}
        }, 1500)
      }
    }

    // ✅ WAKE WORD DETECTION
    recognition.onresult = async (e) => {
      const transcript =
        e.results[e.results.length - 1][0].transcript.trim().toLowerCase()

      console.log("Heard:", transcript)

      const assistantName = userData?.assistantName?.toLowerCase()

      if (assistantName && transcript.includes(assistantName)) {
        console.log("Wake word detected!")

        setUserText(transcript)

        // remove assistant name from command
        const cleanText = transcript.replace(assistantName, "").trim()

        try {
          const data = await getGeminiResponse(cleanText || transcript)
          handleCommand(data)
        } catch (err) {
          console.log(err)
        }
      }
    }

    // ✅ GREETING
    const greeting = new SpeechSynthesisUtterance(
      `Hello ${userData?.name || "User"}, say ${userData?.assistantName} to wake me up`
    )
    greeting.lang = "en-US"
    synth.speak(greeting)

    return () => {
      recognition.stop()
    }
  }, [])

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-black to-[#02023d] flex flex-col items-center justify-center gap-4'>

      {/* Logout */}
       <button className='absolute top-20 right-5 min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>

      <button
        onClick={handleLogOut}
        className='absolute top-5 right-5 bg-white px-5 py-2 rounded-full font-semibold'
      >
        Logout
      </button>

      {/* Assistant Image */}
      <div className='w-[250px] h-[300px] rounded-xl overflow-hidden shadow-lg'>
        <img src={userData?.assistantImage} className='h-full w-full object-cover' />
      </div>

      <h1 className='text-white text-lg'>I'm {userData?.assistantName}</h1>

      {/* Avatar */}
      {!aiText && <img src={userImg} className='w-[150px]' />}
      {aiText && <img src={aiImg} className='w-[150px]' />}

      {/* Text */}
      <h2 className='text-white text-center px-4'>
        {userText || aiText}
      </h2>

      {/* Status */}
      <p className='text-white'>
        {listening ? "🎤 Listening (Say assistant name...)" : ""}
      </p>

    </div>
  )
}

export default Home