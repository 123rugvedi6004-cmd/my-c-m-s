import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post, Comment as CommentType } from '../types';
import { formatDate, timeAgo } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  ChevronLeft, 
  MoreVertical,
  Send,
  Trash2,
  Edit2
} from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const checkStatus = async () => {
      try {
        const likeDoc = await getDoc(doc(db, 'likes', `${user.uid}_${id}`));
        setIsLiked(likeDoc.exists());

        const savedDoc = await getDoc(doc(db, 'saved_posts', `${user.uid}_${id}`));
        setIsSaved(savedDoc.exists());
      } catch (err) {
        console.error('Error checking post status:', err);
      }
    };

    checkStatus();
  }, [id, user]);

  useEffect(() => {
    if (!post || !user || post.authorId === user.uid) return;

    const followId = `${user.uid}_${post.authorId}`;
    const unsubscribe = onSnapshot(doc(db, 'follows', followId), (doc) => {
      setIsFollowing(doc.exists());
    });
    return () => unsubscribe();
  }, [post, user]);

  useEffect(() => {
    if (!id) return;

    // Fetch Post
    const fetchPost = async () => {
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
          // Increment view count
          updateDoc(docRef, { viewCount: increment(1) });
        } else {
          navigate('/');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `posts/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // Fetch Comments
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentType[];
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleLike = async () => {
    if (!id || !post || !user) return;
    const likeId = `${user.uid}_${id}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
        setIsLiked(false);
        setPost(prev => prev ? { ...prev, likeCount: prev.likeCount - 1 } : null);
      } else {
        await setDoc(likeRef, { userId: user.uid, postId: id, createdAt: new Date() });
        await updateDoc(postRef, { likeCount: increment(1) });
        setIsLiked(true);
        setPost(prev => prev ? { ...prev, likeCount: prev.likeCount + 1 } : null);

        if (post.authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: post.authorId,
            fromUserId: user.uid,
            fromUserName: user.displayName,
            fromUserPhoto: user.photoURL,
            postId: id,
            type: 'like',
            message: `liked your post: ${post.title}`,
            link: `/post/${id}`,
            read: false,
            createdAt: new Date()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleSave = async () => {
    if (!id || !user) return;
    const saveId = `${user.uid}_${id}`;
    const saveRef = doc(db, 'saved_posts', saveId);

    try {
      if (isSaved) {
        await deleteDoc(saveRef);
        setIsSaved(false);
      } else {
        await setDoc(saveRef, { userId: user.uid, postId: id, savedAt: new Date() });
        setIsSaved(true);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'post_save');
    }
  };

  const handleFollow = async () => {
    if (!user || !post || user.uid === post.authorId) return;

    const followId = `${user.uid}_${post.authorId}`;
    const followRef = doc(db, 'follows', followId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: post.authorId,
          createdAt: new Date()
        });

        await addDoc(collection(db, 'notifications'), {
          userId: post.authorId,
          fromUserId: user.uid,
          fromUserName: user.displayName,
          fromUserPhoto: user.photoURL,
          type: 'follow',
          message: `started following you`,
          link: `/profile/${user.uid}`,
          read: false,
          createdAt: new Date()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'user_follow');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !user) return;

    try {
      await addDoc(collection(db, 'comments'), {
        postId: id,
        authorId: user.uid,
        authorName: profile?.displayName || 'Anonymous',
        authorPhoto: profile?.photoURL || '',
        text: newComment,
        createdAt: serverTimestamp(),
        likeCount: 0,
        parentId: replyTo || null
      });
      
      await updateDoc(doc(db, 'posts', id), {
        commentCount: increment(1)
      });

      if (post && post.authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: post.authorId,
          fromUserId: user.uid,
          fromUserName: user.displayName,
          fromUserPhoto: user.photoURL,
          postId: id,
          type: 'comment',
          message: `commented on your post: ${post.title}`,
          link: `/post/${id}`,
          read: false,
          createdAt: new Date()
        });
      }
      
      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  const handleLikeComment = async (comment: CommentType) => {
    if (!user) return;
    const likeId = `${user.uid}_${comment.id}`;
    const likeRef = doc(db, 'comment_likes', likeId);
    const commentRef = doc(db, 'comments', comment.id);

    try {
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { userId: user.uid, commentId: comment.id, createdAt: new Date() });
        await updateDoc(commentRef, { likeCount: increment(1) });

        if (comment.authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: comment.authorId,
            fromUserId: user.uid,
            fromUserName: user.displayName,
            fromUserPhoto: user.photoURL,
            postId: id,
            type: 'like',
            message: `liked your comment: ${comment.text.substring(0, 30)}${comment.text.length > 30 ? '...' : ''}`,
            link: `/post/${id}`,
            read: false,
            createdAt: new Date()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `comments/${comment.id}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      if (id) {
        await updateDoc(doc(db, 'posts', id), {
          commentCount: increment(-1)
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto animate-pulse bg-gray-100 dark:bg-gray-900 h-screen rounded-3xl" />;
  if (!post) return null;

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ChevronLeft size={20} />
          Back to feed
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <Share2 size={20} />
          </button>
          <button 
            onClick={handleSave}
            className={`p-2 rounded-xl transition-colors ${isSaved ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
          {user?.uid === post.authorId && (
            <Link 
              to={`/editor/${post.id}`}
              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
            >
              <Edit2 size={20} />
            </Link>
          )}
        </div>
      </div>

      {/* Article Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
            {post.category || 'General'}
          </span>
          <span className="text-gray-400 text-sm">•</span>
          <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Link to={`/profile/${post.authorId}`}>
            <img 
              src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
              alt={post.authorName}
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
            />
          </Link>
          <div className="flex-1">
            <Link to={`/profile/${post.authorId}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
              {post.authorName}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">Content Creator • {post.tags?.join(', ')}</p>
          </div>
          {user?.uid !== post.authorId && (
            <button 
              onClick={handleFollow}
              className={`px-6 py-2 font-bold rounded-xl transition-all text-sm ${
                isFollowing 
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </header>

      {/* Cover Image */}
      {post.imageUrl && (
        <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/5">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="prose dark:prose-invert max-w-none mb-16 leading-relaxed text-lg text-gray-700 dark:text-gray-300">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>

      {/* Article Footer Actions */}
      <div className="flex items-center justify-between py-8 border-y border-gray-100 dark:border-gray-800 mb-16">
        <div className="flex items-center gap-8">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            <span className="font-bold">{post.likeCount}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <MessageCircle size={24} />
            <span className="font-bold">{post.commentCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <section id="comments">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Comments ({post.commentCount})
        </h3>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="mb-12">
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-t-2xl text-xs font-bold border-x border-t border-indigo-100 dark:border-indigo-900/40">
              <span>Replying to {comments.find(c => c.id === replyTo)?.authorName}</span>
              <button onClick={() => setReplyTo(null)} className="hover:text-indigo-800">Cancel</button>
            </div>
          )}
          <div className="flex gap-4">
            <img 
              src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
              alt="Me"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 space-y-3">
              <textarea 
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className={`w-full p-4 bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-600 rounded-2xl outline-none transition-all resize-none min-h-[100px] ${replyTo ? 'rounded-t-none' : ''}`}
              />
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                  {replyTo ? 'Post Reply' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-8">
          {comments.filter(c => !c.parentId).map((comment) => (
            <div key={comment.id} className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-4"
              >
                <img 
                  src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}`} 
                  alt={comment.authorName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{comment.authorName}</span>
                      <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 ml-2">
                    <button 
                      onClick={() => handleLikeComment(comment)}
                      className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      Like ({comment.likeCount || 0})
                    </button>
                    <button 
                      onClick={() => {
                        setReplyTo(comment.id);
                        window.scrollTo({ top: document.getElementById('comments')?.offsetTop, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      Reply
                    </button>
                    {(user?.uid === comment.authorId || profile?.role === 'admin') && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Replies */}
              <div className="ml-14 space-y-4">
                {comments.filter(r => r.parentId === comment.id).map(reply => (
                  <motion.div 
                    key={reply.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4"
                  >
                    <img 
                      src={reply.authorPhoto || `https://ui-avatars.com/api/?name=${reply.authorName}`} 
                      alt={reply.authorName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs">{reply.authorName}</span>
                          <span className="text-[10px] text-gray-500">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
                          {reply.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-2">
                        <button 
                          onClick={() => handleLikeComment(reply)}
                          className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          Like ({reply.likeCount || 0})
                        </button>
                        {(user?.uid === reply.authorId || profile?.role === 'admin') && (
                          <button 
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-[10px] font-bold text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
