import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface VideoFeedProps {
  onFrame: (base64: string) => void;
  isActive: boolean;
}

const FRAME_RATE = 5; // Send 5 frames per second
const JPEG_QUALITY = 0.5;

const VideoFeed: React.FC<VideoFeedProps> = ({ onFrame, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480, facingMode: 'user' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setIsCameraOn(false);
      }
    };

    if (isActive && isCameraOn) {
        startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCameraOn]);

  // Frame Extraction Loop
  useEffect(() => {
    if (!isActive || !isCameraOn || !stream) {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        return;
    }

    intervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64 (remove data URL prefix)
            const base64 = canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
            onFrame(base64);
        }
    }, 1000 / FRAME_RATE);

    return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isActive, isCameraOn, stream, onFrame]);

  const toggleCamera = () => {
      if (isCameraOn) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          setStream(null);
      }
      setIsCameraOn(!isCameraOn);
  };

  return (
    <div className="relative group">
        <div className="relative w-full max-w-[200px] aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-lg">
            <video 
                ref={videoRef} 
                className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`} 
                muted 
                playsInline 
            />
            {!isCameraOn && (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <CameraOff size={24} />
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <button 
            onClick={toggleCamera}
            className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
        >
            {isCameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
        </button>
    </div>
  );
};

export default VideoFeed;