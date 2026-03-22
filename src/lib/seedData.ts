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
    uid: 'user_5',
    email: 'david.kim@example.com',
    displayName: 'David Kim',
    photoURL: 'https://picsum.photos/seed/david/200/200',
    role: 'viewer',
    bio: 'Foodie and amateur chef. Documenting my culinary adventures.'
  },
  {
    uid: 'user_6',
    email: 'maya.patel@example.com',
    displayName: 'Maya Patel',
    photoURL: 'https://picsum.photos/seed/maya/200/200',
    role: 'editor',
    bio: 'Sustainability advocate and urban gardener. Growing green in the concrete jungle.'
  },
  {
    uid: 'guest_user_123',
    email: 'guest@example.com',
    displayName: 'Guest Explorer',
    photoURL: 'https://ui-avatars.com/api/?name=Guest+Explorer&background=10b981&color=fff',
    role: 'admin',
    bio: 'I am exploring the platform as a guest.'
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
    title: 'Sustainable Urban Gardening',
    content: 'You don\'t need a backyard to grow your own food. Urban gardening is a powerful way to connect with nature and reduce your carbon footprint. In this guide, I share how to start a balcony garden from scratch.',
    excerpt: 'How to grow your own food in the heart of the city.',
    authorId: 'user_6',
    authorName: 'Maya Patel',
    authorPhoto: 'https://picsum.photos/seed/maya/200/200',
    status: 'published',
    category: 'Lifestyle',
    tags: ['gardening', 'sustainability', 'urban'],
    imageUrl: 'https://picsum.photos/seed/garden/1200/600',
    viewCount: 670,
    likeCount: 42,
    commentCount: 7
  },
  {
    title: 'The Secret to Perfect Homemade Ramen',
    content: 'The broth is everything. After years of experimenting, I\'ve finally perfected my 12-hour tonkotsu broth recipe. The key is in the quality of the bones and the patience of the cook.',
    excerpt: 'A deep dive into the art of making authentic ramen at home.',
    authorId: 'user_5',
    authorName: 'David Kim',
    authorPhoto: 'https://picsum.photos/seed/david/200/200',
    status: 'published',
    category: 'Health',
    tags: ['cooking', 'ramen', 'foodie'],
    imageUrl: 'https://picsum.photos/seed/ramen/1200/600',
    viewCount: 1500,
    likeCount: 98,
    commentCount: 15
  },
  {
    title: 'Understanding Neural Networks',
    content: 'Neural networks are the backbone of modern AI. But how do they actually work? In this post, we break down the mathematics and logic behind backpropagation and gradient descent in simple terms.',
    excerpt: 'Demystifying the core technology behind the AI revolution.',
    authorId: 'user_4',
    authorName: 'Elena Volkov',
    authorPhoto: 'https://picsum.photos/seed/elena/200/200',
    status: 'published',
    category: 'Technology',
    tags: ['ai', 'machinelearning', 'data'],
    imageUrl: 'https://picsum.photos/seed/ai/1200/600',
    viewCount: 3200,
    likeCount: 210,
    commentCount: 35
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
  },
  {
    title: 'Mastering Tailwind CSS Grid',
    content: 'Tailwind CSS has revolutionized how we build layouts. Grid is one of the most powerful tools in its arsenal. In this post, we build a complex dashboard layout using only utility classes.',
    excerpt: 'A deep dive into building complex layouts with Tailwind Grid.',
    authorId: 'user_1',
    authorName: 'Alex Rivera',
    authorPhoto: 'https://picsum.photos/seed/alex/200/200',
    status: 'published',
    category: 'Technology',
    tags: ['tailwind', 'css', 'frontend'],
    imageUrl: 'https://picsum.photos/seed/grid/1200/600',
    viewCount: 950,
    likeCount: 74,
    commentCount: 10
  },
  {
    title: 'A Weekend in the Swiss Alps',
    content: 'The air is crisper, the peaks are higher, and the views are simply breathtaking. My recent trip to Zermatt was a reminder of how small we are in the face of nature.',
    excerpt: 'Breathtaking views and crisp air: my Zermatt adventure.',
    authorId: 'user_2',
    authorName: 'Sarah Chen',
    authorPhoto: 'https://picsum.photos/seed/sarah/200/200',
    status: 'published',
    category: 'Travel',
    tags: ['switzerland', 'alps', 'hiking'],
    imageUrl: 'https://picsum.photos/seed/alps/1200/600',
    viewCount: 1800,
    likeCount: 132,
    commentCount: 18
  },
  {
    title: 'Ethics in Artificial Intelligence',
    content: 'As AI becomes more integrated into our lives, the ethical implications grow. We must ask ourselves: who is responsible for the decisions made by algorithms?',
    excerpt: 'Exploring the moral landscape of the AI revolution.',
    authorId: 'user_4',
    authorName: 'Elena Volkov',
    authorPhoto: 'https://picsum.photos/seed/elena/200/200',
    status: 'published',
    category: 'Technology',
    tags: ['ethics', 'ai', 'philosophy'],
    imageUrl: 'https://picsum.photos/seed/ethics/1200/600',
    viewCount: 2400,
    likeCount: 185,
    commentCount: 29
  },
  {
    title: 'The Joy of Composting',
    content: 'Turning kitchen scraps into black gold is one of the most satisfying things you can do for your garden. It\'s simple, effective, and great for the planet.',
    excerpt: 'How to turn your kitchen waste into nutrient-rich soil.',
    authorId: 'user_6',
    authorName: 'Maya Patel',
    authorPhoto: 'https://picsum.photos/seed/maya/200/200',
    status: 'published',
    category: 'Lifestyle',
    tags: ['composting', 'gardening', 'eco'],
    imageUrl: 'https://picsum.photos/seed/compost/1200/600',
    viewCount: 540,
    likeCount: 38,
    commentCount: 6
  },
  {
    title: 'The Future of Remote Work',
    content: 'Remote work is here to stay. But how do we maintain culture and connection in a distributed team? In this post, I share my experiences working with global teams and the tools that make it possible.',
    excerpt: 'Building culture and connection in a distributed world.',
    authorId: 'user_3',
    authorName: 'Marcus Jordan',
    authorPhoto: 'https://picsum.photos/seed/marcus/200/200',
    status: 'published',
    category: 'Business',
    tags: ['remotework', 'culture', 'teams'],
    imageUrl: 'https://picsum.photos/seed/remote/1200/600',
    viewCount: 1100,
    likeCount: 82,
    commentCount: 14
  },
  {
    title: '10-Minute Healthy Breakfasts',
    content: 'Mornings are busy, but that doesn\'t mean you should skip breakfast. Here are 5 healthy and delicious recipes that you can whip up in under 10 minutes.',
    excerpt: 'Quick, healthy, and delicious morning fuel.',
    authorId: 'user_5',
    authorName: 'David Kim',
    authorPhoto: 'https://picsum.photos/seed/david/200/200',
    status: 'published',
    category: 'Health',
    tags: ['breakfast', 'healthy', 'quick'],
    imageUrl: 'https://picsum.photos/seed/breakfast/1200/600',
    viewCount: 1350,
    likeCount: 94,
    commentCount: 11
  }
];

