import React, { useMemo } from 'react';

interface AvatarProps {
  outputVolume: number;
  active: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ outputVolume, active }) => {
  // Create mouth bars
  const mouthBars = useMemo(() => {
    return Array.from({ length: 9 }).map((_, i) => {
        // Center bars are taller
        const baseHeight = 4 + Math.sin((i / 8) * Math.PI) * 10;
        return baseHeight;
    });
  }, []);

  return (
    <div className={`relative w-64 h-64 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-50 grayscale'}`}>
        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <defs>
                <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {/* Head Outline - Tech Style */}
            <path 
                d="M100,20 L140,30 L160,70 L160,130 L130,190 L70,190 L40,130 L40,70 L60,30 Z" 
                fill="rgba(6,182,212,0.05)" 
                stroke="url(#cyber-grad)" 
                strokeWidth="2"
                className="transition-all duration-300"
                filter="url(#glow)"
            />
            
            {/* Circuit details */}
            <path d="M40,70 L60,70 L65,60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" fill="none" />
            <path d="M160,70 L140,70 L135,60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" fill="none" />
            <path d="M100,190 L100,210 M70,190 L60,210 M130,190 L140,210" stroke="rgba(6,182,212,0.4)" strokeWidth="1" fill="none" />

            {/* Ear Pieces */}
            <rect x="35" y="90" width="5" height="20" rx="2" fill="#06b6d4" opacity="0.8" />
            <rect x="160" y="90" width="5" height="20" rx="2" fill="#06b6d4" opacity="0.8" />

            {/* Eyes */}
            <g className={active ? "animate-pulse" : ""}>
                <path d="M60,90 L90,90 L85,100 L65,100 Z" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1" />
                <path d="M110,90 L140,90 L135,100 L115,100 Z" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1" />
                
                {/* Pupils */}
                <circle cx="75" cy="95" r={active ? 2 : 1} fill="#fff" className="transition-all" />
                <circle cx="125" cy="95" r={active ? 2 : 1} fill="#fff" className="transition-all" />
            </g>

            {/* Mouth Visualization */}
            <g transform="translate(100, 150)">
                {mouthBars.map((baseH, i) => {
                    const x = (i - 4) * 8; // Spread bars centered
                    // Scale height with volume
                    const h = Math.max(2, baseH + (outputVolume * 60)); // Increase sensitivity
                    
                    return (
                        <rect 
                            key={i}
                            x={x - 2}
                            y={-h / 2}
                            width="4"
                            height={h}
                            rx="1"
                            fill="#06b6d4"
                            opacity={0.8}
                            className=""
                        />
                    );
                })}
            </g>

            {/* Floating Data Particles */}
            {active && (
                <>
                <circle cx="20" cy="50" r="1" fill="#fff" className="animate-ping" style={{animationDuration: '3s'}} />
                <circle cx="180" cy="150" r="1" fill="#fff" className="animate-ping" style={{animationDuration: '4s'}} />
                </>
            )}
        </svg>
    </div>
  );
};

export default Avatar;