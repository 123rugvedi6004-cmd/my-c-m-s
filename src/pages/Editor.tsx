import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { motion } from 'motion/react';
import { Save, Send, Image as ImageIcon, X, ChevronLeft, Eye, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          const docRef = doc(db, 'posts', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Post;
            if (data.authorId !== user?.uid && profile?.role !== 'admin') {
              navigate('/');
              return;
            }
            setTitle(data.title);
            setContent(data.content);
            setExcerpt(data.excerpt || '');
            setCategory(data.category || 'General');
            setTags(data.tags?.join(', ') || '');
            setImageUrl(data.imageUrl || '');
            setStatus(data.status);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `posts/${id}`);
        }
      };
      fetchPost();
    }
  }, [id, user, profile, navigate]);

  const handleSave = async (newStatus: 'draft' | 'published') => {
    if (!title || !content) {
      alert('Please fill in both title and content.');
      return;
    }

    setLoading(true);
    const postId = id || doc(collection(db, 'posts')).id;
    const postData: Partial<Post> = {
      title,
      content,
      excerpt,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      imageUrl,
      status: newStatus,
      updatedAt: serverTimestamp() as any,
    };

    if (!id) {
      postData.id = postId;
      postData.authorId = user?.uid;
      postData.authorName = profile?.displayName || 'Anonymous';
      postData.authorPhoto = profile?.photoURL || '';
      postData.createdAt = serverTimestamp() as any;
      postData.viewCount = 0;
      postData.likeCount = 0;
      postData.commentCount = 0;
    }

    try {
      await setDoc(doc(db, 'posts', postId), postData, { merge: true });
      navigate(newStatus === 'published' ? `/post/${postId}` : '/my-posts');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${postId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? 'Edit Post' : 'Create New Post'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <Eye size={18} />
            <span>{preview ? 'Edit Mode' : 'Preview'}</span>
          </button>
          <button 
            onClick={() => handleSave('draft')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all disabled:opacity-50"
          >
            <Save size={18} />
            <span>Save Draft</span>
          </button>
          <button 
            onClick={() => handleSave('published')}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
          >
            <Send size={18} />
            <span>{loading ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-2 space-y-6">
          {preview ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 min-h-[600px] prose dark:prose-invert max-w-none">
              <h1 className="text-4xl font-bold mb-6">{title || 'Untitled Post'}</h1>
              {imageUrl && <img src={imageUrl} alt="Cover" className="w-full h-64 object-cover rounded-2xl mb-8" />}
              <ReactMarkdown>{content || '*No content yet...*'}</ReactMarkdown>
            </div>
          ) : (
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-gray-900 dark:text-white"
              />
              
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Markdown Editor</span>
                </div>
                <textarea 
                  placeholder="Write your story here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[500px] p-8 bg-transparent outline-none resize-none text-lg leading-relaxed text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Info size={18} className="text-indigo-600" />
              Post Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-600 rounded-xl outline-none transition-all text-sm"
                >
                  <option>General</option>
                  <option>Technology</option>
                  <option>Design</option>
                  <option>Lifestyle</option>
                  <option>Business</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="react, tailwind, firebase"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-600 rounded-xl outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cover Image URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-600 rounded-xl outline-none transition-all text-sm"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-3 relative group">
                    <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                    <button 
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Excerpt (Brief Summary)</label>
                <textarea 
                  placeholder="What is this post about?"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full h-24 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-indigo-600 rounded-xl outline-none transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-2">Writing Tip</h4>
            <p className="text-indigo-800/70 dark:text-indigo-300/70 text-xs leading-relaxed">
              Use Markdown to format your post. You can add headers, lists, code blocks, and more to make your content engaging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
