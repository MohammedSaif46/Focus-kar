import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Plus, Clock, Moon, Sun, Repeat, HelpCircle, ChevronRight, ChevronLeft, Hourglass, Tag, X, Smartphone, Check, Zap } from 'lucide-react';
import { User, Schedule } from '../types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PlannerProps {
  user: User;
}

export default function Planner({ user }: PlannerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const StatusBar = ({ dark = false }: { dark?: boolean }) => (
    <div className={`h-12 px-6 flex items-center justify-between ${dark ? 'text-white' : 'text-black'}`}>
      <span className="text-sm font-bold">9:41</span>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-sm border-[1.5px] border-current flex items-center justify-center">
          <div className="w-2 h-2 bg-current rounded-full" />
        </div>
        <Zap className="w-4 h-4 fill-current" />
        <div className="w-6 h-3 rounded-sm border-[1.5px] border-current relative">
          <div className="absolute left-0.5 top-0.5 bottom-0.5 w-3 bg-current rounded-sm" />
        </div>
      </div>
    </div>
  );

  // Generate 30 days for the horizontal picker
  const [baseDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const calendarDays = Array.from({ length: 30 }, (_, i) => addDays(baseDate, i));

  useEffect(() => {
    const q = query(
      collection(db, 'schedules'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Schedule[];
      setSchedules(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schedules');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      <StatusBar dark />
      
      <div className="p-6 pb-32">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{format(selectedDate, 'MMMM yyyy')}</h1>
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-2 hover:text-emerald-400 transition-colors"
            >
              Jump to Today
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => scroll('left')}
              className="p-3 bg-stone-900/50 rounded-2xl border border-stone-800 hover:bg-stone-800 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5 text-stone-400" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 bg-stone-900/50 rounded-2xl border border-stone-800 hover:bg-stone-800 transition-all active:scale-90"
            >
              <ChevronRight className="w-5 h-5 text-stone-400" />
            </button>
          </div>
        </header>

        {/* Horizontal Date Picker */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto mb-12 pb-4 no-scrollbar scroll-smooth"
        >
          {calendarDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className="flex flex-col items-center gap-3 flex-shrink-0 min-w-[64px] relative group"
              >
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                  isSelected ? "text-emerald-500" : "text-stone-500 group-hover:text-stone-300"
                )}>
                  {format(day, 'EEE')}
                </span>
                <div className={cn(
                  "w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-base font-black transition-all relative",
                  isSelected 
                    ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' 
                    : 'bg-stone-900/40 text-stone-400 border border-stone-800/50 hover:border-stone-700 hover:bg-stone-800/60'
                )}>
                  {format(day, 'd')}
                  {isToday && !isSelected && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Focus Goal Card */}
        <section className="bg-stone-900/40 p-8 rounded-[3rem] border border-stone-800/50 mb-12 shadow-inner">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Daily Focus Goal</h3>
              <p className="text-stone-500 text-sm font-bold mt-1">You're almost there! <span className="text-emerald-500">15m left.</span></p>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center border border-emerald-500/20">
              <Zap className="w-7 h-7 text-emerald-500 fill-current" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-5 bg-stone-900 rounded-full overflow-hidden p-1 border border-stone-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              />
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-stone-600">
              <span>45m Focused</span>
              <span>60m Goal</span>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-stone-900/40 p-6 rounded-[2rem] border border-stone-800/50 shadow-lg">
            <span className="text-[11px] font-black text-stone-600 uppercase tracking-[0.2em] block mb-2">Focus Time</span>
            <div className="text-3xl font-black tracking-tight">0m</div>
          </div>
          <div className="bg-stone-900/40 p-6 rounded-[2rem] border border-stone-800/50 shadow-lg">
            <span className="text-[11px] font-black text-stone-600 uppercase tracking-[0.2em] block mb-2">App Usage</span>
            <div className="text-3xl font-black tracking-tight">6h 38m</div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-5">
          <h2 className="text-xl font-black text-stone-100 mb-6 tracking-tight">Your Schedule</h2>
          {schedules.length === 0 ? (
            <div className="py-24 text-center bg-stone-900/20 rounded-[3rem] border border-dashed border-stone-800">
              <Calendar className="w-16 h-16 text-stone-800 mx-auto mb-6" />
              <p className="text-stone-500 font-bold">No schedules yet. Add one to stay focused!</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <motion.div 
                key={schedule.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-stone-900/40 p-6 rounded-[2.5rem] border border-stone-800/50 flex items-center gap-5 relative overflow-hidden shadow-lg group active:scale-[0.98] transition-transform"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-violet-500 shadow-[2px_0_10px_rgba(139,92,246,0.3)]" />
                <div className="w-14 h-14 bg-stone-800 rounded-[1.25rem] flex items-center justify-center border border-stone-700">
                  <Moon className="w-7 h-7 text-amber-400 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="font-black text-xl tracking-tight">{schedule.name}</h3>
                    {schedule.repeat && <Repeat className="w-4 h-4 text-emerald-500" />}
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black border border-amber-500/20">
                      <Hourglass className="w-3.5 h-3.5" />
                      2
                    </div>
                  </div>
                  <div className="text-stone-500 text-[15px] font-bold">
                    {schedule.fromTime} - {schedule.toTime}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-stone-700 group-hover:text-stone-500 transition-colors" />
              </motion.div>
            ))
          )}
        </div>

        {/* Floating Add Button */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 px-10 py-5 bg-white text-black rounded-full font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.15)] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all z-40"
        >
          <Plus className="w-6 h-6" />
          Add Schedule
        </button>

      {/* New Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <NewScheduleModal 
            user={user} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function NewScheduleModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('Untagged');
  const [fromTime, setFromTime] = useState('09:00 PM');
  const [toTime, setToTime] = useState('11:00 PM');
  const [date, setDate] = useState(format(new Date(), 'MMM d'));
  const [repeat, setRepeat] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [description, setDescription] = useState('');

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await addDoc(collection(db, 'schedules'), {
        uid: user.uid,
        name,
        tag,
        fromTime,
        toTime,
        date,
        repeat,
        breakMinutes,
        blockedApps: ['Instagram', 'YouTube', 'Facebook'], // Mocked for now
        description,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'schedules');
    }
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="p-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">New Schedule</h2>
        <button onClick={onClose} className="p-2 bg-stone-900 rounded-full">
          <X className="w-6 h-6 text-stone-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Name Input */}
        <div className="flex items-center gap-4 bg-stone-900/50 p-4 rounded-2xl border border-stone-800">
          <div className="w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-amber-400" />
          </div>
          <input 
            type="text" 
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent flex-1 outline-none text-lg font-medium placeholder:text-stone-600"
          />
        </div>

        {/* Tag Selection */}
        <div className="flex items-center justify-between">
          <span className="text-stone-400 font-bold text-sm uppercase tracking-widest">Tag</span>
          <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 rounded-full text-sm font-bold text-stone-300">
            <div className="w-2 h-2 bg-stone-500 rounded-full" />
            {tag}
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        {/* Schedule Section */}
        <div className="space-y-6">
          <h3 className="text-stone-400 font-bold text-sm uppercase tracking-widest">Schedule</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-100 font-medium">From</span>
              <button className="flex items-center gap-2 text-stone-400 font-medium">
                {fromTime}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-100 font-medium">To</span>
              <button className="flex items-center gap-2 text-stone-400 font-medium">
                {toTime}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-100 font-medium">Date</span>
              <button className="flex items-center gap-2 text-stone-400 font-medium">
                {date}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-100 font-medium">Repeat</span>
              <button 
                onClick={() => setRepeat(!repeat)}
                className={`w-12 h-6 rounded-full transition-colors relative ${repeat ? 'bg-emerald-500' : 'bg-stone-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${repeat ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-100 font-medium">Break</span>
              <button className="flex items-center gap-2 text-stone-400 font-medium">
                {breakMinutes} mins
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Block Settings */}
        <div className="space-y-6">
          <h3 className="text-stone-400 font-bold text-sm uppercase tracking-widest">Block settings</h3>
          <div className="flex items-center justify-between bg-stone-900/50 p-5 rounded-3xl border border-stone-800">
            <span className="text-stone-100 font-medium">Blocked Apps</span>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">Y</div>
                <div className="w-6 h-6 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">I</div>
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black">F</div>
              </div>
              <span className="text-stone-400 text-sm font-medium">4 apps</span>
              <ChevronRight className="w-4 h-4 text-stone-700" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-stone-400 font-bold text-sm uppercase tracking-widest">Description</h3>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent outline-none text-stone-400 placeholder:text-stone-700 resize-none min-h-[100px]"
            placeholder="Add notes..."
          />
        </div>
      </div>

      <div className="p-6">
        <button 
          onClick={handleSave}
          className="w-full py-5 bg-white text-black rounded-full font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-transform"
        >
          Save
        </button>
      </div>
    </motion.div>
  );
}
