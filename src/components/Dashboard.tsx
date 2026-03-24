import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Calendar, Trophy, ShieldAlert, Settings, Bell, Info, Zap, Coins, Music, TreePine, Lock, Unlock, AlertTriangle, Shield, CheckCircle2, Trash2, Clock, BookOpen, Briefcase, Plus, Sparkles, LogOut, Palette, X, Smartphone } from 'lucide-react';
import { User, FocusSession, Task } from '../types';
import Timer from './Timer';
import AIAssistant from './AIAssistant';
import { format } from 'date-fns';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, Timestamp, setDoc, onSnapshot } from 'firebase/firestore';

export default function Dashboard({ user, onUpdateUser, onNavigateToAdultProtection, onNavigateToDistractionBlocker, onLogout }: { user: User; onUpdateUser: () => void; onNavigateToAdultProtection: () => void; onNavigateToDistractionBlocker: () => void; onLogout: () => void }) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDndEnabled, setIsDndEnabled] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [unlockDelay, setUnlockDelay] = useState(0);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const [rewardData, setRewardData] = useState<{
    coins: number;
    breakdown: { session: number; streak: number; level: number };
    exp: number;
    leveledUp: boolean;
  } | null>(null);

  const themes = [
    { id: 'rainbow', name: 'Rainbow', color: 'bg-gradient-to-r from-violet-500 via-green-500 to-red-500' },
  ];

  const handleThemeChange = async (themeId: string) => {
    const path = `users/${user.uid}`;
    try {
      const updatedUser = { ...user, theme: themeId };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      onUpdateUser();
      setShowThemeSwitcher(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  useEffect(() => {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      orderBy('start_time', 'desc'),
      limit(10)
    );
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setSessions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sessions');
    });

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('uid', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTasks(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => {
      unsubscribeSessions();
      unsubscribeTasks();
    };
  }, [user.uid]);

  const handleSessionComplete = async (duration: number) => {
    try {
      const coinsEarned = Math.floor(duration / 5); // 1 coin per 5 mins
      const expEarned = duration * 2; // 2 XP per minute

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let streakBonus = 0;
      let newStreak = user.streak_count;
      let lastFocusDate = user.last_focus_date;

      if (user.last_focus_date !== today) {
        newStreak = (user.last_focus_date === yesterday) ? user.streak_count + 1 : 1;
        lastFocusDate = today;
        streakBonus = 50; // 50 coins per day streak
      }

      let newExp = user.experience + expEarned;
      let newLevel = user.level;
      let levelUpBonus = 0;

      if (newExp >= 1000) {
        newLevel += 1;
        newExp -= 1000;
        levelUpBonus = Math.floor(Math.random() * (700 - 500 + 1)) + 500;
      }

      const totalCoins = coinsEarned + streakBonus + levelUpBonus;

      // Save session
      await addDoc(collection(db, 'sessions'), {
        uid: user.uid,
        start_time: new Date().toISOString(),
        duration_minutes: duration,
        completed: 1,
        tree_type: 'oak',
        coins_earned: totalCoins
      });

      // Update user
      const updatedUser = {
        ...user,
        streak_count: newStreak,
        last_focus_date: lastFocusDate,
        focus_coins: user.focus_coins + totalCoins,
        experience: newExp,
        level: newLevel
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);

      setRewardData({
        coins: totalCoins,
        breakdown: {
          session: coinsEarned,
          streak: streakBonus,
          level: levelUpBonus
        },
        exp: expEarned,
        leveledUp: newLevel > user.level
      });

      onUpdateUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sessions/users');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { completed: 1 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const handleEmergencyUnlock = async () => {
    if (user.focus_coins < 50) {
      alert("Not enough coins for emergency unlock!");
      return;
    }
    setIsUnlocking(true);
    let count = 10;
    setUnlockDelay(count);
    
    const interval = setInterval(() => {
      count -= 1;
      setUnlockDelay(count);
      if (count === 0) {
        clearInterval(interval);
        finalizeUnlock();
      }
    }, 1000);
  };

  const finalizeUnlock = async () => {
    try {
      const updatedUser = {
        ...user,
        focus_coins: user.focus_coins - 50,
        emergency_unlocks_today: user.emergency_unlocks_today + 1,
        last_unlock_date: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      
      onUpdateUser();
      setShowEmergencyModal(false);
      setIsUnlocking(false);
      alert("Emergency unlock successful. 60 seconds allowed.");
    } catch (error) {
      console.error('Error unlocking:', error);
      setIsUnlocking(false);
    }
  };

  const musicTracks = [
    { name: "Rain", icon: <Music className="w-4 h-4" /> },
    { name: "Cafe", icon: <Music className="w-4 h-4" /> },
    { name: "Forest", icon: <TreePine className="w-4 h-4" /> },
    { name: "White Noise", icon: <Music className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl shadow-lg shadow-stone-200 object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-200">
              <span className="text-white font-black text-xl tracking-tighter">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'FK'}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                {user.displayName ? 'Welcome back' : 'Get Started'}
              </span>
              <div className="h-px w-4 bg-stone-200" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {user.displayName ? user.displayName.split(' ')[0] : 'Focus Kar'}
              </h1>
              <div className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                Lvl {user.level}
              </div>
            </div>
            <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
              <span>{user.displayName || 'Guest'}</span>
              <span className="w-1 h-1 bg-stone-300 rounded-full" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm">
              <Coins className="w-5 h-5" />
              <span className="font-bold text-lg">{user.focus_coins}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 shadow-sm">
              <Flame className="w-5 h-5 fill-orange-600" />
              <span className="font-bold text-lg">{user.streak_count}</span>
            </div>
            <button 
              onClick={() => setIsDndEnabled(!isDndEnabled)}
              className={`p-3 rounded-2xl transition-all shadow-sm ${isDndEnabled ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-100'}`}
            >
              <Bell className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowThemeSwitcher(true)}
              className="p-3 bg-white text-stone-600 border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all shadow-sm"
              title="Change Theme"
            >
              <Palette className="w-6 h-6" />
            </button>
            <button 
              onClick={onLogout}
              className="p-3 bg-white text-stone-600 border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600/60 uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" />
            Save coins for emergency unlocks
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Timer & Activity */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white p-10 md:p-16 rounded-[3rem] shadow-xl shadow-stone-200/50 border border-stone-50 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-8 left-8 flex items-center gap-2 text-stone-300 font-bold text-xs uppercase tracking-widest">
              <TreePine className="w-4 h-4" />
              Growing: Oak Tree
            </div>
            <Timer onComplete={handleSessionComplete} isDndEnabled={isDndEnabled} />
          </section>

          {/* Tasks Section */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
                <Clock className="w-6 h-6 text-stone-400" />
                Focus Tasks
              </h2>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {tasks.filter(t => t.completed === 0).length} Pending
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-2 py-12 text-center bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                  <p className="text-stone-400 text-sm font-medium italic">No tasks yet. Ask the AI Assistant to add one!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div 
                    layout
                    key={task.id} 
                    className={`p-5 rounded-[2rem] border transition-all ${
                      task.completed 
                      ? 'bg-stone-50 border-stone-100 opacity-60' 
                      : 'bg-white border-stone-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          task.category === 'study' ? 'bg-blue-50 text-blue-500' :
                          task.category === 'work' ? 'bg-purple-50 text-purple-500' :
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {task.category === 'study' ? <BookOpen className="w-4 h-4" /> :
                           task.category === 'work' ? <Briefcase className="w-4 h-4" /> :
                           <Plus className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm ${task.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                            {task.title}
                          </h3>
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {task.duration_minutes}m Duration
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {!task.completed && (
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Music className="w-5 h-5 text-stone-400" />
                Focus Music
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {musicTracks.map(track => (
                  <button key={track.name} className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl hover:bg-stone-100 transition-colors text-left group">
                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      {track.icon}
                    </div>
                    <span className="text-sm font-bold text-stone-700">{track.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-stone-400" />
                Activity
              </h2>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-stone-400 text-center py-4 text-sm italic">No focus sessions yet.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <TreePine className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 text-sm">{session.duration_minutes}m Session</div>
                          <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{format(new Date(session.start_time), 'h:mm a')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                        <Coins className="w-3 h-3" />
                        +{(session as any).coins_earned || 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Right Column: Stats & Gamification */}
        <div className="lg:col-span-4 space-y-8">
          {/* Level Progress */}
          <section className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Experience</h3>
                  <div className="text-3xl font-black">Lvl {user.level}</div>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 text-xs font-bold">{user.experience} / 1000 XP</span>
                </div>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(user.experience % 1000) / 10}%` }}
                  className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                />
              </div>
            </div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
          </section>

          {/* User Profile Info */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-stone-900">Profile Info</h3>
              <Info className="w-5 h-5 text-stone-300" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Name</span>
                <span className="text-sm font-bold text-stone-900">{user.displayName || 'Not set'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email Address</span>
                <span className="text-sm font-bold text-stone-900">{user.email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Account ID</span>
                <span className="text-[10px] font-mono text-stone-400 break-all">{user.uid}</span>
              </div>
            </div>
          </section>

          {/* Emergency Unlock */}
          <section className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem]">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-red-900 text-lg">Emergency Unlock</h3>
                <p className="text-red-700/70 text-xs font-medium leading-relaxed">
                  {user.emergency_unlocks_today}/2 used today. 50 coin penalty applies.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowEmergencyModal(true)}
              disabled={user.emergency_unlocks_today >= 2}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
            >
              Request Unlock
            </button>
          </section>

          {/* Adult Content Protection */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-stone-900">Adult Blocker</h3>
              <Shield className={`w-5 h-5 ${user.porn_blocker_enabled ? 'text-emerald-500' : 'text-stone-300'}`} />
            </div>
            <p className="text-stone-500 text-sm mb-6">
              Protect your mind from explicit content and stay focused.
            </p>
            <button 
              onClick={onNavigateToAdultProtection}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all"
            >
              Manage Protection
            </button>
          </section>

          {/* Distraction Blocker */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-stone-900">Distraction Blocker</h3>
              <Smartphone className={`w-5 h-5 ${user.reels_blocked || user.shorts_blocked || user.facebook_blocked ? 'text-emerald-500' : 'text-stone-300'}`} />
            </div>
            <p className="text-stone-500 text-sm mb-6">
              Block addictive short-form content like Reels and YouTube Shorts.
            </p>
            <button 
              onClick={onNavigateToDistractionBlocker}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all"
            >
              Manage Blockers
            </button>
          </section>

          {/* Streak Protection */}
          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-stone-900">Streak Shield</h3>
              <ShieldAlert className="w-5 h-5 text-stone-300" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <div className="text-sm font-black text-stone-900">{user.streak_count} Day Streak</div>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Active Protection</div>
              </div>
            </div>
            <button 
              disabled={user.streak_freeze_used_this_week === 1}
              onClick={async () => {
                const updatedUser = {
                  ...user,
                  streak_freeze_used_this_week: 1
                };
                await setDoc(doc(db, 'users', user.uid), updatedUser);
                onUpdateUser();
              }}
              className="w-full py-3 bg-stone-100 text-stone-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all disabled:opacity-50"
            >
              {user.streak_freeze_used_this_week === 1 ? 'Shield Used' : 'Activate Shield'}
            </button>
          </section>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant user={user} tasks={tasks} onTaskAdded={() => {}} />

      {/* Reward Popup */}
      <AnimatePresence>
        {rewardData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[3rem] p-8 shadow-2xl text-center relative overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-amber-50 -z-10" />
              
              <div className="mb-6 inline-flex p-4 bg-white rounded-3xl shadow-xl shadow-amber-200/50 relative">
                <Trophy className="w-12 h-12 text-amber-500" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-black text-stone-900 mb-2">
                {rewardData.leveledUp ? "LEVEL UP!" : "FOCUS COMPLETE!"}
              </h2>
              <p className="text-stone-500 text-sm font-medium mb-8">
                {rewardData.leveledUp 
                  ? `You've reached Level ${user.level}! Your discipline is legendary.`
                  : "Another session crushed. Your focus is sharpening."}
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <Coins className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-stone-700">Total Coins</span>
                  </div>
                  <span className="text-lg font-black text-amber-600">+{rewardData.coins}</span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                  {rewardData.breakdown.session > 0 && (
                    <div className="flex justify-between px-2">
                      <span>Session Reward</span>
                      <span>+{rewardData.breakdown.session}</span>
                    </div>
                  )}
                  {rewardData.breakdown.streak > 0 && (
                    <div className="flex justify-between px-2 text-orange-500">
                      <span>Streak Bonus</span>
                      <span>+{rewardData.breakdown.streak}</span>
                    </div>
                  )}
                  {rewardData.breakdown.level > 0 && (
                    <div className="flex justify-between px-2 text-emerald-500">
                      <span>Level Up Bonus</span>
                      <span>+{rewardData.breakdown.level}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setRewardData(null)}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Unlock Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Lock className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 mb-4">Emergency Unlock?</h2>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                You are about to break your focus. This will cost you <span className="text-red-500 font-bold">50 Focus Coins</span> and count as one of your 2 daily unlocks.
              </p>
              
              <div className="space-y-4">
                {isUnlocking ? (
                  <div className="py-4 bg-stone-100 rounded-2xl">
                    <div className="text-4xl font-black text-stone-900 mb-1">{unlockDelay}s</div>
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Confirming...</div>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleEmergencyUnlock}
                      className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100"
                    >
                      Confirm Unlock
                    </button>
                    <button 
                      onClick={() => setShowEmergencyModal(false)}
                      className="w-full py-5 text-stone-400 font-bold hover:text-stone-600 transition-colors"
                    >
                      Nevermind, I'll Focus
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Theme Switcher Modal */}
      <AnimatePresence>
        {showThemeSwitcher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-stone-900">Choose Theme</h2>
                <button onClick={() => setShowThemeSwitcher(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${user.theme === t.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl shadow-sm ${t.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">{t.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
