import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { motion } from 'motion/react';
import { Edit2, Trash2, Eye, MessageCircle, Heart, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/utils';

export default function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'my_posts');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${id}`);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Content</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your drafts and published stories.</p>
        </div>
        <Link 
          to="/editor"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={20} />
          <span>New Post</span>
        </Link>
      </div>

      <div className="grid gap-6">
        {posts.length > 0 ? posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-6 min-w-0">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FileText size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    post.status === 'published' 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {post.status}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                </div>
                <Link to={`/post/${post.id}`} className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors truncate block">
                  {post.title}
                </Link>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Eye size={14} /> {post.viewCount}</span>
                  <span className="flex items-center gap-1"><Heart size={14} /> {post.likeCount}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={14} /> {post.commentCount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                to={`/editor/${post.id}`}
                className="p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                title="Edit Post"
              >
                <Edit2 size={20} />
              </Link>
              <button 
                onClick={() => handleDelete(post.id)}
                className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                title="Delete Post"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">You haven't created any posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Start sharing your thoughts with the world.</p>
            <Link 
              to="/editor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-6 transition-all"
            >
              <Plus size={20} />
              Create Your First Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
