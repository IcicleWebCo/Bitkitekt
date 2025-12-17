import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { stackService } from '../services/stackService';

interface PushButtonProps {
  postId: string;
  variant?: 'card' | 'detail';
  onAuthRequired?: () => void;
  onStackChange?: () => void;
}

export default function PushButton({ postId, variant = 'card', onAuthRequired, onStackChange }: PushButtonProps) {
  const { user } = useAuth();
  const [isInStack, setIsInStack] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    loadStackStatus();
  }, [postId, user]);

  const loadStackStatus = async () => {
    if (!user) {
      setIsInStack(false);
      return;
    }
    const inStack = await stackService.isInStack(postId, user.id);
    setIsInStack(inStack);
  };

  const handleClick = async () => {
    if (!user) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        alert('Log in to push to your stack');
      }
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 600);

    const optimisticIsInStack = !isInStack;
    setIsInStack(optimisticIsInStack);

    let success = false;
    if (optimisticIsInStack) {
      const result = await stackService.pushToStack(postId, user.id);
      success = result !== null;
    } else {
      success = await stackService.popFromStack(postId, user.id);
    }

    if (success) {
      if (onStackChange) {
        onStackChange();
      }
    } else {
      setIsInStack(!optimisticIsInStack);
    }

    setIsLoading(false);
  };

  const baseClasses = variant === 'card'
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200'
    : 'flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold transition-all duration-200';

  const buttonClasses = isInStack
    ? variant === 'card'
      ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20'
      : 'bg-blue-500/10 text-blue-600 border-2 border-blue-500/30 hover:bg-blue-500/20 hover:shadow-xl hover:shadow-blue-500/20'
    : user
      ? variant === 'card'
        ? 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-600 hover:border-slate-300'
        : 'bg-slate-50 text-slate-500 border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-600 hover:border-slate-300'
      : variant === 'card'
        ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
        : 'bg-slate-50 text-slate-400 border-2 border-slate-200 opacity-60 cursor-not-allowed';

  const iconClasses = isInStack
    ? 'text-blue-500 fill-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
    : 'text-slate-400';

  const pulseClasses = isPulsing ? 'animate-pulse scale-110' : '';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${baseClasses} ${buttonClasses} ${pulseClasses} ${isLoading ? 'opacity-70' : ''}`}
      title={!user ? 'Log in to push to your stack' : isInStack ? 'Pop from stack' : 'Push to stack'}
    >
      <Layers
        className={`${iconClasses} transition-all duration-200 ${variant === 'card' ? 'w-4 h-4' : 'w-5 h-5'}`}
      />
      <span>{isInStack ? 'Stacked' : 'Push'}</span>
    </button>
  );
}
