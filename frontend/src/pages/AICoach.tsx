// ForgeFit AI - AI Coach v5.0 — ChatGPT-style Premium Chat Experience

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { askCoach, getUsageStatus, ChatMessage, UsageStatus } from '../services/gemini';
import { trackEvent } from '../services/analytics';
import {
  Send,
  Cpu,
  Sparkles,
  AlertCircle,
  Dumbbell,
  Utensils,
  Heart,
  Target,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { MotionButton } from '../components/MotionButton';

const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';

// ── Quick action chips ─────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Create Workout',  icon: Dumbbell,  prompt: 'Create me a personalized workout for today based on my goal and recovery status.' },
  { label: 'Meal Advice',     icon: Utensils,  prompt: 'What should I eat today to hit my calorie and protein targets?' },
  { label: 'Check Recovery',  icon: Heart,     prompt: 'How is my recovery looking? Which muscle groups are ready to train?' },
  { label: 'Goal Review',     icon: Target,    prompt: 'Review my progress toward my fitness goal and suggest what I should prioritize this week.' },
];

// ── Streaming Text Reveal component ──────────────────────
const StreamingText = ({ content, enabled }: { content: string; enabled: boolean }) => {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : content);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(content);
      return () => {};
    }

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, index + 1));
      index++;
      if (index >= content.length) {
        clearInterval(interval);
      }
    }, 12); // Reveal character every 12ms for fast feedback

    return () => clearInterval(interval);
  }, [content, enabled]);

  return (
    <>
      {displayedText.split('\n').map((line, i) => (
        <p key={i} className={i > 0 && line !== '' ? 'mt-2' : i > 0 ? 'mt-1' : ''}>
          {line}
        </p>
      ))}
    </>
  );
};

// ── Typing indicator ──────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex gap-3 mr-auto items-end">
    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.2)' }}>
      <Cpu className="w-4 h-4 text-brand-cyan" />
    </div>
    <div className="bubble-coach px-4 py-3 flex items-center gap-1.5">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  </div>
);

// ── Message bubble ────────────────────────────────────────
const MessageBubble = ({ msg, index, isLatest }: { msg: ChatMessage; index: number; isLatest: boolean }) => {
  const isCoach = msg.role === 'coach';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex gap-3 ${isCoach ? 'mr-auto max-w-[85%]' : 'ml-auto max-w-[80%] flex-row-reverse'}`}
    >
      {isCoach && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 animate-scale-in"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(34,211,238,0.2)' }}>
          <Cpu className="w-4 h-4 text-brand-cyan" />
        </div>
      )}

      <div className={`px-4 py-3 text-sm leading-relaxed ${isCoach ? 'bubble-coach text-slate-200' : 'bubble-user text-white'}`}>
        <StreamingText content={msg.content} enabled={isCoach && isLatest} />
      </div>
    </motion.div>
  );
};

export default function AICoach() {
  const { profile } = useAuth();
  const { workoutLogs, nutritionLogs, recoveryLogs, supplementLogs } = useFitnessData();

  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [inputText,    setInputText]    = useState('');
  const [querying,     setQuerying]     = useState(false);
  const [usageStatus,  setUsageStatus]  = useState<UsageStatus | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef       = useRef<HTMLInputElement | null>(null);

  // ── Initialize ─────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setMessages([{
        role: 'coach',
        content: `Hey ${profile.name || 'Champion'}! 👋 I'm your ForgeFit AI Coach, powered by Gemini.\n\nI've reviewed your profile and goal to **${profile.goal}**. I can help you optimize your workouts, nutrition, and recovery.\n\nWhat do you need today?`,
      }]);
      fetchUsage();
    }
  }, [profile]);

  // ── Auto scroll ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, querying]);

  const fetchUsage = async () => {
    if (!profile) return;
    try {
      const status = await getUsageStatus({ id: profile.id, role: profile.role });
      setUsageStatus(status);
    } catch (_) {}
  };

  // ── Send message ───────────────────────────────────────
  const handleSend = useCallback(async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || querying || !profile) return;

    await fetchUsage();
    if (usageStatus?.isExceeded) return;

    if (!customText) setInputText('');
    setShowQuickActions(false);

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(history);
    setQuerying(true);

    try {
      const response = await askCoach(text, messages, profile, workoutLogs, nutritionLogs, recoveryLogs, supplementLogs);
      setMessages(prev => [...prev, { role: 'coach', content: response }]);
      trackEvent('AI Coach Used', { promptLength: text.length, responseLength: response.length, goal: profile.goal });
      fetchUsage();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'coach', content: 'Sorry, I had trouble processing that. Please try again.' }]);
    } finally {
      setQuerying(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [inputText, querying, profile, messages, usageStatus, workoutLogs, nutritionLogs, recoveryLogs, supplementLogs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <GlassCard
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{ height: 'calc(100vh - 140px)', minHeight: '500px' }}
      glowColor="#22D3EE"
      disabled
    >
      {/* ── Header ── */}
      <div className="border-b border-dark-border/30 bg-white/5 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center glow-pulse"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(34,211,238,0.25)' }}>
            <Cpu className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">ForgeFit AI Coach</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
              <span className="text-xs text-brand-emerald font-medium">{GEMINI_KEY ? 'Gemini 2.5 Flash — Live' : 'Fallback Active'}</span>
            </div>
          </div>
        </div>

        {usageStatus && (
          <div className="text-xs px-3 py-1.5 rounded-xl text-slate-400 font-medium"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-white font-bold">{usageStatus.promptsUsed}</span>
            {' / '}{usageStatus.limit === Infinity ? '∞' : usageStatus.limit} prompts
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} index={i} isLatest={i === messages.length - 1} />
        ))}

        {querying && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Actions ── */}
      {showQuickActions && messages.length <= 2 && (
        <div className="shrink-0 px-4 py-4 border-t border-dark-border/20 bg-white/[0.02]">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" /> Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  disabled={querying || usageStatus?.isExceeded}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="chip hover:chip-active flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {action.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Limit warning ── */}
      {usageStatus?.isExceeded && (
        <div className="shrink-0 px-4 py-2.5 flex items-center gap-2 text-xs text-brand-rose font-medium bg-brand-rose/10 border-t border-brand-rose/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Daily coaching credits exhausted. Upgrade to Pro for unlimited prompts.
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-dark-border/30 bg-white/5 p-4">
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-3"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={usageStatus?.isExceeded ? 'Daily limit reached…' : 'Ask about form, macros, recovery, splits…'}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={querying || usageStatus?.isExceeded}
              className="glass-input pr-4"
              aria-label="Coach prompt"
            />
          </div>
          <MotionButton
            type="submit"
            disabled={querying || !inputText.trim() || usageStatus?.isExceeded}
            variant="primary"
            size="md"
            className="px-4 py-3 shrink-0"
            ariaLabel="Send message"
          >
            {querying ? <Zap className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
          </MotionButton>
        </form>
      </div>
    </GlassCard>
  );
}
