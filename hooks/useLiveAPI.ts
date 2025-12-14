import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, TranscriptionItem } from '../types';
import { base64ToUint8Array, createPcmBlob, decodeAudioData } from '../utils/audio';

// Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface UseLiveAPIProps {
  onVolumeChange?: (inputVol: number, outputVol: number) => void;
}

interface ConnectConfig {
  systemInstruction?: string;
  voiceName?: string;
}

export const useLiveAPI = ({ onVolumeChange }: UseLiveAPIProps = {}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Audio Contexts & Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // State Refs for avoiding stale closures in callbacks
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Transcription Buffers
  const currentInputTranscription = useRef<string>('');
  const currentOutputTranscription = useRef<string>('');

  const disconnect = useCallback(async () => {
    if (connectionState === ConnectionState.DISCONNECTED) return;

    setConnectionState(ConnectionState.DISCONNECTED);

    // Stop animation loop
    if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }

    // Stop all playing audio
    audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();

    // Close Audio Contexts
    if (inputAudioContextRef.current) {
        await inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        await outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }

    // Close Session if possible
    sessionPromiseRef.current = null;
    
    // Reset state
    nextStartTimeRef.current = 0;
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';
  }, [connectionState]);

  const connect = useCallback(async (config?: ConnectConfig) => {
    try {
        setConnectionState(ConnectionState.CONNECTING);
        setError(null);

        // 1. Initialize Audio Contexts
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: INPUT_SAMPLE_RATE,
        });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: OUTPUT_SAMPLE_RATE,
        });
        
        // Output Chain: Source -> Analyser -> Gain -> Destination
        outputGainNodeRef.current = outputAudioContextRef.current.createGain();
        outputAnalyserRef.current = outputAudioContextRef.current.createAnalyser();
        outputAnalyserRef.current.fftSize = 32;
        outputAnalyserRef.current.smoothingTimeConstant = 0.5;
        
        outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

        // 2. Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 3. Setup Input Processing
        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
        inputSourceRef.current = source;
        
        inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
        inputAnalyserRef.current.fftSize = 32;
        source.connect(inputAnalyserRef.current);

        const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioContextRef.current.destination);

        // 4. Initialize Gemini Client
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 5. Connect to Live API
        const sessionPromise = ai.live.connect({
            model: MODEL_NAME,
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: config?.systemInstruction || "You are a helpful assistant.",
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: config?.voiceName || 'Kore' } },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    console.log("Session Opened");
                    setConnectionState(ConnectionState.CONNECTED);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Audio Output
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current && outputGainNodeRef.current && outputAnalyserRef.current) {
                        try {
                            const ctx = outputAudioContextRef.current;
                            const audioData = base64ToUint8Array(base64Audio);
                            const audioBuffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE);
                            
                            // Scheduling
                            const now = ctx.currentTime;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            
                            // Connect to Analyser first, then Gain
                            source.connect(outputAnalyserRef.current);
                            outputAnalyserRef.current.connect(outputGainNodeRef.current);
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            
                            audioSourcesRef.current.add(source);
                            source.onended = () => {
                                audioSourcesRef.current.delete(source);
                            };
                        } catch (err) {
                            console.error("Audio decode error", err);
                        }
                    }

                    // Handle Transcriptions
                    const serverContent = message.serverContent;
                    if (serverContent) {
                        if (serverContent.outputTranscription?.text) {
                            currentOutputTranscription.current += serverContent.outputTranscription.text;
                        }
                        if (serverContent.inputTranscription?.text) {
                            currentInputTranscription.current += serverContent.inputTranscription.text;
                        }

                        if (serverContent.turnComplete) {
                            const newItems: TranscriptionItem[] = [];
                            if (currentInputTranscription.current) {
                                newItems.push({
                                    text: currentInputTranscription.current,
                                    sender: 'user',
                                    timestamp: new Date()
                                });
                                currentInputTranscription.current = '';
                            }
                            if (currentOutputTranscription.current) {
                                newItems.push({
                                    text: currentOutputTranscription.current,
                                    sender: 'model',
                                    timestamp: new Date()
                                });
                                currentOutputTranscription.current = '';
                            }
                            if (newItems.length > 0) {
                                setTranscripts(prev => [...prev, ...newItems]);
                            }
                        }
                    }

                    // Handle Interruption
                    if (serverContent?.interrupted) {
                         audioSourcesRef.current.forEach(s => s.stop());
                         audioSourcesRef.current.clear();
                         nextStartTimeRef.current = 0;
                         currentOutputTranscription.current = '';
                    }
                },
                onclose: () => {
                    console.log("Session Closed");
                    setConnectionState(ConnectionState.DISCONNECTED);
                },
                onerror: (err) => {
                    console.error("Session Error", err);
                    setError(err.message || "Unknown error occurred");
                    setConnectionState(ConnectionState.ERROR);
                }
            }
        });

        sessionPromiseRef.current = sessionPromise;

        // 6. Setup Input Audio Processing
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createPcmBlob(inputData);
            
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                }).catch(e => console.error("Send audio failed", e));
            }
        };

        // 7. Start Animation Loop for Volume
        const updateVolumes = () => {
            if (onVolumeChange) {
                let inputVol = 0;
                let outputVol = 0;

                if (inputAnalyserRef.current) {
                    const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
                    inputAnalyserRef.current.getByteFrequencyData(data);
                    const sum = data.reduce((a, b) => a + b, 0);
                    inputVol = sum / data.length / 255;
                }

                if (outputAnalyserRef.current) {
                    const data = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
                    outputAnalyserRef.current.getByteFrequencyData(data);
                    const sum = data.reduce((a, b) => a + b, 0);
                    outputVol = sum / data.length / 255;
                }

                onVolumeChange(inputVol, outputVol);
            }
            rafRef.current = requestAnimationFrame(updateVolumes);
        };
        updateVolumes();

    } catch (err: any) {
        console.error("Connection Failed", err);
        setError(err.message || "Failed to connect to Gemini Live API");
        setConnectionState(ConnectionState.ERROR);
        disconnect();
    }
  }, [disconnect, onVolumeChange]);

  const sendVideoFrame = useCallback(async (base64Image: string) => {
      if (connectionState !== ConnectionState.CONNECTED || !sessionPromiseRef.current) return;
      
      try {
          const session = await sessionPromiseRef.current;
          await session.sendRealtimeInput({
              media: {
                  mimeType: 'image/jpeg',
                  data: base64Image
              }
          });
      } catch (e) {
          console.error("Failed to send video frame", e);
      }
  }, [connectionState]);

  return {
    connect,
    disconnect,
    connectionState,
    transcripts,
    error,
    sendVideoFrame
  };
};