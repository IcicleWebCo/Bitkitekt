import { useState, useEffect } from 'react';
import { AlertCircle, Rocket, Zap, MessageSquare, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailConfirmationProps {
  type: 'confirmed' | 'error';
  message?: string;
  onContinue: () => void;
}

export function EmailConfirmation({ type, message, onContinue }: EmailConfirmationProps) {
  const { profile } = useAuth();
  const [showButton, setShowButton] = useState(false);
  const [starsVisible, setStarsVisible] = useState(false);

  useEffect(() => {
    if (type === 'confirmed') {
      setStarsVisible(true);
      const timer = setTimeout(() => {
        setShowButton(true);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [type]);

  if (type === 'error') {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Confirmation Failed</h2>
          <p className="text-slate-300">
            {message || 'There was an error confirming your email. The link may have expired.'}
          </p>
          <button
            onClick={onContinue}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900 overflow-hidden">
      {starsVisible && (
        <>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </>
      )}

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl text-center space-y-8">
          <div className="animate-[fadeIn_1s_ease-in]">
            <div className="inline-block mb-6 relative">
              <Rocket className="w-24 h-24 text-cyan-400 animate-[bounce_2s_ease-in-out_infinite]" />
              <div className="absolute -inset-4 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-[fadeIn_1.5s_ease-in]">
              Welcome Aboard, Bitkitekt
            </h1>
            <p className="text-3xl md:text-4xl font-semibold text-white/90 animate-[fadeIn_2s_ease-in]">
              {profile?.username || 'Explorer'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12 animate-[fadeIn_2.5s_ease-in]">
            <div className="bg-slate-800/40 backdrop-blur-lg border border-cyan-500/30 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/50">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cyan-400 mb-2">Power Ups</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Boost posts you love to help them reach orbit! Each power up amplifies visibility and shows your support.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">Your Stack</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Save content to your personal stack for later. Build your collection of insights and ideas.
              </p>
            </div>

            <div className="bg-slate-800/40 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">Engage & Connect</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Share your thoughts! Your voice matters in building this community of innovators.
              </p>
            </div>
          </div>

          {showButton && (
            <div className="animate-[slideUp_0.8s_ease-out] mt-12">
              <button
                onClick={onContinue}
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white text-xl font-bold rounded-full overflow-hidden shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Begin Your Journey</span>
                <Rocket className="w-6 h-6 relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
