import axios from "axios";
import React, { useEffect, useState } from "react";
import { userDataContext as UserDataContext } from "./userDataContext";

function UserContext({ children }) {
  const serverUrl = "http://localhost:8000";
  const [userData, setUserData] = useState(null);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      setUserData(result.data);
      console.log(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getGeminiResponse = async (command, history = [], systemPrompt = "") => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/user/asktoassistant`,
        {
          command,
          history,
          systemPrompt,
        },
        { withCredentials: true }
      );
      return result.data;
    } catch (error) {
      console.log(error);
      return (
        error.response?.data || {
          type: "general",
          userInput: command,
          response: "Sorry, something went wrong. Please try again.",
        }
      );
    }
  };

  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,
    userData,
    setUserData,
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
    getGeminiResponse,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export default UserContext;
