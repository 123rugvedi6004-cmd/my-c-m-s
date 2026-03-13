import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import { Search, Hash, TrendingUp, Users } from 'lucide-react';

const CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Business', 'Health', 'Travel'];

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    if (selectedCategory) {
      q = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      if (searchQuery) {
        postsData = postsData.filter(p => 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'explore_posts');
    });

    return () => unsubscribe();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Content</h1>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search for topics, articles, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 border focus:border-indigo-600 rounded-2xl outline-none transition-all text-lg"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedCategory === null 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Topics
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-900 animate-pulse rounded-3xl" />)}
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-gray-500 mb-6">No results found for your search.</p>
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

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Trending Tags
            </h3>
            <div className="space-y-4">
              {['javascript', 'react', 'webdev', 'uiux', 'productivity', 'ai'].map(tag => (
                <div key={tag} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                      <Hash size={16} />
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">#{tag}</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">1.2k posts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Top Authors
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800" alt="" />
                  <div>
                    <p className="text-sm font-bold">Author Name {i}</p>
                    <p className="text-xs text-gray-500">2.4k followers</p>
                  </div>
                  <button className="ml-auto text-xs font-bold text-indigo-600 hover:underline">Follow</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
