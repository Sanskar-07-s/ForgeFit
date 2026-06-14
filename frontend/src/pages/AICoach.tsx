// ForgeFit AI - Conversational Coach Chat Console Page (v4.4)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFitnessData } from '../context/FitnessDataContext';
import { askCoach, getUsageStatus, ChatMessage, UsageStatus } from '../services/gemini';
import { trackEvent } from '../services/analytics';
import { 
  Sparkles, 
  Send, 
  Cpu, 
  MessageCircleQuestion,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

const GEMINI_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';

export default function AICoach() {
  const { profile } = useAuth();
  const { workoutLogs, nutritionLogs, recoveryLogs, supplementLogs } = useFitnessData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [querying, setQuerying] = useState(false);
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize messages welcome
  useEffect(() => {
    if (profile) {
      setMessages([
        {
          role: 'coach',
          content: `Hi ${profile.name}! I am your ForgeFit AI coach. I have compiled your compact health summaries and parsed your goal to **${profile.goal}**. How can I help you adjust your routine or optimize your nutrition targets today?`
        }
      ]);
      fetchUsage();
    }
  }, [profile]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsage = async () => {
    if (profile) {
      try {
        const status = await getUsageStatus({ id: profile.id, role: profile.role });
        setUsageStatus(status);
      } catch (err) {
        console.warn('Failed to fetch AI usage statistics:', err);
      }
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || querying || !profile) return;

    // Refresh usage status before sending
    await fetchUsage();
    if (usageStatus?.isExceeded) {
      alert(`Limit Exceeded: You have used ${usageStatus.promptsUsed}/${usageStatus.limit} prompts.`);
      return;
    }

    if (!customText) {
      setInputText('');
    }

    const updatedHistory: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(updatedHistory);
    setQuerying(true);

    try {
      const response = await askCoach(
        textToSend,
        messages,
        profile,
        workoutLogs,
        nutritionLogs,
        recoveryLogs,
        supplementLogs
      );

      setMessages(prev => [...prev, { role: 'coach', content: response }]);
      
      // Trigger analytics tracking event
      trackEvent('AI Coach Used', {
        promptLength: textToSend.length,
        responseLength: response.length,
        goal: profile.goal
      });

      // Refetch usage stats
      fetchUsage();
    } catch (err) {
      console.error('Error generating AI coach response:', err);
    } finally {
      setQuerying(false);
    }
  };

  const presetQuestions = [
    'How should I structure my deload week?',
    'Give me form tips for my Squats.',
    'Explain my daily target protein requirement.',
    'What should I eat if my goal is to lose fat?'
  ];

  return (
    <div className="h-[80vh] flex flex-col glass-panel rounded-3xl border border-white/5 overflow-hidden" role="region" aria-label="AI Coach chat panel">
      
      {/* Chat header */}
      <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center text-white shadow-glow-blue animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Gemini Fitness Coach (v2.5)</h3>
            <span className="text-[10px] text-brand-blue font-bold uppercase tracking-wider">
              {GEMINI_KEY ? 'Live Model Connected' : 'Local Fallback Active'}
            </span>
          </div>
        </div>

        {/* AI Usage Tracker status display */}
        {usageStatus && (
          <div 
            className="text-[10px] bg-white/5 border border-white/5 px-3 py-1 rounded-xl text-slate-400 font-semibold"
            aria-live="polite"
          >
            Usage today: <strong className="text-white">{usageStatus.promptsUsed}</strong> / {usageStatus.limit === Infinity ? '∞' : usageStatus.limit} ({usageStatus.tier.toUpperCase()} Tier)
          </div>
        )}
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" tabIndex={0} aria-label="Conversation log history">
        {messages.map((msg, idx) => {
          const isCoach = msg.role === 'coach';
          return (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${
                isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {isCoach && (
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-brand-blue shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
              )}

              <div 
                className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  isCoach 
                    ? 'bg-white/5 border-white/5 text-slate-300' 
                    : 'bg-brand-blue border-brand-blue/30 text-white shadow-glow-blue'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{line}</p>
                ))}
              </div>
            </div>
          );
        })}

        {querying && (
          <div className="flex gap-3 mr-auto items-center" aria-live="polite">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-brand-blue shrink-0 animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold animate-pulse">Compiling database insights...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Limit warnings */}
      {usageStatus?.isExceeded && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 text-[10px] text-red-400 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Daily coaching credits consumed. Upgrade plan tier to Pro to get unlimited prompt executions.</span>
        </div>
      )}

      {/* Preset questions quick actions */}
      {messages.length < 3 && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/5 text-xs space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <MessageCircleQuestion className="w-3.5 h-3.5" /> Quick Coach Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="px-3.5 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-[10px] transition-all"
                disabled={usageStatus?.isExceeded}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls footer */}
      <div className="p-4 bg-white/5 border-t border-white/5">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }} 
          className="flex gap-2"
        >
          <input 
            type="text" 
            placeholder={usageStatus?.isExceeded ? "Coaching limit exceeded..." : "Ask about form, macros, overload splits..."}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="glass-input"
            disabled={querying || usageStatus?.isExceeded}
            aria-label="Message prompt input for AI coach"
          />
          <button 
            type="submit" 
            disabled={querying || !inputText.trim() || usageStatus?.isExceeded}
            className="glass-btn-primary px-4 py-2 flex items-center justify-center shrink-0 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