export async function seedDatabase() {
  console.log('Starting seed...');

  try {
    // 1. Create User Profiles
    console.log('Seeding users...');
    for (const userData of SAMPLE_USERS) {
      const userRef = doc(db, 'users', userData.uid);
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp()
      }, { merge: true });
    }

    // 2. Create Posts
    console.log('Seeding posts...');
    const postSnap = await getDocs(collection(db, 'posts'));
    const existingPostIds = postSnap.docs.map(d => d.id);

    for (const postData of SAMPLE_POSTS) {
      const postSlug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (!existingPostIds.includes(postSlug)) {
        const postRef = doc(db, 'posts', postSlug);
        await setDoc(postRef, {
          ...postData,
          id: postSlug,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // 3. Add some comments to each post
        const comments = [
          {
            postId: postSlug,
            authorId: 'user_2',
            authorName: 'Sarah Chen',
            authorPhoto: 'https://picsum.photos/seed/sarah/200/200',
            text: 'Great insights! I especially agree with the points mentioned.',
            createdAt: serverTimestamp(),
            likeCount: 5
          },
          {
            postId: postSlug,
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
    console.log('Seeding follows...');
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
    console.log('Seeding notifications...');
    const notifications = [
      {
        id: 'notif_1',
        userId: 'guest_user_123',
        fromUserId: 'user_1',
        fromUserName: 'Alex Rivera',
        fromUserPhoto: 'https://picsum.photos/seed/alex/200/200',
        type: 'follow',
        message: 'started following you',
        link: '/profile/user_1',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_2',
        userId: 'guest_user_123',
        fromUserId: 'user_2',
        fromUserName: 'Sarah Chen',
        fromUserPhoto: 'https://picsum.photos/seed/sarah/200/200',
        type: 'like',
        message: 'liked your post: My First Post as a Guest',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_3',
        userId: 'guest_user_123',
        fromUserId: 'user_3',
        fromUserName: 'Marcus Jordan',
        fromUserPhoto: 'https://picsum.photos/seed/marcus/200/200',
        type: 'comment',
        message: 'commented on your post: The Art of Productivity',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_4',
        userId: 'guest_user_123',
        fromUserId: 'user_4',
        fromUserName: 'Elena Volkov',
        fromUserPhoto: 'https://picsum.photos/seed/elena/200/200',
        type: 'follow',
        message: 'started following you',
        link: '/profile/user_4',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_5',
        userId: 'guest_user_123',
        fromUserId: 'user_5',
        fromUserName: 'David Kim',
        fromUserPhoto: 'https://picsum.photos/seed/david/200/200',
        type: 'like',
        message: 'liked your post: The Art of Productivity',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_6',
        userId: 'guest_user_123',
        fromUserId: 'user_6',
        fromUserName: 'Maya Patel',
        fromUserPhoto: 'https://picsum.photos/seed/maya/200/200',
        type: 'mention',
        message: 'mentioned you in a post: The Joy of Composting',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_7',
        userId: 'guest_user_123',
        fromUserId: 'system',
        fromUserName: 'System',
        fromUserPhoto: 'https://ui-avatars.com/api/?name=System&background=6366f1&color=fff',
        type: 'system',
        message: 'Your post "My First Post as a Guest" reached 100 views!',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_8',
        userId: 'guest_user_123',
        fromUserId: 'user_5',
        fromUserName: 'David Kim',
        fromUserPhoto: 'https://picsum.photos/seed/david/200/200',
        type: 'comment',
        message: 'commented on your post: My First Post as a Guest',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_9',
        userId: 'guest_user_123',
        fromUserId: 'user_6',
        fromUserName: 'Maya Patel',
        fromUserPhoto: 'https://picsum.photos/seed/maya/200/200',
        type: 'like',
        message: 'liked your post: The Art of Productivity',
        link: '/post/some_id',
        read: false,
        createdAt: serverTimestamp()
      },
      {
        id: 'notif_10',
        userId: 'guest_user_123',
        fromUserId: 'user_3',
        fromUserName: 'Marcus Jordan',
        fromUserPhoto: 'https://picsum.photos/seed/marcus/200/200',
        type: 'follow',
        message: 'started following you',
        link: '/profile/user_3',
        read: false,
        createdAt: serverTimestamp()
      }
    ];

    for (const notif of notifications) {
      const { id, ...data } = notif;
      await setDoc(doc(db, 'notifications', id), data, { merge: true });
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}
