import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldCheck, ShieldAlert, Plus, Trash2, BarChart3, Lock, Unlock, ArrowLeft, Info, Globe, ExternalLink, Copy, Check } from 'lucide-react';
import { User } from '../types';

import { db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface AdultContentProtectionProps {
  user: User;
  onBack: () => void;
  onUpdateUser: () => void;
}

export default function AdultContentProtection({ user, onBack, onUpdateUser }: AdultContentProtectionProps) {
  const [blockedSites, setBlockedSites] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [newSite, setNewSite] = useState('');
  const [isStrict, setIsStrict] = useState(user.strict_porn_blocker === 1);
  const [isEnabled, setIsEnabled] = useState(user.porn_blocker_enabled === 1);
  const [copied, setCopied] = useState(false);

  const dnsUrl = "family-filter-dns.cleanbrowsing.org";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // In a real app, we'd fetch these from Firestore collections
    // For now, we'll show empty or mock data if not implemented
    setBlockedSites([]);
    setStats([]);
    setTotalAttempts(0);
  };

  const handleCopyDns = () => {
    navigator.clipboard.writeText(dnsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBlocker = async (enabled: boolean) => {
    try {
      const updatedUser = {
        ...user,
        porn_blocker_enabled: enabled ? 1 : 0
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      setIsEnabled(enabled);
      onUpdateUser();
    } catch (error) {
      console.error('Error updating blocker:', error);
    }
  };

  const handleToggleStrict = async (strict: boolean) => {
    try {
      let pin = user.porn_blocker_pin;
      if (strict && !pin) {
        pin = prompt("Set a PIN to enable Strict Mode:");
        if (!pin) return;
      }
      
      const updatedUser = {
        ...user,
        strict_porn_blocker: strict ? 1 : 0,
        porn_blocker_pin: pin
      };
      await setDoc(doc(db, 'users', user.uid), updatedUser);
      setIsStrict(strict);
      onUpdateUser();
    } catch (error) {
      console.error('Error updating strict mode:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 md:p-10"
    >
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white rounded-2xl border border-stone-100 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-200">
            <span className="text-white font-black text-xl tracking-tighter">FK</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900">Adult Content Protection</h1>
            <p className="text-stone-500 font-medium">Powered by CleanBrowsing DNS Filtering.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-8">
          {/* DNS Setup Card */}
          <section className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-black">Family Filter DNS</h2>
              </div>
              
              <p className="text-stone-400 text-sm mb-8 leading-relaxed">
                Focus Kar uses <span className="text-white font-bold">CleanBrowsing Family Filter</span> to block adult content at the network level. This is more secure and harder to bypass than app-level blocking.
              </p>

              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
                <div className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-2">Private DNS Provider Hostname</div>
                <div className="flex items-center justify-between gap-4">
                  <code className="text-emerald-400 font-mono text-sm break-all">{dnsUrl}</code>
                  <button 
                    onClick={handleCopyDns}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">How to Setup on Android:</h3>
                <ol className="text-xs text-stone-400 space-y-2 list-decimal list-inside">
                  <li>Open Android <span className="text-white">Settings</span></li>
                  <li>Go to <span className="text-white">Network & Internet</span> → <span className="text-white">Private DNS</span></li>
                  <li>Select <span className="text-white">Private DNS provider hostname</span></li>
                  <li>Paste the hostname above and click <span className="text-white">Save</span></li>
                </ol>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'}`}>
                  {isEnabled ? <ShieldCheck className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-900">Protection Status</h2>
                  <p className="text-stone-500 text-sm">Monitor your DNS filtering status.</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggleBlocker(!isEnabled)}
                className={`w-16 h-8 rounded-full transition-all relative ${isEnabled ? 'bg-emerald-500' : 'bg-stone-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isEnabled ? 'left-9' : 'left-1'}`} />
              </button>
            </div>

            <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className={`w-5 h-5 ${isStrict ? 'text-orange-500' : 'text-stone-300'}`} />
                  <div>
                    <h3 className="font-bold text-stone-900">Strict Mode</h3>
                    <p className="text-stone-500 text-xs">Cannot disable without PIN protection.</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleStrict(!isStrict)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isStrict ? 'bg-orange-500' : 'bg-stone-200'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isStrict ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-8">
          <section className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <h3 className="font-black uppercase tracking-widest text-xs text-stone-400">Blocked Attempts</h3>
            </div>
            <div className="text-4xl font-black mb-2">{totalAttempts}</div>
            <p className="text-stone-400 text-xs mb-8">Total attempts prevented by DNS filtering.</p>
            
            <div className="space-y-4">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-stone-400 truncate max-w-[120px]">{stat.domain}</span>
                    <span className="text-emerald-400">{stat.count}</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400" 
                      style={{ width: `${(stat.count / totalAttempts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Info className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-emerald-900 text-lg mb-2">CleanBrowsing</h3>
                <p className="text-emerald-700/70 text-sm font-medium leading-relaxed italic">
                  CleanBrowsing is a world-class DNS service that blocks adult content, malicious sites, and phishing attempts.
                </p>
                <a 
                  href="https://cleanbrowsing.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs hover:underline"
                >
                  Learn More <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
