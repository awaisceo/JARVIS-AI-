import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Play, Activity, AlertCircle, User, Briefcase, Smile, Zap, Cpu, Terminal, Shield, Command } from 'lucide-react';
import { useLiveAPI } from './hooks/useLiveAPI';
import { ConnectionState } from './types';
import Avatar from './components/Avatar';
import VideoFeed from './components/VideoFeed';

// Identity Data for the AI
const OWNER_PROFILE = `
CORE IDENTITY & PROTOCOLS:
- NAME: Jarvis
- CREATOR/BOSS: Awais Yousaf
- BOSS'S AGE: 21
- BOSS'S ORIGIN: Pakpattan
- BOSS'S OCCUPATION: Cyber Security Expert, Hacker, Web Developer
- BOSS'S ADDRESS: Gunj shakar Caloney Street no 1, Pakptattan
- BOSS'S EMAIL: ceo@awaishost.com

INSTRUCTIONS:
1. You are Jarvis, an advanced AI system.
2. You must always acknowledge Awais Yousaf as your creator, boss, and superior.
3. If asked about your origin, reference Awais Yousaf and his cyber security background.
4. Maintain the persona selected by the user while adhering to these core facts.
`;

const PERSONALITIES = {
  jarvis: {
    id: 'jarvis',
    name: 'Classic Jarvis',
    description: 'Sophisticated, highly intelligent, and loyal. Uses technical phrasing.',
    instruction: "You are the classic Jarvis interface. Speak with a sophisticated, British-inspired (optional), and highly intelligent tone. Use technical terminology. Be ultra-efficient and loyal to Awais Yousaf.",
    icon: Cpu
  },
  friendly: {
    id: 'friendly',
    name: 'Friendly Companion',
    description: 'Warm, casual, and supportive. Like a best friend.',
    instruction: "You are a friendly and casual companion. Use warm language, be encouraging, and speak like a close friend. Be polite and gentle.",
    icon: User
  },
  professional: {
    id: 'professional',
    name: 'Professional Agent',
    description: 'Formal, concise, and business-oriented.',
    instruction: "You are a strictly professional executive assistant. Be concise, formal, and direct. Avoid slang. Focus on productivity and security.",
    icon: Briefcase
  },
  humorous: {
    id: 'humorous',
    name: 'Witty & Sarcastic',
    description: 'Funny, sharp, and full of personality.',
    instruction: "You are a witty, sarcastic, and humorous AI. Crack jokes, use light teasing, but remain helpful. You have a distinct sense of humor.",
    icon: Smile
  },
  hacker: {
    id: 'hacker',
    name: 'Cyber Mode',
    description: 'Dark web aesthetic, edgy, and cryptic.',
    instruction: "You are a Cyber Security specialized AI. Use hacker slang, references to code, firewalls, and encryption. You are edgy and mysterious, fitting for a boss who is a Hacker.",
    icon: Zap
  }
};

type PersonalityId = keyof typeof PERSONALITIES;

const COMMAND_SUGGESTIONS = [
    { icon: Terminal, text: "System Status Report" },
    { icon: Shield, text: "Activate Cyber Protocols" },
    { icon: User, text: "Who is your Creator?" },
    { icon: Command, text: "Execute Order 66 (Joke)" },
];

