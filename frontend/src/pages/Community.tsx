// ForgeFit AI - Community Feed & Leaderboard Page (v4.3)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { trackEvent } from '../services/analytics';
import { 
  Heart, 
  MessageSquare, 
  Send, 
  Plus, 
  Trophy, 
  Award,
  Calendar,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LocalComment {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface LocalPost {
  id: string;
  name: string;
  content: string;
  likes: number;
  liked: boolean;
  comments: LocalComment[];
  created_at: string;
}

export default function Community() {
  const { profile } = useAuth();
  const { challenges } = useFitnessData();

  // Local state for community to keep feed fully reactive in simulator mode
  const [feed, setFeed] = useState<LocalPost[]>([
    {
      id: 'p-1',
      name: 'David Goggins',
      content: 'Logged my 100th workout today! Centurion Lifter badge unlocked 🎖️ progressive overload is real. Stay hard!',
      likes: 24,
      liked: false,
      comments: [
        { id: 'c-1', name: 'Arnold S', content: 'Fantastic pump! Keep lifting heavy!', created_at: new Date().toISOString() }
      ],
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'p-2',
      name: 'Sarah Connor',
      content: 'First time trying out the 3D Anatomy muscle map to isolate my lower traps. Selected the Cable Chest Fly alternatives. High readiness score today!',
      likes: 12,
      liked: false,
      comments: [],
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const [postContent, setPostContent] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  if (!profile) return null;

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const newPost: LocalPost = {
      id: 'p-' + Math.random().toString(36).substring(2, 9),
      name: profile.name,
      content: postContent,
      likes: 0,
      liked: false,
      comments: [],
      created_at: new Date().toISOString()
    };

    setFeed(prev => [newPost, ...prev]);
    try {
      trackEvent('Community Post Created', { contentLength: postContent.length });
    } catch (e) {}
    setPostContent('');
    confetti({ particleCount: 30, spread: 60, colors: ['#2563eb', '#7c3aed'] });
  };

  const handleToggleLike = (id: string) => {
    setFeed(prev => prev.map(post => {
      if (post.id === id) {
        const nextLiked = !post.liked;
        const nextLikes = nextLiked ? post.likes + 1 : post.likes - 1;
        if (nextLiked) {
          confetti({ particleCount: 15, angle: 60, spread: 55, origin: { x: 0 } });
        }
        return { ...post, liked: nextLiked, likes: nextLikes };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;

    const comment: LocalComment = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      name: profile.name,
      content: commentText,
      created_at: new Date().toISOString()
    };

    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, comment] };
      }
      return post;
    }));

    setCommentText('');
    setActiveCommentPostId(null);
  };

  // Gamification Leaderboard Mock users list
  const leaderboard = [
    { name: 'Chris Bumstead', level: 42, xp: 9500, rank: 1 },
    { name: 'David Goggins', level: 35, xp: 4800, rank: 2 },
    { name: profile.name, level: profile.level, xp: profile.xp, rank: 3, isSelf: true },
    { name: 'Sarah Connor', level: 12, xp: 800, rank: 4 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Main Feed (Left / Center) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Post Creator */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-extrabold text-sm text-white">Share Your Progress</h3>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea 
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="What did you lift today? Share workout logs, calorie wins, or streak updates..."
              className="glass-input h-20 resize-none text-xs"
              required
            />
            <div className="flex justify-end">
              <button 
                type="submit"
                className="glass-btn-primary flex items-center gap-1 text-xs py-2"
              >
                <Send className="w-3.5 h-3.5" /> Publish
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {feed.map((post) => (
            <div key={post.id} className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
              
              {/* Header profile card */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-slate-300">
                  {post.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">{post.name}</h4>
                  <span className="text-[9px] text-slate-500">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Content text */}
              <p className="text-slate-300 text-xs leading-relaxed">{post.content}</p>

              {/* Likes & Comments Counters */}
              <div className="flex gap-4 border-t border-b border-white/5 py-2.5 text-slate-500 font-bold text-[10px] uppercase">
                <button 
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-1.5 transition-colors ${
                    post.liked ? 'text-red-500' : 'hover:text-slate-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} />
                  <span>{post.likes} Likes</span>
                </button>

                <button 
                  onClick={() => {
                    setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                    setCommentText('');
                  }}
                  className="flex items-center gap-1.5 hover:text-slate-300"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.comments.length} Comments</span>
                </button>
              </div>

              {/* Display nested comments */}
              {post.comments.length > 0 && (
                <div className="space-y-2.5 bg-white/5 p-3 rounded-2xl border border-white/5">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-300">{comment.name}</span>
                        <span className="text-[8px] text-slate-600">commented</span>
                      </div>
                      <p className="text-slate-400 leading-normal">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Write comments inputs */}
              {activeCommentPostId === post.id && (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="glass-input py-1.5 text-xs"
                  />
                  <button 
                    onClick={() => handleAddComment(post.id)}
                    className="glass-btn-primary py-1.5 text-xs"
                  >
                    Send
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* 2. Side Panels: challenges & Leaderboards (Right side) */}
      <div className="space-y-6">
        
        {/* Global Gamification Leaderboard */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-brand-blue" />
            Global XP Leaderboard
          </h3>

          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div 
                key={user.name} 
                className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                  user.isSelf 
                    ? 'border-brand-blue/30 bg-brand-blue/5' 
                    : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    user.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                    user.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                    'bg-slate-600/20 text-slate-500'
                  }`}>
                    {user.rank}
                  </span>
                  <span className="font-bold text-white">{user.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-brand-blue">Lv. {user.level}</div>
                  <div className="text-[9px] text-slate-500 font-medium">{user.xp} XP total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Challenges */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-blue" />
            Community Challenges
          </h3>

          <div className="space-y-3">
            {challenges.map((c) => {
              const handleJoin = () => {
                trackEvent('Challenge Joined', { challengeId: c.id, challengeName: c.name });
                confetti({ particleCount: 20, spread: 40 });
              };
              return (
                <div key={c.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-xs">{c.name}</span>
                    <span className="text-[9px] bg-brand-blue/15 text-brand-blue px-2 py-0.5 rounded-full font-bold">+{c.xp_reward} XP</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{c.description}</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-brand-blue h-full" style={{ width: '40%' }} />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                    <span>Joined | 40% Complete</span>
                    <span>{c.duration_days} Days Left</span>
                  </div>
                  <button 
                    onClick={handleJoin}
                    className="w-full mt-2 py-1.5 bg-brand-blue/10 border border-brand-blue/20 hover:border-brand-blue/40 text-brand-blue text-[10px] font-bold rounded-lg transition-all"
                  >
                    Re-verify Participation
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
