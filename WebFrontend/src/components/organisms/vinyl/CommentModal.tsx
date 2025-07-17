import React, { useState, useEffect, useRef } from 'react';
import type { Comment } from '@/types/comment';
import PrimaryButton from '@/components/atoms/button/PrimaryButton';
import ProfileWithName from '@/components/atoms/button/ProfileWithName';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the comments list when new comments are added
    if (isOpen) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);


  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment(''); // Clear input on success
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Basic modal structure
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60%', background: 'white', zIndex: 100, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #eee', textAlign: 'center', position: 'relative' }}>
        <h3 style={{ margin: 0 }}>댓글 ({comments.length})</h3>
        <button onClick={onClose} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {comments.map((comment) => (
          <div key={comment.commentId} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <ProfileWithName user={comment.user} />
            <p style={{ margin: 0, alignSelf: 'center' }}>{comment.content}</p>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글 추가..."
          style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '20px' }}
        />
        <PrimaryButton onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? '게시 중...' : '게시'}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default CommentsModal;