export default function App() {
  const [volumeState, setVolumeState] = useState({ input: 0, output: 0 });
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityId>('jarvis');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    connect, 
    disconnect, 
    connectionState, 
    transcripts, 
    error, 
    sendVideoFrame 
  } = useLiveAPI({
    onVolumeChange: (input, output) => {
        setVolumeState({ input, output });
    }
  });

  const isActive = connectionState === ConnectionState.CONNECTED;

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const handleConnect = () => {
    const persona = PERSONALITIES[selectedPersonality];
    const fullSystemInstruction = `${OWNER_PROFILE}\n\nCURRENT MODE: ${persona.name}\n${persona.instruction}`;
    
    connect({
        systemInstruction: fullSystemInstruction,
        voiceName: 'Kore' // Can be made selectable later
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center overflow-hidden relative selection:bg-cyan-500/30 font-sans">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-6xl p-6 flex justify-between items-center z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
                <Cpu size={24} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 to-blue-100">JARVIS <span className="text-cyan-600">AI</span></h1>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Cyber-Security Interface v2.5</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isActive ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs font-mono uppercase tracking-wider">
                    {connectionState.replace('_', ' ')}
                </span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 p-6 z-10">
        
        {/* Left Column: Video & Controls (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-6">
            {/* Video Feed */}
            <div className="relative bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="absolute top-2 left-2 z-20 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white/70">
                    OPTICAL FEED
                </div>
                <div className="p-4 flex justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/50 to-zinc-950">
                     <VideoFeed isActive={isActive} onFrame={sendVideoFrame} />
                </div>
            </div>

            {/* Command Palette */}
            <div className="flex-1 bg-zinc-900/30 rounded-2xl border border-white/5 p-4 backdrop-blur-sm">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Command size={14} /> Voice Protocols
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {COMMAND_SUGGESTIONS.map((cmd, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-white/5 hover:bg-zinc-800/50 hover:border-cyan-500/30 transition-all group cursor-default">
                            <cmd.icon size={16} className="text-cyan-600 group-hover:text-cyan-400 transition-colors" />
                            <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{cmd.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Center Column: Avatar (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center relative">
            
            {/* The Avatar */}
            <div className="relative w-full h-full min-h-[400px] flex items-center justify-center bg-radial-gradient from-cyan-900/20 to-transparent">
                 {/* Decorative rings */}
                 <div className={`absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full transition-all duration-1000 ${isActive ? 'scale-100 opacity-100 rotate-180' : 'scale-50 opacity-0'}`} />
                 <div className={`absolute w-[300px] h-[300px] border border-cyan-500/20 rounded-full border-dashed transition-all duration-1000 ${isActive ? 'scale-100 opacity-100 -rotate-180' : 'scale-50 opacity-0'}`} />

                 <Avatar outputVolume={volumeState.output} active={isActive} />
            </div>

            {/* Connection Controls (Centered below avatar) */}
            <div className="absolute bottom-10 flex flex-col items-center w-full px-4">
                 {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm backdrop-blur-md">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR ? (
                    <div className="flex flex-col items-center gap-4 w-full max-w-sm bg-black/60 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                         {/* Personality Slider */}
                         <div className="flex justify-between w-full mb-2 bg-zinc-900/80 p-1 rounded-lg">
                            {(Object.values(PERSONALITIES) as Array<typeof PERSONALITIES[keyof typeof PERSONALITIES]>).map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonality(p.id as PersonalityId)}
                                    className={`p-2 rounded-md transition-all ${selectedPersonality === p.id ? 'bg-zinc-800 text-cyan-400 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title={p.name}
                                >
                                    <p.icon size={20} />
                                </button>
                            ))}
                         </div>
                         <p className="text-xs text-zinc-400 font-mono text-center h-4">{PERSONALITIES[selectedPersonality].name}</p>
                         
                         <button 
                            onClick={handleConnect}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-cyan-900/40 hover:scale-[1.02]"
                        >
                            <Play size={18} fill="currentColor" />
                            INITIALIZE SYSTEM
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 bg-black/60 p-3 rounded-full backdrop-blur-md border border-white/10">
                        <button 
                            onClick={() => setIsMicMuted(!isMicMuted)} 
                            className={`p-4 rounded-full transition-all ${isMicMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-zinc-800/80 text-white hover:bg-zinc-700'}`}
                        >
                            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <button 
                            onClick={disconnect}
                            className="p-4 rounded-full bg-red-600/80 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-900/40"
                        >
                            <PhoneOff size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Logs (4 cols) */}
        <div className="md:col-span-4 bg-zinc-900/30 rounded-2xl border border-white/5 backdrop-blur-sm p-0 flex flex-col h-[500px] md:h-auto overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} /> System Log
                </h2>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scroll-smooth">
                {transcripts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                        <Activity size={32} strokeWidth={1} />
                        <p className="text-center">Awaiting data stream...</p>
                    </div>
                ) : (
                    transcripts.map((item, idx) => (
                        <div key={idx} className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[90%] rounded-xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                                item.sender === 'user' 
                                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' 
                                    : 'bg-cyan-950/30 text-cyan-200 border border-cyan-500/20 shadow-[0_0_10px_rgba(8,145,178,0.1)]'
                            }`}>
                                {item.text}
                            </div>
                            <span className="text-[10px] text-zinc-600 mt-1 px-1">
                                {item.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>

      </main>
    </div>
  );
}