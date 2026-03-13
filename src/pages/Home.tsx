import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { motion } from 'motion/react';
import { TrendingUp, Clock, Filter, ChevronDown } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'newest' | 'trending'>('newest');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const POSTS_PER_PAGE = 5;

  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('status', '==', 'published'),
      orderBy(filter === 'newest' ? 'createdAt' : 'likeCount', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, [filter]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);

    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy(filter === 'newest' ? 'createdAt' : 'likeCount', 'desc'),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      setPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'posts_load_more');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Feed</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Discover what's happening in the community.</p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setFilter('newest')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'newest' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Clock size={16} />
            Newest
          </button>
          <button 
            onClick={() => setFilter('trending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'trending' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <TrendingUp size={16} />
            Trending
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid gap-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % POSTS_PER_PAGE) * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-white font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loadingMore ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Load More</span>
                    <ChevronDown size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No posts found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2 mb-6">
            Be the first to share something with the community!
          </p>
          <button 
            onClick={async () => {
              const { seedDatabase } = await import('../lib/seedData');
              await seedDatabase();
              window.location.reload();
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
          >
            Seed Sample Content
          </button>
        </div>
      )}
    </div>
  );
}
