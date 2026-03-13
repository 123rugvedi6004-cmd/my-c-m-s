import { db, collection, addDoc, serverTimestamp, setDoc, doc, getDocs } from '../firebase';
import { Timestamp } from 'firebase/firestore';
import { UserProfile, Post, Comment, Notification, Follow } from '../types';

const SAMPLE_USERS = [
  {
    uid: 'user_1',
    email: 'alex.rivera@example.com',
    displayName: 'Alex Rivera',
    photoURL: 'https://picsum.photos/seed/alex/200/200',
    role: 'editor',
    bio: 'Tech enthusiast and full-stack developer. Sharing my journey through code.'
  },
  {
    uid: 'user_2',
    email: 'sarah.chen@example.com',
    displayName: 'Sarah Chen',
    photoURL: 'https://picsum.photos/seed/sarah/200/200',
    role: 'viewer',
    bio: 'Digital nomad and travel photographer. Exploring the world one pixel at a time.'
  },
  {
    uid: 'user_3',
    email: 'marcus.jordan@example.com',
    displayName: 'Marcus Jordan',
    photoURL: 'https://picsum.photos/seed/marcus/200/200',
    role: 'viewer',
    bio: 'Coffee lover and UX designer. Obsessed with clean interfaces and accessibility.'
  },
  {
    uid: 'user_4',
    email: 'elena.v@example.com',
    displayName: 'Elena Volkov',
    photoURL: 'https://picsum.photos/seed/elena/200/200',
    role: 'editor',
    bio: 'AI researcher and data scientist. Making sense of the noise.'
  },
  {
    uid: 'guest_user_123',
    email: 'guest@example.com',
    displayName: 'Guest Explorer',
    photoURL: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
    role: 'admin',
    bio: 'I am exploring the platform as a guest.'
  },
  {
    uid: 'demo_user_id',
    email: 'demo@example.com',
    displayName: 'Demo User',
    photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
    role: 'admin',
    bio: 'This is a demo account for exploring the platform features.'
  }
];

const SAMPLE_POSTS = [
  {
    title: 'The Future of Web Development in 2026',
    content: 'Web development is evolving faster than ever. From AI-driven coding assistants to the rise of edge computing, the landscape is shifting. In this post, we explore the top 5 trends that are defining the industry this year.\n\n### 1. AI-First Frameworks\nFrameworks are now being built with AI integration at their core, allowing for smarter code generation and real-time optimizations.\n\n### 2. Edge Rendering\nMoving logic closer to the user is no longer optional. Edge functions are becoming the default for high-performance applications.',
    excerpt: 'Exploring the top 5 trends defining web development in 2026.',
    authorId: 'user_1',
    authorName: 'Alex Rivera',
    authorPhoto: 'https://picsum.photos/seed/alex/200/200',
    status: 'published',
    category: 'Technology',
    tags: ['webdev', 'ai', 'future'],
    imageUrl: 'https://picsum.photos/seed/tech/1200/600',
    viewCount: 1240,
    likeCount: 85,
    commentCount: 12
  },
  {
    title: 'Minimalism in Digital Design',
    content: 'Less is more. This age-old adage has never been more relevant in the digital space. As users are bombarded with information, clarity and simplicity become the ultimate luxury.\n\nMinimalism isn\'t just about white space; it\'s about intentionality. Every element must serve a purpose.',
    excerpt: 'Why simplicity is the ultimate luxury in modern UX design.',
    authorId: 'user_3',
    authorName: 'Marcus Jordan',
    authorPhoto: 'https://picsum.photos/seed/marcus/200/200',
    status: 'published',
    category: 'Design',
    tags: ['minimalism', 'ux', 'design'],
    imageUrl: 'https://picsum.photos/seed/design/1200/600',
    viewCount: 850,
    likeCount: 62,
    commentCount: 8
  },
  {
    title: 'Top 10 Hidden Gems in Kyoto',
    content: 'Kyoto is a city of a thousand temples, but beyond the famous landmarks like Kinkaku-ji, there are dozens of hidden spots that offer a more intimate experience of Japanese culture.\n\nFrom the quiet moss gardens of Gio-ji to the narrow alleys of Pontocho at dawn, Kyoto never ceases to amaze.',
    excerpt: 'Discovering the quiet, intimate side of Japan\'s ancient capital.',
    authorId: 'user_2',
    authorName: 'Sarah Chen',
    authorPhoto: 'https://picsum.photos/seed/sarah/200/200',
    status: 'published',
    category: 'Travel',
    tags: ['japan', 'kyoto', 'travel'],
    imageUrl: 'https://picsum.photos/seed/kyoto/1200/600',
    viewCount: 2100,
    likeCount: 145,
    commentCount: 24
  },
  {
    title: 'My First Post as a Guest',
    content: 'Hello everyone! I am exploring this amazing platform as a guest. The interface is so smooth and the community seems very welcoming. I am looking forward to seeing more content here!\n\nI love how easy it is to create and share content.',
    excerpt: 'A warm greeting from a new guest explorer.',
    authorId: 'guest_user_123',
    authorName: 'Guest Explorer',
    authorPhoto: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
    status: 'published',
    category: 'Personal',
    tags: ['welcome', 'guest', 'firstpost'],
    imageUrl: 'https://picsum.photos/seed/welcome/1200/600',
    viewCount: 450,
    likeCount: 32,
    commentCount: 5
  },
  {
    title: 'The Art of Productivity',
    content: 'Productivity is not about doing more; it\'s about doing what matters. In this post, I share my daily routine and the tools I use to stay focused and creative.\n\n1. Deep Work sessions\n2. Time blocking\n3. Digital detox',
    excerpt: 'How to stay productive in a world full of distractions.',
    authorId: 'guest_user_123',
    authorName: 'Guest Explorer',
    authorPhoto: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
    status: 'published',
    category: 'Lifestyle',
    tags: ['productivity', 'focus', 'routine'],
    imageUrl: 'https://picsum.photos/seed/productivity/1200/600',
    viewCount: 320,
    likeCount: 28,
    commentCount: 3
  }
];

