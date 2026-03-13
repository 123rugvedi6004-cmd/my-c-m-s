import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Bell, Shield, Palette, Globe, Save, Check } from 'lucide-react';

export default function Settings() {
  const { profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        bio
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
  ];

  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeSection === section.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <section.icon size={20} />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {activeSection === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Public Profile</h3>
                  <p className="text-gray-500 text-sm">Manage how others see you on the platform.</p>
                </div>

                <div className="flex items-center gap-6">
                  <img 
                    src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-gray-50 dark:border-gray-800"
                    alt=""
                  />
                  <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm">
                    Change Avatar
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-transparent focus:border-indigo-600 border rounded-xl outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Bio</label>
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-transparent focus:border-indigo-600 border rounded-xl outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-xs text-gray-400 italic">Last updated: {formatDate(profile?.createdAt)}</p>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                  >
                    {saved ? <Check size={18} /> : <Save size={18} />}
                    <span>{loading ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {activeSection !== 'profile' && (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-bold">Coming Soon</h3>
                <p className="text-gray-500 text-sm mt-1">This settings module is currently under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { formatDate } from '../lib/utils';
