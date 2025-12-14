import React from 'react';

interface VisualizerProps {
  inputVolume: number;
  outputVolume: number;
  active: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ inputVolume, outputVolume, active }) => {
  // Creating a set of bars
  const bars = Array.from({ length: 12 });

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Core Halo */}
        <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/30 blur-md transition-all duration-300 ${active ? 'scale-110 opacity-100' : 'scale-90 opacity-30'}`} />
        
        {/* Inner Circle - The "Eye" */}
        <div className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-900 to-black border border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-100`}>
            {active && (
                <div 
                    className="w-full h-full rounded-full bg-cyan-400/20 animate-pulse"
                    style={{ transform: `scale(${0.8 + (outputVolume * 0.4)})` }}
                />
            )}
            <div className="absolute w-2 h-2 bg-white rounded-full opacity-80" />
        </div>

        {/* Orbiting Audio Bars */}
        {active && bars.map((_, i) => {
            const rotation = i * (360 / bars.length);
            // Mix input and output volume for a lively effect
            const height = 10 + (Math.random() * 20) + ((outputVolume * 40) + (inputVolume * 20));
            
            return (
                <div
                    key={i}
                    className="absolute w-1.5 bg-cyan-400 rounded-full visualizer-bar origin-bottom"
                    style={{
                        height: `${height}px`,
                        transform: `rotate(${rotation}deg) translateY(-60px)`,
                        opacity: 0.6 + (outputVolume * 0.4)
                    }}
                />
            );
        })}
        
        {!active && (
             <div className="absolute text-cyan-800 text-xs font-mono mt-32 tracking-widest">OFFLINE</div>
        )}
    </div>
  );
};

export default Visualizer;