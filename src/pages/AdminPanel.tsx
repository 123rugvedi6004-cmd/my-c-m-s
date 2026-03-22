import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post, UserProfile } from '../types';
import { motion } from 'motion/react';
import { Shield, Users, FileText, Trash2, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { seedDatabase } from '../lib/seedData';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [seeding, setSeeding] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const handleUpdateRole = async (uid: string, newRole: string) => {
    setUpdatingRole(true);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as any } : u));
      setEditingUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('This will populate the database with sample users and posts. Continue?')) return;
    setSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully! Refreshing...');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to seed database.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setPosts(prev => prev.filter(p => p.id !== post.id));

      // Notify author
      await addDoc(collection(db, 'notifications'), {
        userId: post.authorId,
        fromUserId: 'system',
        fromUserName: 'Admin',
        fromUserPhoto: 'https://ui-avatars.com/api/?name=Admin&background=ef4444&color=fff',
        postId: post.id,
        type: 'post_removed',
        message: `Your post "${post.title}" was removed by an admin for violating community guidelines.`,
        link: '/',
        read: false,
        createdAt: new Date()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${post.id}`);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
        const postsSnap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)));
        
        setUsers(usersSnap.docs.map(d => d.data() as UserProfile));
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'admin_data');
      }
    };

    fetchData();
  }, [isAdmin]);

  if (!isAdmin) return <div className="p-20 text-center">Unauthorized access.</div>;
  if (loading) return <div className="animate-pulse h-screen bg-gray-100 dark:bg-gray-900 rounded-3xl" />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
          <Shield size={32} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Control Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users, moderate content, and monitor platform health.</p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Database size={18} />
            {seeding ? 'Seeding...' : 'Seed Platform Data'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-1 rounded-2xl border border-gray-200 dark:border-gray-800 w-fit">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Users size={18} />
          Users
        </button>
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'posts' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <FileText size={18} />
          Posts
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full" alt="" />
                        <div>
                          <p className="font-bold text-sm">{u.displayName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-red-50 text-red-600' : u.role === 'editor' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      {editingUser?.uid === u.uid ? (
                        <div className="flex items-center gap-2">
                          <select 
                            className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none"
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                            disabled={updatingRole}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button 
                            onClick={() => setEditingUser(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="text-indigo-600 hover:underline text-sm font-bold"
                        >
                          Edit Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Post Title</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {posts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm truncate max-w-xs">{p.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.authorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        p.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleDeletePost(p)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                          <AlertTriangle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
