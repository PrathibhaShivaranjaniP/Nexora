import { useState, useCallback } from 'react';
import { useHospitalStore } from '../store/hospitalStore';
import { sound } from '../utils/audioEngine';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { setSpatialTier } = useHospitalStore();

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const recognizedText = event.results[current][0].transcript.toLowerCase();
      setTranscript(recognizedText);
      sound.playTactileClick();

      if (recognizedText.includes('district')) {
        setSpatialTier(2);
      } else if (recognizedText.includes('hospital') || recognizedText.includes('ward')) {
        setSpatialTier(3);
      } else if (recognizedText.includes('globe') || recognizedText.includes('national')) {
        setSpatialTier(1);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [setSpatialTier]);

  return { isListening, startListening, transcript };
}
