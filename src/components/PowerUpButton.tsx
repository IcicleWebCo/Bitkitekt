import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { powerUpService } from '../services/powerUpService';

interface PowerUpButtonProps {
  postId: string;
  variant?: 'card' | 'detail';
  onAuthRequired?: () => void;
}

export default function PowerUpButton({ postId, variant = 'card', onAuthRequired }: PowerUpButtonProps) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isPoweredUp, setIsPoweredUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    loadPowerUpStatus();
  }, [postId, user]);

  const loadPowerUpStatus = async () => {
    const status = await powerUpService.getPowerUpStatus(postId, user?.id || null);
    setCount(status.count);
    setIsPoweredUp(status.isPoweredUp);
  };

  const handleClick = async () => {
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        alert('Log in to Power Up this post');
      }
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 600);

    const optimisticIsPoweredUp = !isPoweredUp;
    const optimisticCount = optimisticIsPoweredUp ? count + 1 : count - 1;

    setIsPoweredUp(optimisticIsPoweredUp);
    setCount(optimisticCount);

    const result = await powerUpService.togglePowerUp(postId, user.id);

    if (result.success) {
      setIsPoweredUp(result.isPoweredUp);
      const newCount = await powerUpService.getPowerUpCount(postId);
      setCount(newCount);
    } else {
      setIsPoweredUp(!optimisticIsPoweredUp);
      setCount(count);
    }

    setIsLoading(false);
  };

  const baseClasses = variant === 'card'
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200'
    : 'flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold transition-all duration-200';

  const buttonClasses = isPoweredUp
    ? variant === 'card'
      ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/20'
      : 'bg-yellow-500/10 text-yellow-600 border-2 border-yellow-500/30 hover:bg-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/20'
    : user
      ? variant === 'card'
        ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-600 hover:border-slate-300'
        : 'bg-slate-50 text-slate-500 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300'
      : variant === 'card'
        ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
        : 'bg-slate-50 text-slate-400 border-2 border-slate-200 opacity-60 cursor-not-allowed';

  const iconClasses = isPoweredUp
    ? 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
    : 'text-slate-400';

  const pulseClasses = isPulsing ? 'animate-pulse scale-110' : '';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClasses} ${buttonClasses} ${pulseClasses} ${isLoading ? 'opacity-70' : ''}`}
      title={!user ? 'Log in to Power Up this post' : isPoweredUp ? 'Remove Power Up' : 'Power Up this post'}
    >
      <Zap
        className={`${iconClasses} transition-all duration-200 ${variant === 'card' ? 'w-4 h-4' : 'w-5 h-5'}`}
      />
      <span className="font-bold">{count}</span>
    </button>
  );
}
