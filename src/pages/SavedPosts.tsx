import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post, SavedPost } from '../types';
import PostCard from '../components/PostCard';
import { Bookmark, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export default function SavedPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const savedRef = collection(db, 'saved_posts');
    const q = query(savedRef, where('userId', '==', user.uid), orderBy('savedAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const savedData = snapshot.docs.map(d => d.data() as SavedPost);
        
        if (savedData.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch actual post data for each saved post
        const postPromises = savedData.map(async (saved) => {
          const postDoc = await getDoc(doc(db, 'posts', saved.postId));
          if (postDoc.exists()) {
            return { id: postDoc.id, ...postDoc.data() } as Post;
          }
          return null;
        });

        const resolvedPosts = (await Promise.all(postPromises)).filter(p => p !== null) as Post[];
        setPosts(resolvedPosts);
        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'saved_posts_fetch');
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'saved_posts_listener');
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Content</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your bookmarked stories and articles.</p>
      </div>

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
              transition={{ delay: index * 0.1 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No saved posts</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
            Posts you bookmark will appear here for easy access.
          </p>
        </div>
      )}
    </div>
  );
}
