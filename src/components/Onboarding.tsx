import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Bell, CheckCircle2, ArrowRight, Settings, Palette, Coins, Sparkles } from 'lucide-react';
import { User } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OnboardingProps {
  user: User;
  onComplete: (data: { accessibility_granted: boolean; notifications_granted: boolean; theme: string }) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [accessibilityGranted, setAccessibilityGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('rainbow');
  const [loading, setLoading] = useState(false);

  const themes = [
    { id: 'rainbow', name: 'Rainbow', color: 'bg-gradient-to-r from-violet-500 via-green-500 to-red-500' },
  ];

  const steps = [
    {
      title: `Welcome, ${user.displayName?.split(' ')[0] || 'Focuser'}!`,
      description: "Beat Distractions, Build Discipline. As a welcome gift, we've added 200 Focus Coins to your account!",
      icon: (
        <div className="relative">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-lg"
          >
            <Coins className="w-5 h-5" />
          </motion.div>
        </div>
      ),
      action: () => setStep(step + 1),
      actionLabel: "Get Started",
    },
    {
      title: "Choose Your Theme",
      description: "Select a visual style that helps you stay in the zone.",
      icon: <Palette className="w-12 h-12 text-stone-900" />,
      content: (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all text-left",
                selectedTheme === t.id ? "border-stone-900 bg-stone-50" : "border-stone-100 hover:border-stone-200"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg mb-2 shadow-sm", t.color)} />
              <div className="text-xs font-bold text-stone-900">{t.name}</div>
            </button>
          ))}
        </div>
      ),
      action: () => setStep(step + 1),
      actionLabel: "Next Step",
    },
    {
      title: "Accessibility Permission",
      description: "This allows Focus Kar to monitor screen activity and block distracting apps during your focus sessions. We never collect personal data.",
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="mb-6">
          {accessibilityGranted ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-bold">Service Connected</span>
            </div>
          ) : (
            <p className="text-[10px] text-stone-400 text-center italic">
              Note: On web, this permission is simulated for the prototype.
            </p>
          )}
        </div>
      ),
      action: async () => {
        if (accessibilityGranted) {
          setStep(step + 1);
          return;
        }
        setLoading(true);
        // Simulate a system check
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAccessibilityGranted(true);
        setLoading(false);
      },
      actionLabel: accessibilityGranted ? "Continue" : "Grant Permission",
      skipLabel: accessibilityGranted ? null : "I'll do it later",
    },
    {
      title: "Smart Notifications",
      description: "Get reminders for your focus sessions, break alerts, and streak protection warnings.",
      icon: <Bell className="w-12 h-12 text-orange-500" />,
      action: async () => {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setNotificationsGranted(permission === 'granted');
        }
        setStep(step + 1);
      },
      actionLabel: "Enable Notifications",
      skipLabel: "Skip for now",
    }
  ];

  const currentStep = steps[step];

  if (!currentStep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-stone-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl text-center"
        >
          <div className="relative inline-block mb-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-4 -right-4 bg-amber-400 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1"
            >
              <Coins className="w-3 h-3" />
              +200
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">You're all set!</h1>
          <p className="text-stone-600 mb-8">Your focus journey starts now with 200 bonus coins. Let's build that streak.</p>
          <button
            onClick={() => onComplete({ 
              accessibility_granted: accessibilityGranted, 
              notifications_granted: notificationsGranted,
              theme: selectedTheme
            })}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-stone-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl"
        >
          <div className="mb-8 flex justify-center">{currentStep.icon}</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-4 text-center">{currentStep.title}</h1>
          <p className="text-stone-600 mb-8 text-center leading-relaxed">
            {currentStep.description}
          </p>

          {(currentStep as any).content}

          <div className="space-y-3">
            {currentStep.action ? (
              <>
                <button
                  onClick={currentStep.action}
                  disabled={loading}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {currentStep.actionLabel}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {currentStep.skipLabel && (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="w-full py-4 text-stone-400 font-medium hover:text-stone-600 transition-colors"
                  >
                    {currentStep.skipLabel}
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-semibold hover:bg-stone-800 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-stone-900" : "w-2 bg-stone-200"
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
