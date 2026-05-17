import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface CelebrationPopupProps {
  show: boolean;
  onComplete?: () => void;
  accuracy: number | null;
}

const CelebrationPopup:React.FC<CelebrationPopupProps> = ({ show, onComplete, accuracy}) => {
  const { width, height } = useWindowSize();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (onComplete) {
          setTimeout(() => onComplete(), 1000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <Confetti
        width={width}
        height={height}
        numberOfPieces={300}
        recycle={false}
        gravity={0.3}
        colors={[
          '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', 
          '#C7CEEA', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', 
          '#85C1E2', '#F8B88B', '#FF69B4', '#87CEEB', '#FFD700',
          '#FF1493', '#00CED1', '#FF8C00'
        ]}
        confettiSource={{
          x: 0,
          y: 0,
          w: width,
          h: 0
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`relative transition-all duration-500 ${
            isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-50 -translate-y-20'
          }`}
          style={{
            animation: isAnimating ? 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full blur-3xl opacity-60 animate-pulse" />
          
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 border-4 border-yellow-400">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0s' }} />
              <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-300 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
              <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: '0.9s' }} />
            </div>

            <img
              src="/assets/maskot/maskotA.webp"
              alt="Maskot"
              className="w-48 h-48 object-contain relative z-10"
              style={{
                animation: 'wiggle 0.5s ease-in-out infinite'
              }}
            />
            
            <div className="absolute -top-4 -left-4 text-5xl animate-bounce" style={{ animationDelay: '0s' }}>⭐</div>
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
            <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌟</div>
            <div className="absolute -bottom-4 -right-4 text-5xl animate-bounce" style={{ animationDelay: '0.3s' }}>💫</div>
            
            <div className="mt-4 text-center relative z-10">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 mb-2"
                  style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                Luar Biasa!
              </h2>
              {accuracy !== undefined && (
                <p className="text-2xl font-bold text-gray-700"
                   style={{ animation: 'slideUp 0.5s ease-out 0.5s both' }}>
                  {accuracy}%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};


export default CelebrationPopup;