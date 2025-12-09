import { useState, useEffect } from 'react';
import { MessageSquare, Lock } from 'lucide-react';
import { commentService } from '../services/commentService';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { useAuth } from '../contexts/AuthContext';
import type { CommentWithProfile } from '../types/database';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [commentsData, count] = await Promise.all([
        commentService.getCommentsByPostId(postId),
        commentService.getCommentCount(postId),
      ]);
      setComments(commentsData);
      setCommentCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    if (!user) return;

    await commentService.createComment({
      post_id: postId,
      user_id: user.id,
      parent_comment_id: null,
      content,
    });

    await loadComments();
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!user) return;

    await commentService.createComment({
      post_id: postId,
      user_id: user.id,
      parent_comment_id: parentId,
      content,
    });

    await loadComments();
  };

  const handleEdit = async (commentId: string, content: string) => {
    await commentService.updateComment(commentId, { content });
    await loadComments();
  };

  const handleDelete = async (commentId: string) => {
    await commentService.softDeleteComment(commentId);
    await loadComments();
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
          {commentCount > 0 && (
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-semibold border border-cyan-500/30">
              {commentCount}
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
            <p className="text-slate-400 text-sm">
              Please log in to join the discussion
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-800/30 rounded-lg p-4 animate-pulse"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-full" />
                  <div className="h-4 bg-slate-700/50 rounded w-32" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700/50 rounded w-full" />
                  <div className="h-3 bg-slate-700/50 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && comments.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}

        {!loading && !error && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id || null}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
