import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AdultContentProtection from './components/AdultContentProtection';
import DistractionBlocker from './components/DistractionBlocker';
import { User } from './types';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

type View = 'dashboard' | 'onboarding' | 'adult-protection' | 'distraction-blocker';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

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
          facebook_blocked: 0
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

  return (
    <div className={`min-h-screen bg-stone-50 ${getThemeClass()}`}>
      {currentView === 'adult-protection' ? (
        <AdultContentProtection 
          user={user} 
          onBack={() => setCurrentView('dashboard')} 
          onUpdateUser={() => fetchUser(user.uid, user.email)} 
        />
      ) : currentView === 'distraction-blocker' ? (
        <DistractionBlocker 
          user={user} 
          onBack={() => setCurrentView('dashboard')} 
          onUpdateUser={() => fetchUser(user.uid, user.email)} 
        />
      ) : (
        <Dashboard 
          user={user} 
          onUpdateUser={() => fetchUser(user.uid, user.email)} 
          onNavigateToAdultProtection={() => setCurrentView('adult-protection')}
          onNavigateToDistractionBlocker={() => setCurrentView('distraction-blocker')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
