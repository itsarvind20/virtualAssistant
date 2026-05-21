/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";

export const AssistantContext = createContext(null);

export const AssistantProvider = ({ value, children }) => (
  <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
);

export const useAssistant = () => {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error("useAssistant must be used inside AssistantProvider");
  }

  return context;
};
