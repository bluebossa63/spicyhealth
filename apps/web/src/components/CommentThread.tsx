'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Comment {
  id: string;
  userId: string;
  body: string;
  likes: number;
  likedBy?: string[];
  reactionCounts?: Record<string, number>;
  parentId?: string;
  createdAt: string;
  authorName?: string;
}

const EMOJIS: { key: string; icon: string }[] = [
  { key: 'thumbs_up', icon: '👍' },
  { key: 'heart', icon: '❤️' },
  { key: 'yum', icon: '😋' },
  { key: 'fire', icon: '🔥' },
];

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onLike,
  onReact,
}: {
  comment: Comment;
  currentUserId?: string;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
}) {
  const liked = currentUserId ? (comment.likedBy || []).includes(currentUserId) : false;
  const rc = comment.reactionCounts || {};

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-sage-200 flex items-center justify-center text-xs font-bold text-sage-700 shrink-0 mt-1">
        {(comment.authorName || 'U')[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-sm text-charcoal-800">{comment.authorName || 'Nutzer'}</span>
          <span className="text-xs text-charcoal-400">{new Date(comment.createdAt).toLocaleDateString('de-DE')}</span>
        </div>
        <p className="text-sm text-charcoal-700 leading-relaxed">{comment.body}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {/* Like */}
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-regency-dark font-semibold' : 'text-charcoal-400 hover:text-regency-400'}`}
          >
            ♥ {comment.likes || 0}
          </button>
          {/* Emoji reactions */}
          {EMOJIS.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => onReact(comment.id, key)}
              className="text-xs px-1.5 py-0.5 rounded-full bg-cream-100 hover:bg-cream-200 transition-colors"
              title={key}
            >
              {icon} {rc[key] ? <span className="text-charcoal-500">{rc[key]}</span> : null}
            </button>
          ))}
          {/* Reply */}
          <button
            onClick={() => onReply(comment.id)}
            className="text-xs text-charcoal-400 hover:text-sage-600 transition-colors"
          >
            Antworten
          </button>
          {/* Delete (own comments) */}
          {currentUserId === comment.userId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-charcoal-300 hover:text-red-500 transition-colors"
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentThread({ recipeId, initialComments }: { recipeId: string; initialComments: Comment[] }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roots = comments.filter(c => !c.parentId);
  const replies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  async function handleSubmit(e: React.FormEvent, parentId?: string) {
    e.preventDefault();
    const text = parentId ? replyBody : body;
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { comment } = await api.recipes.addComment(recipeId, text, parentId);
      setComments(prev => [...prev, { ...comment, authorName: user?.displayName || user?.email }]);
      if (parentId) { setReplyTo(null); setReplyBody(''); }
      else setBody('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    try {
      const { likes, liked } = await api.comments.like(id);
      setComments(prev => prev.map(c => {
        if (c.id !== id) return c;
        const likedBy = liked
          ? [...(c.likedBy || []), user!.id]
          : (c.likedBy || []).filter(u => u !== user!.id);
        return { ...c, likes, likedBy };
      }));
    } catch {}
  }

  async function handleReact(id: string, emoji: string) {
    try {
      const { reactionCounts } = await api.comments.react(id, emoji);
      setComments(prev => prev.map(c => c.id === id ? { ...c, reactionCounts } : c));
    } catch {}
  }

  async function handleDelete(id: string) {
    try {
      await api.comments.delete(id);
      setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));
    } catch {}
  }

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl text-charcoal-800">Kommentare ({comments.length})</h3>

      {/* New comment form */}
      {user && (
        <form onSubmit={e => handleSubmit(e)} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-xs font-bold text-blush-700 shrink-0 mt-1">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Kommentar schreiben…"
              rows={2}
              className="input-field resize-none w-full text-sm"
            />
            <button type="submit" disabled={submitting || !body.trim()} className="btn-primary mt-2 text-sm">
              {submitting ? 'Wird gesendet…' : 'Kommentar senden'}
            </button>
          </div>
        </form>
      )}

      {/* Comment list */}
      <div className="space-y-5">
        {roots.length === 0 && <p className="text-sm text-charcoal-400 italic">Sei der Erste, der kommentiert!</p>}
        {roots.map(c => (
          <div key={c.id} className="space-y-4">
            <CommentItem
              comment={c}
              currentUserId={user?.id}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onLike={handleLike}
              onReact={handleReact}
            />
            {/* Replies */}
            {replies(c.id).length > 0 && (
              <div className="ml-11 space-y-4 border-l-2 border-cream-200 pl-4">
                {replies(c.id).map(r => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    currentUserId={user?.id}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onReact={handleReact}
                  />
                ))}
              </div>
            )}
            {/* Reply form */}
            {replyTo === c.id && user && (
              <form onSubmit={e => handleSubmit(e, c.id)} className="ml-11 flex gap-2">
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder="Antwort schreiben…"
                  rows={2}
                  className="input-field resize-none flex-1 text-sm"
                  autoFocus
                />
                <div className="flex flex-col gap-1">
                  <button type="submit" disabled={submitting || !replyBody.trim()} className="btn-primary text-xs px-3 py-2">
                    Antworten
                  </button>
                  <button type="button" onClick={() => setReplyTo(null)} className="btn-ghost text-xs px-3 py-2">
                    Abbrechen
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
