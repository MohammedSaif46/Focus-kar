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
  Zap,
  Wifi,
  Battery,
  Signal,
  ArrowLeft,
  Search,
  Check,
  Trash2
} from 'lucide-react';
import { User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const ALL_APPS = [
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-6 h-6" />, color: 'from-pink-500 to-purple-600', category: 'Social' },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="w-6 h-6" />, color: 'from-blue-600 to-blue-700', category: 'Social' },
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-6 h-6" />, color: 'from-red-600 to-red-700', category: 'Entertainment' },
  { id: 'tiktok', name: 'TikTok', icon: <Smartphone className="w-6 h-6" />, color: 'from-stone-800 to-black', category: 'Social' },
  { id: 'snapchat', name: 'Snapchat', icon: <Smartphone className="w-6 h-6" />, color: 'from-yellow-400 to-yellow-500', category: 'Social' },
  { id: 'twitter', name: 'Twitter', icon: <Smartphone className="w-6 h-6" />, color: 'from-blue-400 to-blue-500', category: 'Social' },
  { id: 'netflix', name: 'Netflix', icon: <Smartphone className="w-6 h-6" />, color: 'from-red-700 to-red-800', category: 'Entertainment' },
  { id: 'chrome', name: 'Chrome', icon: <Globe className="w-6 h-6" />, color: 'from-blue-500 to-green-500', category: 'Utility' },
];

interface DistractionBlockerProps {
  user: User;
  onBack: () => void;
  onUpdateUser: () => void;
}

export default function DistractionBlocker({ user, onBack, onUpdateUser }: DistractionBlockerProps) {
  const [loading, setLoading] = useState(false);
  const [showTestBlock, setShowTestBlock] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState<{ show: boolean; target: string; type?: 'accessibility' | 'display_over_apps' }>({ show: false, target: '', type: 'accessibility' });
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showDisplayOverAppsSettings, setShowDisplayOverAppsSettings] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('General');

  const StatusBar = ({ dark = false }: { dark?: boolean }) => (
    <div className={`flex items-center justify-between px-6 py-2 sticky top-0 z-50 backdrop-blur-md border-b ${dark ? 'bg-black/80 border-stone-800 text-white' : 'bg-white/80 border-stone-50 text-stone-900'}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-black tracking-tighter">12:45</span>
      </div>
      <div className="flex items-center gap-2">
        <Signal className="w-3 h-3" />
        <Wifi className="w-3 h-3" />
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-black">85%</span>
          <Battery className="w-3 h-3 rotate-90" />
        </div>
      </div>
    </div>
  );

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

  const toggleApp = async (appId: string) => {
    const isBlocked = user.blocked_apps?.includes(appId);
    const newBlockedApps = isBlocked
      ? user.blocked_apps.filter(id => id !== appId)
      : [...(user.blocked_apps || []), appId];

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...user,
        blocked_apps: newBlockedApps
      });
      onUpdateUser();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const runTestBlock = () => {
    setShowTestBlock(true);
    setTimeout(() => setShowTestBlock(false), 5000);
  };

  if (showAppSelector) {
    const filteredApps = ALL_APPS.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans select-none flex flex-col">
        <StatusBar />
        
        <header className="px-6 py-6 flex items-center justify-between border-b border-stone-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAppSelector(false)} 
              className="p-3 bg-stone-50 rounded-2xl text-stone-400 active:scale-90 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black tracking-tight">Select Apps</h1>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 rounded-full">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              {user.blocked_apps?.length || 0} Selected
            </span>
          </div>
        </header>

        <div className="p-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-stone-900 transition-colors" />
            <input 
              type="text"
              placeholder="Search apps or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-stone-50 rounded-[2rem] border border-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:bg-white transition-all font-bold text-stone-900 placeholder:text-stone-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-3">
          {filteredApps.map((app) => {
            const isSelected = user.blocked_apps?.includes(app.id);
            return (
              <button
                key={app.id}
                onClick={() => toggleApp(app.id)}
                className={`w-full p-5 rounded-[2.5rem] border transition-all flex items-center justify-between group active:scale-[0.98] ${
                  isSelected 
                    ? 'bg-stone-900 border-stone-900 shadow-xl shadow-stone-200' 
                    : 'bg-white border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-gradient-to-tr ${app.color} shadow-lg`}>
                    {React.cloneElement(app.icon as React.ReactElement, { className: 'w-8 h-8 text-white' })}
                  </div>
                  <div className="text-left">
                    <h3 className={`font-black text-lg tracking-tight ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      {app.name}
                    </h3>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isSelected ? 'text-white/50' : 'text-stone-400'}`}>
                      {app.category}
                    </p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isSelected ? 'bg-emerald-500 text-white' : 'bg-stone-50 text-stone-200'
                }`}>
                  {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-8 left-6 right-6 z-50">
          <button 
            onClick={() => setShowAppSelector(false)}
            className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            Done Selecting
          </button>
        </div>
      </div>
    );
  }

  if (showDisplayOverAppsSettings) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] text-black font-sans select-none">
        <StatusBar />
        
        {/* Header */}
        <header className="px-4 py-2 flex items-center gap-6">
          <button 
            onClick={() => setShowDisplayOverAppsSettings(false)} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors active:scale-90"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-[24px] font-medium tracking-tight">Display over other apps</h1>
        </header>

        <div className="p-4 space-y-6 pb-20">
          <section>
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100">
              <button 
                onClick={() => toggleBlock('display_over_apps_granted', user.display_over_apps_granted ? 0 : 1)}
                className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[17px] font-bold">Regain</div>
                    <div className={`text-[14px] font-medium ${user.display_over_apps_granted ? 'text-blue-600' : 'text-stone-400'}`}>
                      {user.display_over_apps_granted ? 'Allowed' : 'Not allowed'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {loading && <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />}
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors" />
                </div>
              </button>
            </div>
          </section>

          <div className="px-4">
            <p className="text-[14px] text-stone-500 leading-relaxed">
              Allowing this permission lets Regain show a block screen over other apps when you're in Focus Mode or have reached your limit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSystemSettings) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] text-black font-sans select-none">
        <StatusBar />
        
        {/* Header */}
        <header className="px-4 py-2 flex items-center gap-6">
          <button 
            onClick={() => setShowSystemSettings(false)} 
            className="p-2 hover:bg-black/5 rounded-full transition-colors active:scale-90"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-[24px] font-medium tracking-tight">Accessibility</h1>
        </header>

        {/* Tabs */}
        <div className="flex px-4 border-b border-stone-200 mt-2 overflow-x-auto no-scrollbar">
          {['General', 'Vision', 'Hearing', 'Interaction'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-[15px] font-medium relative transition-colors whitespace-nowrap ${
                activeTab === tab ? 'text-black' : 'text-stone-500'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-[3px] bg-black rounded-t-full" 
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-6 pb-20">
          {/* Downloaded Apps Section - This is where Regain lives in real Android */}
          <section>
            <h2 className="text-[12px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-4">Downloaded apps</h2>
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100">
              <button 
                onClick={() => toggleBlock('accessibility_granted', user.accessibility_granted ? 0 : 1)}
                className="w-full p-6 flex items-center justify-between hover:bg-stone-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[17px] font-bold">Regain</div>
                    <div className={`text-[14px] font-medium ${user.accessibility_granted ? 'text-blue-600' : 'text-stone-400'}`}>
                      {user.accessibility_granted ? 'On' : 'Off'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {loading && <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />}
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors" />
                </div>
              </button>
              <div className="p-6 flex items-center justify-between border-t border-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-stone-400" />
                  </div>
                  <div>
                    <div className="text-[17px] font-medium">AONService</div>
                    <div className="text-[14px] text-stone-400">Off</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300" />
              </div>
            </div>
          </section>

          {/* Convenience Section */}
          <section>
            <h2 className="text-[12px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-4">Convenience</h2>
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-stone-100">
              <div className="p-6 flex items-center justify-between border-b border-stone-50">
                <span className="text-[17px] font-medium">Press Power button to end calls</span>
                <div className="w-12 h-6 bg-stone-200 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
              <div className="p-6 flex items-center justify-between border-b border-stone-50">
                <div>
                  <div className="text-[17px] font-medium">Accessibility menu</div>
                  <div className="text-[12px] text-stone-400 mt-0.5">Show frequently used functions in a large menu.</div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-300" />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="text-[17px] font-medium">Shortcut from Lock screen</div>
                  <div className="text-[12px] text-stone-400 mt-0.5">Allow accessibility shortcuts on Lock screen.</div>
                </div>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-emerald-500/30">
      <StatusBar />
      
      <div className="p-6 pb-32">
        <AnimatePresence>
          {showTestBlock && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-10 text-center"
            >
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-28 h-28 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-red-500/20"
              >
                <ShieldAlert className="w-14 h-14 text-red-500" />
              </motion.div>
              <h2 className="text-4xl font-black mb-6 tracking-tight text-white">Focus Mode Active</h2>
              <p className="text-stone-400 text-xl mb-12 leading-relaxed max-w-sm">
                Instagram is blocked until your focus session ends. <span className="text-white font-bold">Stay disciplined!</span>
              </p>
              <div className="w-full max-w-xs h-3 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: 0 }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                />
              </div>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-stone-600">
                Closing in 5 seconds...
              </p>
            </motion.div>
          )}

          {showPermissionDialog.show && (
            <div className="fixed inset-0 z-[150] flex items-end justify-center p-4 bg-black/20 backdrop-blur-sm">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-white rounded-[3rem] p-8 pb-12 border border-stone-100 shadow-2xl"
              >
                <div className="w-14 h-1.5 bg-stone-200 rounded-full mx-auto mb-10" />
                
                <h2 className="text-[26px] font-black mb-6 leading-tight tracking-tight text-stone-900">
                  Allow {showPermissionDialog.type === 'display_over_apps' ? 'Display over other apps' : 'Accessibility'} permission to {showPermissionDialog.target}
                </h2>
                
                <p className="text-stone-500 text-[16px] mb-10 leading-relaxed font-medium">
                  {showPermissionDialog.type === 'display_over_apps' 
                    ? "Regain requires this permission to show the block screen over other apps when you're supposed to be focusing."
                    : "Regain requires access to accessibility data to know whether you open a specific page within an app & block it for you."}
                </p>

                <button className="w-full flex items-center justify-between p-5 bg-stone-50 rounded-[2rem] mb-12 border border-stone-100 group active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-4 text-[#7CB342]">
                    <div className="w-8 h-8 bg-[#7CB342]/10 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[15px] font-bold">Is it safe to give this permission?</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors" />
                </button>

                <div className="flex gap-4 mb-10">
                  <button 
                    onClick={() => setShowPermissionDialog({ show: false, target: '', type: 'accessibility' })}
                    className="flex-1 py-5 text-stone-400 font-black text-[18px] uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    Deny
                  </button>
                  <button 
                    onClick={() => {
                      setShowPermissionDialog({ show: false, target: '', type: 'accessibility' });
                      if (showPermissionDialog.type === 'display_over_apps') {
                        setShowDisplayOverAppsSettings(true);
                      } else {
                        setShowSystemSettings(true);
                      }
                    }}
                    className="flex-1 py-5 bg-stone-900 text-white rounded-full font-black text-[18px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
                  >
                    Accept
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-stone-400 text-[12px] font-bold uppercase tracking-widest">
                    Trusted by 2M+ students ❤️
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack}
              className="p-4 bg-stone-50 rounded-[1.25rem] border border-stone-100 text-stone-400 hover:text-stone-900 transition-all shadow-sm active:scale-90"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Security Center</span>
                <div className="h-px w-6 bg-stone-100" />
              </div>
              <h1 className="text-3xl font-black text-stone-900 tracking-tight">Shield & Settings</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={runTestBlock}
              className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-emerald-500/20 active:scale-90 transition-transform hover:bg-emerald-500/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              Test Shield
            </button>
          </div>
        </header>

        {user.notifications_granted === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-black text-amber-900">Notifications Disabled</h3>
                <p className="text-amber-700/70 text-xs font-medium">You won't receive focus reminders.</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                if ('Notification' in window) {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    toggleBlock('notifications_granted', 1);
                  }
                }
              }}
              className="px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
            >
              Enable
            </button>
          </motion.div>
        )}

        {user.display_over_apps_granted === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-blue-50 border border-blue-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-black text-blue-900">Overlay Permission</h3>
                <p className="text-blue-700/70 text-xs font-medium">Required to show block screen.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowPermissionDialog({ show: true, target: 'Regain', type: 'display_over_apps' })}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              Grant
            </button>
          </motion.div>
        )}

        {/* Accessibility Service Section */}
        <section className="mb-12 bg-stone-50 p-8 rounded-[3rem] border border-stone-100 shadow-sm">
          <div className="flex items-center gap-5 mb-8">
            <div className={`p-5 rounded-[2rem] ${user.accessibility_granted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-stone-100 text-stone-400 border border-stone-200'}`}>
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Accessibility Service</h2>
              <p className="text-stone-400 text-[15px] font-bold leading-tight mt-1">Required for app blocking & strict mode.</p>
            </div>
          </div>

          {user.accessibility_granted ? (
            <div className="flex items-center justify-between bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.15em] text-emerald-500">Service Connected & Active</span>
              </div>
              <button 
                onClick={() => setShowSystemSettings(true)}
                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
              >
                Settings
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowPermissionDialog({ show: true, target: 'Regain' })}
              disabled={loading}
              className="w-full py-5 bg-stone-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-stone-200"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Grant Permission
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </section>

      {/* App Limits Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-stone-900 tracking-tight">App Limits</h2>
          <button 
            onClick={() => setShowAppSelector(true)}
            className="flex items-center gap-2 text-stone-400 text-xs font-black uppercase tracking-widest hover:text-stone-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add App
          </button>
        </div>
        
        <div className="space-y-4">
          {user.blocked_apps && user.blocked_apps.length > 0 ? (
            user.blocked_apps.map(appId => {
              const app = ALL_APPS.find(a => a.id === appId);
              if (!app) return null;
              return (
                <div key={appId} className="bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 bg-gradient-to-tr ${app.color} rounded-[1.25rem] flex items-center justify-center shadow-xl`}>
                        {React.cloneElement(app.icon as React.ReactElement, { className: 'w-8 h-8 text-white' })}
                      </div>
                      <div>
                        <h3 className="font-black text-xl tracking-tight text-stone-900">{app.name}</h3>
                        <p className="text-stone-400 text-sm font-bold">Blocking Active</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleApp(appId)}
                      className="p-3 bg-stone-50 rounded-2xl text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <button 
              onClick={() => setShowAppSelector(true)}
              className="w-full p-10 border-2 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group hover:border-stone-200 transition-all"
            >
              <div className="w-16 h-16 bg-stone-50 rounded-[1.5rem] flex items-center justify-center text-stone-300 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-stone-900 font-black">No apps blocked yet</p>
                <p className="text-stone-400 text-sm font-bold">Tap to select apps to block</p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Block Shorts Section */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-stone-900 mb-6 tracking-tight">Block Shorts</h2>
        <div className="space-y-4">
          {/* YouTube Shorts */}
          <button 
            onClick={() => {
              if (user.accessibility_granted === 0) {
                setShowPermissionDialog({ show: true, target: 'YouTube Shorts', type: 'accessibility' });
              } else if (user.display_over_apps_granted === 0) {
                setShowPermissionDialog({ show: true, target: 'YouTube Shorts', type: 'display_over_apps' });
              } else {
                toggleBlock('shorts_blocked', user.shorts_blocked ? 0 : 1);
              }
            }}
            className="w-full bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform text-left"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100">
                  <Youtube className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-black text-xl tracking-tight text-stone-900">YouTube Shorts</h3>
              </div>
              <ChevronRight className="w-6 h-6 text-stone-200" />
            </div>
            <div className="px-6 pb-6 flex items-center justify-center gap-3">
              {user.shorts_blocked ? (
                <>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Active</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-stone-200 rounded-full" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Disabled</span>
                </>
              )}
            </div>
          </button>

          {/* IG Reels */}
          <button 
            onClick={() => {
              if (user.accessibility_granted === 0) {
                setShowPermissionDialog({ show: true, target: 'IG Reels', type: 'accessibility' });
              } else if (user.display_over_apps_granted === 0) {
                setShowPermissionDialog({ show: true, target: 'IG Reels', type: 'display_over_apps' });
              } else {
                toggleBlock('reels_blocked', user.reels_blocked ? 0 : 1);
              }
            }}
            className="w-full bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform text-left"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100">
                  <Instagram className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="font-black text-xl tracking-tight text-stone-900">IG Reels</h3>
              </div>
              <ChevronRight className="w-6 h-6 text-stone-200" />
            </div>
            <div className="px-6 pb-6 flex items-center justify-center gap-3">
              {user.reels_blocked ? (
                <>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Active</span>
                </>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 bg-stone-200 rounded-full" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Disabled</span>
                </>
              )}
            </div>
          </button>

          {/* Snapchat Spotlight */}
          <div className="bg-white rounded-[2.5rem] border border-stone-100 p-6 flex items-center justify-between shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-yellow-400 rounded-[1.25rem] flex items-center justify-center shadow-lg">
                <Smartphone className="w-8 h-8 text-black" />
              </div>
              <h3 className="font-black text-xl tracking-tight text-stone-900">Snapchat Spotlight</h3>
            </div>
            <button className="px-5 py-3 bg-stone-50 rounded-2xl text-stone-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-stone-100 hover:bg-stone-100 transition-colors">
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Other blocks Section */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-stone-900 mb-6 tracking-tight">Other blocks</h2>
        <div className="space-y-4">
          {/* Block Websites */}
          <div className="bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100">
                  <Globe className="w-8 h-8 text-stone-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-stone-900">Block Websites</h3>
                  <p className="text-stone-400 text-sm font-bold">1 blocked</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-stone-200" />
            </div>
            <div className="px-6 pb-6 flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Active</span>
            </div>
          </div>

          {/* Block Notifications */}
          <div className="bg-white rounded-[2.5rem] border border-stone-100 p-6 flex items-center justify-between shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100">
                <Bell className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="font-black text-xl tracking-tight text-stone-900">Block Notifications</h3>
            </div>
            <button 
              onClick={async () => {
                if ('Notification' in window) {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    toggleBlock('notifications_granted', 1);
                  }
                }
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-colors ${
                user.notifications_granted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'
              }`}
            >
              {user.notifications_granted ? 'Active' : (
                <>
                  <Plus className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>

          {/* Display over other apps */}
          <div className="bg-white rounded-[2.5rem] border border-stone-100 p-6 flex items-center justify-between shadow-xl shadow-stone-100 group active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-stone-50 rounded-[1.25rem] flex items-center justify-center border border-stone-100">
                <Zap className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="font-black text-xl tracking-tight text-stone-900">Display over other apps</h3>
            </div>
            <button 
              onClick={() => {
                if (user.display_over_apps_granted === 0) {
                  setShowPermissionDialog({ show: true, target: 'Regain', type: 'display_over_apps' });
                } else {
                  setShowDisplayOverAppsSettings(true);
                }
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border transition-colors ${
                user.display_over_apps_granted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-stone-50 text-stone-400 border-stone-100 hover:bg-stone-100'
              }`}
            >
              {user.display_over_apps_granted ? 'Active' : (
                <>
                  <Plus className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Strict mode protections Section */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-stone-900 mb-8 tracking-tight">Strict mode protections</h2>
        
        <div className="space-y-10">
          {[
            { id: 'uninstall_blocked', name: 'Block Regain app uninstall', desc: 'Cannot uninstall or log out of the Regain app' },
            { id: 'split_screen_blocked', name: 'Block split screen', desc: 'Cannot use blocked apps in split screen' },
            { id: 'floating_window_blocked', name: 'Block floating window', desc: 'Cannot use blocked apps in floating window' }
          ].map((item) => (
            <div key={item.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-black text-stone-900 tracking-tight">{item.name}</h3>
                  <p className="text-stone-400 text-sm font-bold leading-relaxed mt-1">{item.desc}</p>
                </div>
                <button 
                  onClick={() => toggleBlock(item.id, (user as any)[item.id] ? 0 : 1)}
                  disabled={loading}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 ${ (user as any)[item.id] ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-stone-100' }`}
                >
                  <motion.div 
                    animate={{ x: (user as any)[item.id] ? 28 : 4 }}
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg" 
                  />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${ (user as any)[item.id] ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-stone-200' }`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${ (user as any)[item.id] ? 'text-emerald-500' : 'text-stone-300' }`}>
                  { (user as any)[item.id] ? 'Permission Active' : 'Permission Required' }
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
    </div>
  );
}
