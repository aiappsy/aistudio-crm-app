import React, { createContext, useContext, useState, ReactNode } from 'react';

type VoiceContextType = {
  voiceMode: boolean;
  setVoiceMode: (mode: boolean) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
};

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voiceMode, setVoiceMode] = useState(true);
  const [isListening, setIsListening] = useState(false);

  return (
    <VoiceContext.Provider value={{ voiceMode, setVoiceMode, isListening, setIsListening }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
