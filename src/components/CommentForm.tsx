import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import { LIMITS, CHAR_LIMITS } from '../constants';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  placeholder = 'Write a comment...',
  submitLabel = 'Post Comment',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError('Comment cannot be empty');
      return;
    }

    if (trimmedContent.length > LIMITS.MAX_COMMENT_LENGTH) {
      setError(`Comment cannot exceed ${LIMITS.MAX_COMMENT_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedContent);
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const remainingChars = LIMITS.MAX_COMMENT_LENGTH - content.length;
  const isNearLimit = remainingChars < CHAR_LIMITS.COMMENT_WARNING_THRESHOLD;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          rows={3}
          maxLength={LIMITS.MAX_COMMENT_LENGTH}
        />
        {isNearLimit && (
          <div className={`absolute bottom-2 right-2 text-xs ${remainingChars < 0 ? 'text-red-400' : 'text-slate-500'}`}>
            {remainingChars} characters remaining
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Posting...' : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}

        <span className="text-xs text-slate-500 ml-auto">
          Press Ctrl/Cmd + Enter to submit
        </span>
      </div>
    </form>
  );
}
