import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, MessageSquare, Sparkles, Plus, BookOpen, Coffee, Brain } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { User, Task } from '../types';

import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AIAssistantProps {
  user: User;
  tasks: Task[];
  onTaskAdded: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant({ user, tasks, onTaskAdded }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate initial message based on user state
  useEffect(() => {
    if (messages.length === 0) {
      const pendingTasks = tasks.filter(t => !t.completed).length;
      let greeting = `Hi ${user.streak_count > 0 ? 'Champ' : 'there'}! I'm your Focus Kar assistant. `;
      
      if (user.streak_count >= 3) {
        greeting += `Incredible job on your ${user.streak_count}-day streak! You're becoming a discipline machine. `;
      } else if (pendingTasks > 3) {
        greeting += `You have ${pendingTasks} tasks waiting for you. Let's pick one and crush it together! `;
      } else if (user.experience > 800) {
        greeting += `You're so close to Level ${user.level + 1}! One more focus session should do it. `;
      } else {
        greeting += `How can I help you stay disciplined today? You can ask me for focus tips or tell me to add a study session.`;
      }
      
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [user, tasks]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: `You are the Focus Kar AI Assistant. Your goal is to help the user stay focused and productive. 
          
          CORE BEHAVIORS:
          1. APPRECIATION: If the user has a high streak (${user.streak_count}), high level (${user.level}), or has completed many tasks, APPRECIATE their discipline. Use words like "Champ", "Warrior", "Disciplined".
          2. MOTIVATION: If the user seems distracted, has many pending tasks (${tasks.filter(t => !t.completed).length}), or is struggling, MOTIVATE them. Remind them why they started. Use strong, stoic, but supportive language.
          3. TASK MANAGEMENT: You can help them add tasks like "study sessions" or "work blocks". Use the 'addTask' tool for this.
          
          TONE: Disciplined, concise, professional, and supportive. Think "Elite Performance Coach".
          
          CURRENT CONTEXT:
          - User Level: ${user.level}
          - Streak: ${user.streak_count} days
          - Pending Tasks: ${tasks.filter(t => !t.completed).length}
          - Experience: ${user.experience}/1000`,
          tools: [{
            functionDeclarations: [{
              name: "addTask",
              parameters: {
                type: Type.OBJECT,
                description: "Add a new focus task or study session for the user.",
                properties: {
                  title: { type: Type.STRING, description: "The title of the task (e.g., 'Study Math', 'Code feature')" },
                  category: { type: Type.STRING, description: "Category: 'study', 'work', or 'other'" },
                  duration: { type: Type.NUMBER, description: "Duration in minutes" }
                },
                required: ["title", "category", "duration"]
              }
            }]
          }]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'addTask') {
            const { title, category, duration } = call.args as any;
            try {
              await addDoc(collection(db, 'tasks'), {
                uid: user.uid,
                title,
                category,
                duration_minutes: duration,
                completed: 0,
                created_at: new Date().toISOString()
              });
              onTaskAdded();
              setMessages(prev => [...prev, { role: 'assistant', content: `Got it! I've added "${title}" (${duration}m) to your tasks. Ready to start?` }]);
            } catch (error) {
              handleFirestoreError(error, OperationType.CREATE, 'tasks');
            }
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm here to help you focus!" }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Stay focused anyway!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
      >
        <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-stone-50">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-28 right-8 w-96 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Bot className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Focus Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-stone-400 font-bold">ONLINE</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-stone-900 text-white rounded-tr-none' 
                    : 'bg-white text-stone-700 shadow-sm border border-stone-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-stone-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ask for focus tips or add a task..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-4 py-3 bg-stone-50 border border-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
