import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Coffee, Zap, BellOff, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerProps {
  onComplete: (duration: number) => void;
  isDndEnabled: boolean;
}

export default function Timer({ onComplete, isDndEnabled }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 mins
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [duration, setDuration] = useState(25);
  const [isEditing, setIsEditing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 180) {
      setDuration(val);
      if (!isActive && !isBreak) {
        setTimeLeft(val * 60);
      }
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    if (!isBreak) {
      onComplete(duration);
      sendNotification("Focus Session Complete!", "Great job! Time for a well-deserved break.");
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 min break
    } else {
      sendNotification("Break Over", "Ready to dive back in?");
      setIsBreak(false);
      setTimeLeft(duration * 60);
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (isBreak ? 5 * 60 : duration * 60)) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Progress Ring */}
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-stone-100"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 120}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: (2 * Math.PI * 120) * (1 - progress / 100) }}
            className={cn(
              "transition-all duration-1000",
              isBreak ? "text-emerald-500" : "text-accent"
            )}
          />
        </svg>

        <div className="text-center z-10">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="display"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={() => !isActive && !isBreak && setIsEditing(true)}
                className={cn(
                  "text-5xl font-mono font-bold text-stone-900 tabular-nums cursor-pointer hover:scale-105 transition-transform",
                  !isActive && !isBreak && "hover:text-stone-600"
                )}
              >
                {formatTime(timeLeft)}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <input
                  type="number"
                  value={duration}
                  onChange={handleDurationChange}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                  autoFocus
                  className="w-24 text-5xl font-mono font-bold text-stone-900 text-center bg-transparent border-b-2 border-stone-900 focus:outline-none"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 mt-2">Minutes</span>
              </motion.div>
            )}
          </AnimatePresence>
          {!isEditing && (
            <div className="text-stone-400 text-sm font-medium uppercase tracking-widest mt-1">
              {isBreak ? "Break Time" : "Focusing"}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex items-center gap-6">
        <button
          onClick={resetTimer}
          className="p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleTimer}
          className={cn(
            "p-6 rounded-3xl shadow-lg transition-all transform hover:scale-105 active:scale-95",
            isActive ? "bg-stone-100 text-stone-900" : "bg-stone-900 text-white"
          )}
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>

        <button
          onClick={() => !isActive && !isBreak && setIsEditing(true)}
          className={cn(
            "p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-colors",
            (isActive || isBreak) && "opacity-50 cursor-not-allowed"
          )}
          disabled={isActive || isBreak}
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {isDndEnabled && isActive && !isBreak && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-2 px-4 py-2 bg-stone-900/5 text-stone-500 rounded-full text-sm font-medium"
        >
          <BellOff className="w-4 h-4" />
          Silent Mode Active
        </motion.div>
      )}
    </div>
  );
}
