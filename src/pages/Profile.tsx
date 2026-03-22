import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, setDoc, deleteDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Post } from '../types';
import PostCard from '../components/PostCard';
import { motion } from 'motion/react';
import { MapPin, Link as LinkIcon, Calendar, Users, FileText, Heart } from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function Profile() {
  const { uid } = useParams();
  const { user, profile: myProfile } = useAuth();
  const targetUid = uid || user?.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    photoURL: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && user?.uid === targetUid) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        photoURL: profile.photoURL || '',
        location: profile.location || ''
      });
    }
  }, [profile, user, targetUid]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), editForm);
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!targetUid) return;

    // Fetch Profile
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', targetUid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${targetUid}`);
      }
    };

    fetchProfile();

    // Check if following
    if (user && user.uid !== targetUid) {
      const followId = `${user.uid}_${targetUid}`;
      const unsubscribe = onSnapshot(doc(db, 'follows', followId), (doc) => {
        setIsFollowing(doc.exists());
      });
      return () => unsubscribe();
    }
  }, [targetUid, user]);

  useEffect(() => {
    if (!targetUid) return;

    // Fetch Followers Count
    const followersQuery = query(collection(db, 'follows'), where('followingId', '==', targetUid));
    const unsubFollowers = onSnapshot(followersQuery, (snap) => {
      setFollowerCount(snap.size);
    });

    // Fetch Following Count
    const followingQuery = query(collection(db, 'follows'), where('followerId', '==', targetUid));
    const unsubFollowing = onSnapshot(followingQuery, (snap) => {
      setFollowingCount(snap.size);
    });

    // Fetch User Posts
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', targetUid),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const unsubPosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'user_posts');
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubPosts();
    };
  }, [targetUid]);

  const handleFollow = async () => {
    if (!user || !targetUid || user.uid === targetUid) return;

    const followId = `${user.uid}_${targetUid}`;
    const followRef = doc(db, 'follows', followId);

    try {
      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: targetUid,
          createdAt: new Date()
        });

        // Create notification
        await setDoc(doc(collection(db, 'notifications')), {
          userId: targetUid,
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

  if (loading) return <div className="animate-pulse h-screen bg-gray-100 dark:bg-gray-900 rounded-3xl" />;
  if (!profile) return <div className="text-center py-20">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="h-48 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <img 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
              alt={profile.displayName || ''}
              className="w-32 h-32 rounded-3xl border-4 border-white dark:border-gray-900 object-cover shadow-xl"
            />
            <div className="flex gap-3">
              {user?.uid === targetUid ? (
                isEditing ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Edit Profile
                  </button>
                )
              ) : (
                <>
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-6 py-2 font-bold rounded-xl transition-all shadow-lg dark:shadow-none",
                      isFollowing 
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700" 
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                    )}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Display Name</label>
                  <input 
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Avatar URL</label>
                  <input 
                    type="text"
                    value={editForm.photoURL}
                    onChange={(e) => setEditForm(prev => ({ ...prev, photoURL: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bio</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Location</label>
                  <input 
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h1>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">@{profile.email.split('@')[0]}</p>
                </div>

                <p className="text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">
                  {profile.bio || "No bio yet. This user is busy creating amazing content!"}
                </p>

                <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-600" />
                    <span>{profile.location || "Earth"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkIcon size={18} className="text-indigo-600" />
                    <a href="#" className="hover:text-indigo-600 transition-colors">portfolio.com</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-600" />
                    <span>Joined {formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-8 pt-4 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{followerCount}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{followingCount}</span>
                <span className="text-sm text-gray-500">Following</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{posts.length}</span>
                <span className="text-sm text-gray-500">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-800">
          <button className="px-4 py-3 border-b-2 border-indigo-600 text-indigo-600 font-bold text-sm">Posts</button>
          <button className="px-4 py-3 text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors">About</button>
          <button className="px-4 py-3 text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Liked</button>
        </div>

        <div className="grid gap-6">
          {posts.length > 0 ? posts.map(post => (
            <PostCard key={post.id} post={post} />
          )) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-gray-500">This user hasn't published any posts yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
