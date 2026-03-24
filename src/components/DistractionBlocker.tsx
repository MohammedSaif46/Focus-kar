import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Shield, 
  Smartphone, 
  Youtube, 
  Facebook, 
  Instagram, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Info
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
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const toggleBlock = async (field: 'reels_blocked' | 'shorts_blocked' | 'facebook_blocked') => {
    setLoading(true);
    const path = `users/${user.uid}`;
    try {
      const updatedUser = {
        ...user,
        [field]: user[field] === 1 ? 0 : 1
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      onUpdateUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const blockers = [
    {
      id: 'reels_blocked',
      name: 'Instagram Reels',
      icon: <Instagram className="w-6 h-6 text-pink-500" />,
      description: 'Blocks the Reels tab and infinite scrolling on Instagram.',
      enabled: user.reels_blocked === 1,
    },
    {
      id: 'shorts_blocked',
      name: 'YouTube Shorts',
      icon: <Youtube className="w-6 h-6 text-red-500" />,
      description: 'Blocks the Shorts tab and Shorts shelf on YouTube.',
      enabled: user.shorts_blocked === 1,
    },
    {
      id: 'facebook_blocked',
      name: 'Facebook Feed',
      icon: <Facebook className="w-6 h-6 text-blue-600" />,
      description: 'Blocks the Facebook news feed and video tab.',
      enabled: user.facebook_blocked === 1,
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-stone-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Distraction Blocker</h1>
          <p className="text-stone-500">Block addictive short-form content and feeds.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm mb-6">
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-stone-900 text-lg">Active Blockers</h2>
          </div>
          <p className="text-sm text-stone-500">
            These blockers help you regain control of your time by removing infinite scrolling features.
          </p>
        </div>

        <div className="divide-y divide-stone-100">
          {blockers.map((blocker) => (
            <div key={blocker.id} className="p-6 flex items-center justify-between hover:bg-stone-50/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-stone-100 rounded-xl">
                  {blocker.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{blocker.name}</h3>
                    <button 
                      onClick={() => setShowInfo(showInfo === blocker.id ? null : blocker.id)}
                      className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-stone-500">{blocker.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleBlock(blocker.id as any)}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  blocker.enabled ? 'bg-emerald-500' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    blocker.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold mb-1">How it works</p>
              <p>
                When enabled, our accessibility service will automatically detect when you open these sections and redirect you back to your focus dashboard or a neutral page.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-amber-600" />
          <h2 className="font-semibold text-amber-900">Accessibility Service Required</h2>
        </div>
        <p className="text-sm text-amber-800 mb-4">
          To block content inside other apps like Instagram and YouTube, you must grant the Accessibility Service permission in your device settings.
        </p>
        <div className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-white/50 p-2 rounded-lg border border-amber-200/50">
          <Lock className="w-3 h-3" />
          <span>Privacy Note: We only monitor app package names and screen titles to detect these sections. No personal data is collected.</span>
        </div>
      </div>
    </div>
  );
}
