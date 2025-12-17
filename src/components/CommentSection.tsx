import { useState, useEffect } from 'react';
import { MessageSquare, Lock } from 'lucide-react';
import { commentService } from '../services/commentService';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { useAuth } from '../contexts/AuthContext';
import type { CommentWithProfile } from '../types/database';

interface CommentSectionProps {
  itemId: string;
  itemType: 'post' | 'poll';
  comments: CommentWithProfile[];
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
  onCommentUpdated: () => void;
  onPowerUpToggled: () => void;
  onSignIn?: () => void;
}

export function CommentSection({
  itemId,
  itemType,
  comments,
  onCommentAdded,
  onCommentDeleted,
  onCommentUpdated,
  onPowerUpToggled,
  onSignIn
}: CommentSectionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateComment = async (content: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await commentService.createComment({
        post_id: itemType === 'post' ? itemId : null,
        poll_id: itemType === 'poll' ? itemId : null,
        user_id: user.id,
        parent_comment_id: null,
        content,
      });
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await commentService.createComment({
        post_id: itemType === 'post' ? itemId : null,
        poll_id: itemType === 'poll' ? itemId : null,
        user_id: user.id,
        parent_comment_id: parentId,
        content,
      });
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      setLoading(true);
      await commentService.updateComment(commentId, { content });
      onCommentUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      setLoading(true);
      await commentService.softDeleteComment(commentId);
      onCommentDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };

  const handlePowerUpToggle = async (commentId: string, isPoweredUp: boolean) => {
    if (!user) return;

    try {
      if (isPoweredUp) {
        await commentService.removePowerUp(commentId, user.id);
      } else {
        await commentService.powerUpComment(commentId, user.id);
      }
      onPowerUpToggled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to power up comment');
    }
  };

  return (
    <section className="mt-8 pt-8 border-t border-slate-700/50">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Comments
            </h2>
          </div>
          {comments.length > 0 && (
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-semibold border border-cyan-500/30">
              {comments.length}
            </span>
          )}
        </div>

        {user ? (
          <div className="bg-slate-800/20 rounded-lg p-4 border border-slate-700/30">
            <CommentForm
              onSubmit={handleCreateComment}
              placeholder="Share your thoughts..."
              submitLabel="Post Comment"
            />
          </div>
        ) : (
          <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50 text-center">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">
              Please sign in to join the discussion
            </p>
            {onSignIn && (
              <button
                onClick={onSignIn}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {comments.length === 0 && !error && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}

        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id || null}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPowerUpToggle={handlePowerUpToggle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
