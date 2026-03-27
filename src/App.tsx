import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import AdultContentProtection from './components/AdultContentProtection';
import DistractionBlocker from './components/DistractionBlocker';
import { User } from './types';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Hourglass, Calendar, Users, ShieldAlert } from 'lucide-react';

type View = 'dashboard' | 'onboarding' | 'adult-protection' | 'blocks' | 'planner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUser(firebaseUser.uid, firebaseUser.email || 'guest@focuskar.app', firebaseUser.displayName || 'Guest User', firebaseUser.photoURL);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous auth failed:', error);
          setUser(null);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUser = async (uid: string, email: string, displayName: string | null = null, photoURL: string | null = null) => {
    const path = `users/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        // Update profile info if it changed or was missing
        if (displayName && data.displayName !== displayName) {
          try {
            await updateDoc(doc(db, 'users', uid), { displayName, photoURL });
            data.displayName = displayName;
            data.photoURL = photoURL;
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        }
        setUser(data);
        if (data.onboarding_completed === 0) {
          setCurrentView('onboarding');
        }
      } else {
        // Create new user (Guest)
        const newUser: User = {
          uid,
          email: email || 'guest@focuskar.app',
          displayName: displayName || 'Guest User',
          photoURL,
          onboarding_completed: 0,
          accessibility_granted: 0,
          notifications_granted: 0,
          streak_count: 0,
          last_focus_date: null,
          streak_freeze_used_this_week: 0,
          last_freeze_reset_date: null,
          focus_coins: 0,
          emergency_unlocks_today: 0,
          last_unlock_date: null,
          level: 1,
          experience: 0,
          porn_blocker_enabled: 0,
          strict_porn_blocker: 0,
          porn_blocker_pin: null,
          theme: 'rainbow',
          reels_blocked: 0,
          shorts_blocked: 0,
          facebook_blocked: 0,
          uninstall_blocked: 0,
          split_screen_blocked: 0,
          floating_window_blocked: 0,
          display_over_apps_granted: 0,
          blocked_apps: []
        };
        try {
          await setDoc(doc(db, 'users', uid), newUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
        setUser(newUser);
        setCurrentView('onboarding');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error instanceof Error && !error.message.startsWith('{')) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async (data: { accessibility_granted: boolean; notifications_granted: boolean; theme: string }) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const updatedUser = {
      ...user,
      ...data,
      onboarding_completed: 1,
      accessibility_granted: data.accessibility_granted ? 1 : 0,
      notifications_granted: data.notifications_granted ? 1 : 0
    };
    try {
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      setUser(updatedUser);
      setCurrentView('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getThemeClass = () => {
    if (!user) return 'theme-rainbow';
    return `theme-${user.theme || 'rainbow'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (currentView === 'onboarding' || user.onboarding_completed === 0) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  const showBottomNav = currentView === 'dashboard' || currentView === 'planner' || currentView === 'blocks';

  return (
    <div className={`min-h-screen bg-white ${getThemeClass()}`}>
      <div className="pb-24">
        {currentView === 'adult-protection' ? (
          <AdultContentProtection 
            user={user} 
            onBack={() => setCurrentView('dashboard')} 
            onUpdateUser={() => fetchUser(user.uid, user.email)} 
          />
        ) : currentView === 'blocks' ? (
          <DistractionBlocker 
            user={user} 
            onBack={() => setCurrentView('dashboard')} 
            onUpdateUser={() => fetchUser(user.uid, user.email)} 
          />
        ) : currentView === 'planner' ? (
          <Planner user={user} />
        ) : (
          <Dashboard 
            user={user} 
            onUpdateUser={() => fetchUser(user.uid, user.email)} 
            onNavigateToAdultProtection={() => setCurrentView('adult-protection')}
            onNavigateToDistractionBlocker={() => setCurrentView('blocks')}
            onLogout={handleLogout}
          />
        )}
      </div>

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-stone-950 border-t border-emerald-500/20 px-6 py-4 pb-10 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto flex items-center justify-around">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex flex-col items-center gap-2 transition-all duration-500 group ${currentView === 'dashboard' ? 'text-emerald-400' : 'text-stone-600 hover:text-stone-400'}`}
            >
              <div className={`p-3 rounded-[1.25rem] transition-all duration-500 ${currentView === 'dashboard' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'bg-stone-900 group-hover:bg-stone-800'}`}>
                <Hourglass className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${currentView === 'dashboard' ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>Focus</span>
            </button>
            <button 
              onClick={() => setCurrentView('planner')}
              className={`flex flex-col items-center gap-2 transition-all duration-500 group ${currentView === 'planner' ? 'text-emerald-400' : 'text-stone-600 hover:text-stone-400'}`}
            >
              <div className={`p-3 rounded-[1.25rem] transition-all duration-500 ${currentView === 'planner' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'bg-stone-900 group-hover:bg-stone-800'}`}>
                <Calendar className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${currentView === 'planner' ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>Planner</span>
            </button>
            <button 
              onClick={() => setCurrentView('blocks')}
              className={`flex flex-col items-center gap-2 transition-all duration-500 group ${currentView === 'blocks' ? 'text-emerald-400' : 'text-stone-600 hover:text-stone-400'}`}
            >
              <div className={`p-3 rounded-[1.25rem] transition-all duration-500 ${currentView === 'blocks' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'bg-stone-900 group-hover:bg-stone-800'}`}>
                <div className="relative">
                  <ShieldAlert className="w-5 h-5" />
                  {user.accessibility_granted === 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center border-2 border-stone-950 shadow-sm"
                    >
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    </motion.div>
                  )}
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${currentView === 'blocks' ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>Shield</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
