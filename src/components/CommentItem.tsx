import { useState } from 'react';
import { Reply, Edit3, Trash2, User as UserIcon } from 'lucide-react';
import { CommentForm } from './CommentForm';
import type { CommentWithProfile } from '../types/database';
import { LIMITS } from '../constants';

interface CommentItemProps {
  comment: CommentWithProfile;
  currentUserId: string | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const canReply = depth < LIMITS.MAX_COMMENT_DEPTH;

  const handleReply = async (content: string) => {
    await onReply(comment.id, content);
    setIsReplying(false);
  };

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await onDelete(comment.id);
    setShowDeleteConfirm(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`${depth > 0 ? 'ml-6 md:ml-8 pl-4 border-l-2 border-slate-700/30' : ''}`}>
      <div className="bg-slate-800/30 rounded-lg p-3 md:p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-cyan-400 truncate">
                  {comment.profile.username}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTimestamp(comment.created_at)}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-slate-500 italic">(edited)</span>
                )}
              </div>
            </div>
          </div>

          {isOwner && !isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded transition-colors"
                title="Edit comment"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <CommentForm
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            initialValue={comment.content}
            placeholder="Edit your comment..."
            submitLabel="Save Changes"
            autoFocus
          />
        ) : (
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-3">
            <p className="text-sm text-red-300">
              Are you sure you want to delete this comment? This will also delete all replies.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isEditing && !showDeleteConfirm && (
          <div className="flex items-center gap-2">
            {canReply && currentUserId && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-md transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="pt-2">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              submitLabel="Post Reply"
              autoFocus
            />
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
