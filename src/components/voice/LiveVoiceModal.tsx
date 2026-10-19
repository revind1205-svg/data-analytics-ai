import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, PhoneCall, PhoneOff, Radio } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to Gemini 3.8 Live API...');
  const [volumeLevel, setVolumeLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleDisconnect();
      return;
    }

    startLiveSession();

    return () => {
      handleDisconnect();
    };
  }, [isOpen]);

  const startLiveSession = async () => {
    try {
      setStatusMessage('Initializing Gemini Live WebSocket...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusMessage('Live API Connected. Requesting microphone...');

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputAudioCtx;
          const source = inputAudioCtx.createMediaStreamSource(stream);
          const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (isMuted || ws.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);

            // Compute audio level for UI visualizer
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            setVolumeLevel(Math.min(100, Math.round(rms * 400)));

            // Convert Float32 to Int16 PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }

            // Base64 encode
            let binary = '';
            const bytes = new Uint8Array(pcm16.buffer);
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Audio = btoa(binary);

            ws.send(JSON.stringify({ audio: base64Audio }));
          };

          source.connect(processor);
          processor.connect(inputAudioCtx.destination);
          setStatusMessage('Listening & ready to speak with Gemini Live (Zephyr)');
        } catch (micErr) {
          console.error('Mic access error:', micErr);
          setStatusMessage('Microphone access denied or unavailable.');
        }
      };

      ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.audio && outputAudioCtxRef.current) {
            setIsSpeaking(true);
            const audioData = atob(msg.audio);
            const pcmBuffer = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              pcmBuffer[i] = audioData.charCodeAt(i);
            }

            // Convert 16-bit PCM little-endian to Float32
            const int16Array = new Int16Array(pcmBuffer.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              float32Array[i] = int16Array[i] / 32768.0;
            }

            const audioBuffer = outputAudioCtxRef.current.createBuffer(1, float32Array.length, 24000);
            audioBuffer.getChannelData(0).set(float32Array);

            const bufferSource = outputAudioCtxRef.current.createBufferSource();
            bufferSource.buffer = audioBuffer;
            bufferSource.connect(outputAudioCtxRef.current.destination);
            bufferSource.start();

            bufferSource.onended = () => {
              setIsSpeaking(false);
            };
          }
        } catch (parseErr) {
          console.error('Audio playback parse error:', parseErr);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setStatusMessage('WebSocket connection error.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusMessage('Live conversation disconnected.');
      };
    } catch (err) {
      console.error('Live session init error:', err);
      setStatusMessage('Failed to start Live API session.');
    }
  };

  const handleDisconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Gemini 3.8 Live API Voice</h3>
              <p className="text-[11px] text-slate-400">Bidirectional ultra-low-latency conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Waveform Animation */}
        <div className="p-8 flex flex-col items-center justify-center gap-6 text-center">
          {/* Animated Glowing Orb / Waveform Visualizer */}
          <div className="relative flex items-center justify-center w-36 h-36">
            <div
              style={{ transform: `scale(${1 + volumeLevel * 0.015})` }}
              className={`absolute inset-0 rounded-full transition-transform duration-75 ${
                isSpeaking
                  ? 'bg-cyan-500/30 blur-xl'
                  : isConnected
                  ? 'bg-blue-500/20 blur-lg'
                  : 'bg-slate-800 blur-sm'
              }`}
            />
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center border transition-all duration-200 z-10 ${
                isSpeaking
                  ? 'bg-cyan-950 border-cyan-400 shadow-lg shadow-cyan-500/40 text-cyan-300'
                  : isConnected
                  ? 'bg-slate-950 border-cyan-600 shadow-md text-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-600'
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="w-10 h-10 animate-pulse" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white mb-1">
              {isSpeaking ? 'Gemini is speaking...' : isConnected ? 'Gemini is listening...' : 'Connecting...'}
            </div>
            <p className="text-xs text-slate-400 font-mono max-w-sm">
              {statusMessage}
            </p>
          </div>

          {/* Real-time Voice Controls */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              disabled={!isConnected}
              className={`p-3.5 rounded-full border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-slate-850 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                handleDisconnect();
                onClose();
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-semibold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
