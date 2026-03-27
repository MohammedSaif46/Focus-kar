import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle,
  Plus,
  ChevronRight,
  AlertCircle,
  Globe,
  Bell,
  Youtube,
  Instagram,
  Facebook,
  Smartphone,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface DistractionBlockerProps {
  user: User;
  onBack: () => void;
  onUpdateUser: () => void;
}

export default function DistractionBlocker({ user, onBack, onUpdateUser }: DistractionBlockerProps) {
  const [loading, setLoading] = useState(false);
  const [showTestBlock, setShowTestBlock] = useState(false);

  const toggleBlock = async (field: string, value: number) => {
    setLoading(true);
    const path = `users/${user.uid}`;
    try {
      const updatedUser = {
        ...user,
        [field]: value
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      onUpdateUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const runTestBlock = () => {
    setShowTestBlock(true);
    setTimeout(() => setShowTestBlock(false), 5000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      <AnimatePresence>
        {showTestBlock && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center"
          >
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-black mb-4">Focus Mode Active</h2>
            <p className="text-stone-500 text-lg mb-10 leading-relaxed">
              Instagram is blocked until your focus session ends. Stay disciplined!
            </p>
            <div className="w-full max-w-xs h-2 bg-stone-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-red-500"
              />
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-stone-600">
              Closing in 5 seconds...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Shield & Settings</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={runTestBlock}
            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center gap-2 text-sm font-bold"
          >
            <Zap className="w-4 h-4" />
            Test
          </button>
          <button className="p-2 bg-stone-900 rounded-xl flex items-center gap-2 text-sm font-medium text-stone-400">
            <HelpCircle className="w-4 h-4" />
            Help
          </button>
        </div>
      </header>

      {/* Accessibility Service Section */}
      <section className="mb-10 bg-stone-900/40 p-6 rounded-[2.5rem] border border-stone-800/50">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-4 rounded-2xl ${user.accessibility_granted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-stone-800 text-stone-500'}`}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-100">Accessibility Service</h2>
            <p className="text-stone-500 text-sm font-medium">Required for app blocking & strict mode.</p>
            <p className="text-[10px] text-stone-600 italic mt-1">Note: On web, this is simulated for the prototype.</p>
          </div>
        </div>

        {user.accessibility_granted ? (
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-black uppercase tracking-widest">Service Connected & Active</span>
          </div>
        ) : (
          <button 
            onClick={() => toggleBlock('accessibility_granted', 1)}
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              "Grant Permission"
            )}
          </button>
        )}
      </section>

      {/* App Limits Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-100">App Limits</h2>
          <button className="flex items-center gap-1 text-stone-400 text-sm font-bold">
            <Plus className="w-4 h-4" />
            Add App
          </button>
        </div>
        
        <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Instagram className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Instagram</h3>
                <p className="text-stone-500 text-sm font-medium">2h 37m spent / 3h</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-700" />
          </div>
          
          <div className="px-5 pb-5 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Blocking</span>
          </div>
        </div>
      </section>

      {/* Block Shorts Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-stone-100 mb-4">Block Shorts</h2>
        <div className="space-y-3">
          {/* YouTube Shorts */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                  <Youtube className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="font-bold text-lg">YouTube Shorts</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </div>
            <div className="px-5 pb-5 flex items-center justify-center gap-2 text-emerald-500/80">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* IG Reels */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                  <Instagram className="w-7 h-7 text-pink-500" />
                </div>
                <h3 className="font-bold text-lg">IG Reels</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </div>
            <div className="px-5 pb-5 flex items-center justify-center gap-2 text-emerald-500/80">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Snapchat Spotlight */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-black" />
              </div>
              <h3 className="font-bold text-lg">Snapchat Spotlight</h3>
            </div>
            <button className="px-4 py-2 bg-stone-800 rounded-xl text-stone-300 text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Facebook Reels */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Facebook className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg">Facebook Reels</h3>
            </div>
            <button className="px-4 py-2 bg-stone-800 rounded-xl text-stone-300 text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Other blocks Section */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-stone-100 mb-4">Other blocks</h2>
        <div className="space-y-3">
          {/* Block Websites */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                  <Globe className="w-7 h-7 text-stone-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Block Websites</h3>
                  <p className="text-stone-500 text-sm font-medium">1 blocked</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </div>
            <div className="px-5 pb-5 flex items-center justify-center gap-2 text-emerald-500/80">
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Block Notifications */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                <Bell className="w-7 h-7 text-stone-400" />
              </div>
              <h3 className="font-bold text-lg">Block Notifications</h3>
            </div>
            <button className="px-4 py-2 bg-stone-800 rounded-xl text-stone-300 text-sm font-bold flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* YouTube Study mode */}
          <div className="bg-stone-900/40 rounded-3xl border border-stone-800/50 overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                  <Youtube className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">YouTube Study mode</h3>
                  <p className="text-stone-500 text-sm font-medium">1 channel</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </div>
            <div className="px-5 pb-5 text-center">
              <span className="text-stone-500 text-xs font-bold uppercase tracking-widest">Turned off</span>
            </div>
          </div>
        </div>
      </section>

      {/* Strict mode protections Section */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-stone-100">Strict mode protections</h2>
        </div>
        
        <div className="space-y-6">
          {[
            { id: 'uninstall_blocked', name: 'Block Regain app uninstall', desc: 'Cannot uninstall or log out of the Regain app' },
            { id: 'split_screen_blocked', name: 'Block split screen', desc: 'Cannot use blocked apps in split screen' },
            { id: 'floating_window_blocked', name: 'Block floating window', desc: 'Cannot use blocked apps in floating window' }
          ].map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-bold text-stone-100">{item.name}</h3>
                  <p className="text-stone-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                </div>
                <button 
                  onClick={() => toggleBlock(item.id, (user as any)[item.id] ? 0 : 1)}
                  disabled={loading}
                  className={`w-12 h-6 rounded-full relative transition-colors ${ (user as any)[item.id] ? 'bg-emerald-500' : 'bg-stone-800' }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${ (user as any)[item.id] ? 'left-7' : 'left-1' }`} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-emerald-500/80">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Permission Active</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
