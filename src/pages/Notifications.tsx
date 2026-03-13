import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { motion } from 'motion/react';
import { Bell, MessageCircle, Heart, UserPlus, CheckCircle2, Trash2 } from 'lucide-react';
import { timeAgo } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notif => {
      if (!notif.read) {
        batch.update(doc(db, 'notifications', notif.id), { read: true });
      }
    });
    await batch.commit();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="text-blue-500" size={18} />;
      case 'like': return <Heart className="text-red-500" size={18} />;
      case 'mention': return <UserPlus className="text-indigo-500" size={18} />;
      default: return <Bell className="text-gray-500" size={18} />;
    }
  };

  if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with your latest interactions.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <CheckCircle2 size={18} />
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {notifications.map((notif, index) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
              >
                <div className={`p-3 rounded-xl ${!notif.read ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'} shadow-sm`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.read ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-bold">All caught up!</h3>
            <p className="text-gray-500 text-sm mt-1">No new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
