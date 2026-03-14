import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, UserCircle } from 'lucide-react';
import { seedDatabase } from '../lib/seedData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { loginAsGuest, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    setLoading(true);
    try {
      loginAsGuest();
      navigate('/');
    } catch (err: any) {
      setError('Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google login is DISABLED in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError('Google login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password auth is DISABLED in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 lg:p-12 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-8 shadow-xl shadow-indigo-500/20">
            C
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-10">
            Sign in to manage your content and engage with the community.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              
              {error.includes('DISABLED') && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-red-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300">
                  <p className="font-semibold text-red-700 dark:text-white mb-1">Quick Fix Steps:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-emerald-400 underline">Firebase Console</a></li>
                    <li>Authentication &gt; Sign-in method</li>
                    <li>Enable the required provider</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            {!showEmailForm ? (
              <>
                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
                </button>

                <button 
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <UserCircle size={20} />
                  <span>{loading ? 'Entering...' : 'Guest Session (No Login)'}</span>
                </button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowEmailForm(true)}
                  className="w-full flex items-center justify-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold py-3 px-6 rounded-xl transition-all"
                >
                  <Mail size={20} />
                  <span>Email Address</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="w-full text-sm text-gray-500 hover:text-indigo-600 transition-all text-center"
                >
                  Back to other options
                </button>
              </form>
            )}
          </div>

          <p className="mt-10 text-xs text-gray-400 dark:text-gray-500">
            By signing in, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
