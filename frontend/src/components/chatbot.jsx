import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, ArrowLeft, User, Bot, RotateCcw, Mic, MicOff } from 'lucide-react';
import axios from 'axios';

// API configuration
const API_URL = 'http://localhost:8000';

const ChatbotInterface = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const chatEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const initialMessages = [
    {
      type: 'bot',
      content: 'Hello! I\'m AcreVault+ AI assistant. How can I help you today?',
      timestamp: getCurrentTime()
    }
  ];

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleVoiceInput(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleVoiceInput = async (audioBlob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', audioBlob);

    try {
      const response = await axios.post(`${API_URL}/voice-input`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add user's transcribed message
      const userMessage = {
        type: 'user',
        content: response.data.transcribed_text || 'Voice input',
        timestamp: getCurrentTime()
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);

      // Add bot's response
      const botMessage = {
        type: 'bot',
        content: response.data.text_response,
        timestamp: getCurrentTime(),
        audioUrl: `${API_URL}/audio/${response.data.audio_file_path}`
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Play audio response
      if (response.data.audio_file_path) {
        const audio = new Audio(`${API_URL}/audio/${response.data.audio_file_path}`);
        audio.play();
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your voice input. Please try again.',
        timestamp: getCurrentTime()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: 'user',
      content: message,
      timestamp: getCurrentTime()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: message
      });
      
      const botMessage = {
        type: 'bot',
        content: response.data.text_response,
        timestamp: getCurrentTime(),
        audioUrl: `${API_URL}/audio/${response.data.audio_file_path}`
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Play audio response
      if (response.data.audio_file_path) {
        const audio = new Audio(message.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Error getting response:', error);
      
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: getCurrentTime()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = async () => {
    try {
      await axios.post(`${API_URL}/reset`);
      setMessages(initialMessages);
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMinimized(false)}
          className="w-16 h-16 rounded-full bg-indigo-600 shadow-lg hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center"
        >
          <Bot className="w-8 h-8 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-xl overflow-hidden w-96 max-h-[600px] bg-white border border-indigo-100">
      {/* Header */}
      <div className="p-3 bg-indigo-600 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6" />
          <span className="font-semibold text-lg">AcreVault+ AI</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={resetChat}
            className="p-1 hover:bg-indigo-500 rounded-full transition"
            title="Reset Chat"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-indigo-500 rounded-full transition"
            title="Minimize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-3 bg-indigo-50">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] order-2">
              <div className="flex items-start space-x-2 flex-row">
                <div className="p-3 rounded-lg bg-white text-gray-800 rounded-tl-none shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-600">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-indigo-100">
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-indigo-600'} text-white`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="flex-1 p-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-4"
            disabled={isLoading || isRecording}
          />
          <button 
            className={`p-2 rounded-full ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-colors`}
            onClick={handleSendMessage}
            disabled={isLoading || isRecording}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {isRecording && (
          <div className="flex items-center mt-2 text-xs text-red-500 animate-pulse">
            <span>Recording voice...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isBot = message.type === 'bot';
  
  const playAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play();
    }
  };
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-start space-x-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`
            p-3 rounded-lg shadow-sm
            ${isBot ? 'bg-white text-gray-800' : 'bg-indigo-600 text-white'}
            ${isBot ? 'rounded-tl-none' : 'rounded-tr-none'}
          `}>
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            {isBot && message.audioUrl && (
              <button 
                onClick={playAudio}
                className="mt-2 text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                <span className="text-xs">Play audio</span>
              </button>
            )}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${isBot ? 'bg-indigo-600' : 'bg-gray-200'}
          `}>
            {isBot ? 
              <Bot className="w-5 h-5 text-white" /> :
              <User className="w-5 h-5 text-gray-600" />
            }
          </div>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isBot ? 'ml-2' : 'mr-2 text-right'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};



export default ChatbotInterface;