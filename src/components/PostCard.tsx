import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Share2, MoreVertical, Bookmark } from 'lucide-react';
import { Post } from '../types';
import { formatDate, timeAgo, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  useEffect(() => {
    if (!user) return;

    // Check if liked (ideally we'd have a likes collection, but for now we'll just check if user id is in a list or similar)
    // For simplicity in this demo, we'll check a 'likes' collection
    const checkStatus = async () => {
      try {
        const likeDoc = await getDoc(doc(db, 'likes', `${user.uid}_${post.id}`));
        setIsLiked(likeDoc.exists());

        const savedDoc = await getDoc(doc(db, 'saved_posts', `${user.uid}_${post.id}`));
        setIsSaved(savedDoc.exists());
      } catch (err) {
        console.error('Error checking post status:', err);
      }
    };

    checkStatus();
  }, [user, post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    const likeId = `${user.uid}_${post.id}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
        setLikeCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await setDoc(likeRef, { userId: user.uid, postId: post.id, createdAt: new Date() });
        await updateDoc(postRef, { likeCount: increment(1) });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);

        // Create notification for author
        if (post.authorId !== user.uid) {
          await setDoc(doc(collection(db, 'notifications')), {
            userId: post.authorId,
            fromUserId: user.uid,
            fromUserName: user.displayName,
            fromUserPhoto: user.photoURL,
            postId: post.id,
            type: 'like',
            message: `liked your post: ${post.title}`,
            link: `/post/${post.id}`,
            read: false,
            createdAt: new Date()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'post_like');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    const saveId = `${user.uid}_${post.id}`;
    const saveRef = doc(db, 'saved_posts', saveId);

    try {
      if (isSaved) {
        await deleteDoc(saveRef);
        setIsSaved(false);
      } else {
        await setDoc(saveRef, { userId: user.uid, postId: post.id, savedAt: new Date() });
        setIsSaved(true);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'post_save');
    }
  };
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.authorId}`}>
              <img 
                src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}`} 
                alt={post.authorName}
                className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-800"
              />
            </Link>
            <div>
              <Link to={`/profile/${post.authorId}`} className="text-sm font-bold hover:text-indigo-600 transition-colors">
                {post.authorName}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider">
                {post.category || 'General'}
              </span>
            </div>
            <Link to={`/post/${post.id}`}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">
                {post.title}
              </h2>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {post.excerpt || post.content.substring(0, 160) + '...'}
            </p>
          </div>

          {post.imageUrl && (
            <div className="lg:w-48 h-48 lg:h-32 rounded-2xl overflow-hidden flex-shrink-0">
              <img 
                src={post.imageUrl} 
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-gray-500 dark:text-gray-500 hover:text-indigo-600 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 transition-colors group/btn",
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                isLiked ? "bg-red-50 dark:bg-red-900/20" : "group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-900/20"
              )}>
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </div>
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <Link to={`/post/${post.id}`} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors group/btn">
              <div className="p-2 rounded-lg group-hover/btn:bg-indigo-50 dark:group-hover/btn:bg-indigo-900/20 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm font-medium">{post.commentCount}</span>
            </Link>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="p-2">
                <Eye size={18} />
              </div>
              <span className="text-sm font-medium">{post.viewCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleSave}
              className={cn(
                "p-2 rounded-xl transition-all",
                isSaved ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              )}
            >
              <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
            </button>
            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