export async function seedDatabase() {
  console.log('Starting seed...');

  // 1. Create User Profiles
  for (const userData of SAMPLE_USERS) {
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp()
    }, { merge: true });
  }

  // 2. Create Posts
  const postsSnap = await getDocs(collection(db, 'posts'));
  if (postsSnap.empty) {
    for (const postData of SAMPLE_POSTS) {
      const postRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Add some comments to each post
      const comments = [
        {
          postId: postRef.id,
          authorId: 'user_2',
          authorName: 'Sarah Chen',
          authorPhoto: 'https://picsum.photos/seed/sarah/200/200',
          text: 'Great insights! I especially agree with the edge rendering point.',
          createdAt: serverTimestamp(),
          likeCount: 5
        },
        {
          postId: postRef.id,
          authorId: 'user_3',
          authorName: 'Marcus Jordan',
          authorPhoto: 'https://picsum.photos/seed/marcus/200/200',
          text: 'I love the design of this blog. Very clean.',
          createdAt: serverTimestamp(),
          likeCount: 2
        }
      ];

      for (const comment of comments) {
        await addDoc(collection(db, 'comments'), comment);
      }
    }
  }

  // 4. Add some follows
  const follows = [
    { followerId: 'user_1', followingId: 'user_2', createdAt: serverTimestamp() },
    { followerId: 'user_2', followingId: 'user_1', createdAt: serverTimestamp() },
    { followerId: 'user_3', followingId: 'user_1', createdAt: serverTimestamp() },
    { followerId: 'guest_user_123', followingId: 'user_1', createdAt: serverTimestamp() },
    { followerId: 'guest_user_123', followingId: 'user_4', createdAt: serverTimestamp() },
    { followerId: 'user_1', followingId: 'guest_user_123', createdAt: serverTimestamp() }
  ];

  for (const follow of follows) {
    const followId = `${follow.followerId}_${follow.followingId}`;
    await setDoc(doc(db, 'follows', followId), follow);
  }

  // 5. Add some notifications for the guest user
  const notifications = [
    {
      userId: 'guest_user_123',
      type: 'follow',
      message: 'Alex Rivera started following you',
      link: '/profile/user_1',
      read: false,
      createdAt: serverTimestamp()
    },
    {
      userId: 'guest_user_123',
      type: 'like',
      message: 'Sarah Chen liked your post: My First Post as a Guest',
      link: '/post/some_id', // We don't have the ID yet, but it's okay for demo
      read: false,
      createdAt: serverTimestamp()
    },
    {
      userId: 'guest_user_123',
      type: 'comment',
      message: 'Marcus Jordan commented on your post: The Art of Productivity',
      link: '/post/some_id',
      read: false,
      createdAt: serverTimestamp()
    }
  ];

  const notifSnap = await getDocs(collection(db, 'notifications'));
  if (notifSnap.empty) {
    for (const notif of notifications) {
      await addDoc(collection(db, 'notifications'), notif);
    }
  }

  console.log('Seed completed successfully!');
}
