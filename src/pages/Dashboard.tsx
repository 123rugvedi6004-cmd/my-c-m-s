import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post, Comment, Notification } from '../types';
import { motion } from 'motion/react';
import { 
  FileText, 
  MessageCircle, 
  Eye, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  Bell,
  Users,
  Heart
} from 'lucide-react';
import { formatDate, timeAgo } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalComments: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Fetch User Stats & Recent Posts
        const postsRef = collection(db, 'posts');
        const userPostsQuery = query(postsRef, where('authorId', '==', user.uid));
        const userPostsSnap = await getDocs(userPostsQuery);
        
        let views = 0;
        let likes = 0;
        const userPostsData = userPostsSnap.docs.map(doc => {
          const data = doc.data() as Post;
          views += data.viewCount || 0;
          likes += data.likeCount || 0;
          return { id: doc.id, ...data };
        });

        const sortedUserPosts = [...userPostsData].sort((a, b) => 
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        ).slice(0, 5);

        // 2. Fetch Community Highlights (Top posts from others)
        const communityQuery = query(
          postsRef, 
          where('status', '==', 'published'),
          orderBy('likeCount', 'desc'),
          limit(3)
        );
        const communitySnap = await getDocs(communityQuery);
        const communityData = communitySnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Post))
          .filter(p => p.authorId !== user.uid);

        // 3. Fetch Recent Notifications
        const notifRef = collection(db, 'notifications');
        const notifQuery = query(
          notifRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const notifSnap = await getDocs(notifQuery);
        const notifData = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));

        setStats({
          totalPosts: userPostsSnap.size,
          totalComments: userPostsData.reduce((acc, p) => acc + (p.commentCount || 0), 0),
          totalViews: views,
          totalLikes: likes
        });
        setRecentPosts(sortedUserPosts);
        setCommunityPosts(communityData);
        setNotifications(notifData);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        handleFirestoreError(err, OperationType.LIST, 'dashboard_data');
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '+12%', up: true },
    { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: '+24%', up: true },
    { label: 'Total Likes', value: stats.totalLikes, icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', trend: '+8%', up: true },
    { label: 'Comments', value: stats.totalComments, icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '-2%', up: false },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-gray-100 dark:bg-gray-900 rounded-3xl" />
          <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {profile?.displayName}. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <Calendar size={18} />
            <span>Last 30 Days</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                stat.up ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
              )}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value.toLocaleString()}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Posts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity size={20} className="text-indigo-600" />
                Your Recent Posts
              </h3>
              <Link to="/my-posts" className="text-sm text-indigo-600 font-semibold hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentPosts.length > 0 ? recentPosts.map(post => (
                <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FileText size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{post.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(post.createdAt)} • <span className="capitalize">{post.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      {post.viewCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle size={16} />
                      {post.commentCount}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">No posts yet.</div>
              )}
            </div>
          </div>

          {/* Community Highlights */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} className="text-emerald-600" />
                Community Highlights
              </h3>
              <Link to="/" className="text-sm text-emerald-600 font-semibold hover:underline">Explore Feed</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-50 dark:divide-gray-800">
              {communityPosts.map(post => (
                <Link key={post.id} to={`/post/${post.id}`} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
                    {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">{post.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>{post.authorName}</span>
                    <div className="flex items-center gap-1">
                      <Heart size={10} className="text-red-500" fill="currentColor" />
                      {post.likeCount}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement / Quick Actions */}
        <div className="space-y-8">
          {/* Notifications Widget */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Bell size={20} className="text-orange-500" />
                Notifications
              </h3>
              <Link to="/notifications" className="text-sm text-orange-500 font-semibold hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {notifications.length > 0 ? notifications.map(notif => (
                <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(notif.createdAt)}</span>
                </div>
              )) : (
                <div className="p-8 text-center text-gray-500 text-sm">No new notifications.</div>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Unlock advanced analytics, custom domains, and team collaboration features.
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
              View Plans
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Platform Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Avg. Engagement', value: '4.2%', color: 'bg-blue-500' },
                { label: 'Retention Rate', value: '88%', color: 'bg-emerald-500' },
                { label: 'Growth', value: '+12.5%', color: 'bg-indigo-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", item.color)} style={{ width: item.value.includes('%') ? item.value : '50%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
