import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Search, 
  MapPin, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink,
  ChevronDown,
  Layers,
  SlidersHorizontal
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: Array<{ title: string; url: string }>;
  places?: any[];
  modelUsed?: string;
}

interface GeminiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToPrompt?: (text: string) => void;
}

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  onInsertToPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_init',
      role: 'model',
      text: 'Welcome to the Gemini Multi-Turn Assistant. I can help synthesize workflows, audit schemas, ground architectures with live Google Search & Maps data, or transcribe your voice notes.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.1-flash-lite');
  const [systemRole, setSystemRole] = useState('Principal Distributed Systems Architect');
  const [isSearchGrounding, setIsSearchGrounding] = useState(false);
  const [isMapsGrounding, setIsMapsGrounding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Audio Recording & Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Copied state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      if (isSearchGrounding) {
        // Query search grounding endpoint
        const response = await fetch('/api/gemini/search-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await response.json();
        const modelMessage: ChatMessage = {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.text || 'Search grounding complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || [],
          modelUsed: 'gemini-3.1-flash-lite (Search Grounded)',
        };
        setMessages((prev) => [...prev, modelMessage]);
      } else if (isMapsGrounding) {
        // Query maps grounding endpoint
        const response = await fetch('/api/gemini/maps-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await response.json();
        const modelMessage: ChatMessage = {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.text || 'Maps grounding complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          places: data.places || [],
          modelUsed: 'gemini-3.1-flash-lite (Maps Grounded)',
        };
        setMessages((prev) => [...prev, modelMessage]);
      } else {
        // Multi-turn chat endpoint
        const conversationHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            model: selectedModel,
            systemInstruction: `You are a ${systemRole}. Provide clear, authoritative, highly structured advice with markdown diagrams and code blocks when appropriate.`,
          }),
        });

        const data = await response.json();
        const modelMessage: ChatMessage = {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.reply || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        };
        setMessages((prev) => [...prev, modelMessage]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: 'Sorry, I encountered an issue fulfilling that request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Recording with gemini-3.5-transcribe
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsTranscribing(true);

          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              const response = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ base64Audio: base64Data, mimeType: 'audio/webm' }),
              });
              const data = await response.json();
              if (data.transcript) {
                setInputText(data.transcript);
              }
              setIsTranscribing(false);
            };
            reader.readAsDataURL(audioBlob);
          } catch (err) {
            console.error('Transcription error:', err);
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">Gemini Multi-Turn Advisor</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-mono text-cyan-400">{selectedModel}</span>
              <span>·</span>
              <span>Grounding & Voice</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model & Grounding Controls Toolbar */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-[11px] text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast & Reliable)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex Thinking)</option>
          </select>
        </div>

        {/* Grounding Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsSearchGrounding(!isSearchGrounding);
              if (!isSearchGrounding) setIsMapsGrounding(false);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              isSearchGrounding
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Ground with Google Search data"
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
          </button>

          <button
            onClick={() => {
              setIsMapsGrounding(!isMapsGrounding);
              if (!isMapsGrounding) setIsSearchGrounding(false);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              isMapsGrounding
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Ground with Google Maps data"
          >
            <MapPin className="w-3 h-3" />
            <span>Maps</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 max-w-[90%] text-xs ${
              msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <div
              className={`p-3.5 rounded-2xl leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Search Grounding Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    <Search className="w-3 h-3 text-cyan-400" />
                    <span>Search Grounding Sources:</span>
                  </span>
                  {msg.sources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-mono">
              <span>{msg.timestamp}</span>
              {msg.modelUsed && <span>· {msg.modelUsed}</span>}
              <button
                onClick={() => handleCopyMessage(msg.id, msg.text)}
                className="hover:text-slate-300 cursor-pointer ml-1"
                title="Copy message"
              >
                {copiedId === msg.id ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="mr-auto p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Gemini reasoning...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with Audio Transcription Microphone */}
      <div className="p-3 border-t border-slate-800 bg-slate-850 flex flex-col gap-2">
        {isRecording && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Recording audio... Click mic to transcribe</span>
            </div>
            <button
              onClick={handleToggleRecording}
              className="text-xs font-semibold text-rose-300 hover:text-white"
            >
              Stop & Transcribe
            </button>
          </div>
        )}

        {isTranscribing && (
          <div className="px-3 py-1.5 bg-cyan-950/80 border border-cyan-800 rounded-lg text-xs text-cyan-300 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transcribing with gemini-3.5-transcribe...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Audio Transcription Mic Button */}
          <button
            onClick={handleToggleRecording}
            className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
            title={isRecording ? 'Stop & Transcribe' : 'Transcribe speech with gemini-3.5-transcribe'}
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isSearchGrounding
                ? 'Search grounded query...'
                : isMapsGrounding
                ? 'Maps grounded query...'
                : 'Ask Gemini anything...'
            }
            className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
