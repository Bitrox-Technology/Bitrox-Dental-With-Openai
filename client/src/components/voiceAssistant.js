import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const WS_URL = 'ws://localhost:8000';

const VoiceAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const { sendMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: (connection) => console.log('WebSocket connection established.', connection),
    onMessage: (message) => {
      console.log('Audio response received', message.data);
      convertTextToSpeech(message.data)
      setMessages((prevMessages) => [...prevMessages, message.data]);
    },
    // onClose: () => console.log('WebSocket connection closed.'),
    shouldReconnect: () => true,
  });
// const availableVoices = window.speechSynthesis.getVoices();
//   console.log( availableVoices)

  const convertTextToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      
      const utterance = new SpeechSynthesisUtterance(text);
      console.log(utterance)
      utterance.lang = "en-US";
      speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support Text-to-Speech.");
    }
  };

  // Speech recognition hook
  const { transcript, resetTranscript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // if ('brave' in navigator) {     document.getElementById('voice-search-button').style.display = 'none'; }

  useEffect(() => {
    if (transcript) {
      console.log('Transcript:', transcript);
    }
  }, [transcript]);

  if (!browserSupportsSpeechRecognition) {
    return <p>Your browser does not support speech recognition.</p>;
  }

  const handleStartListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const handleStopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();

    console.log(transcript)

    if (transcript.trim()) {
      setMessages((prevMessages) => [...prevMessages, `You: ${transcript}`]);
      sendMessage(transcript); // Send the transcribed text to the server
      resetTranscript();
    }
  };



  const connectionStatus = {
    0: 'Connecting',
    1: 'Open',
    2: 'Closing',
    3: 'Closed',
  }[readyState];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Voice Assistant</h1>
      <p>Status: {connectionStatus}</p>

      <p>Microphone: {listening ? 'on' : 'off'}</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          // onTouchStart={startListening}
          // onMouseDown={startListening}
          onTouchEnd={SpeechRecognition.stopListening}
          onMouseUp={SpeechRecognition.stopListening}
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={readyState !== 1}
        >
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </button>
      </div>

      <div>
        <h2>Transcript:</h2>
        <p>{transcript}</p>
      </div>

      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VoiceAssistant;
