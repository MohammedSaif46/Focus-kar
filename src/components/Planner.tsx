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
    <div className="min-h-screen bg-black text-white p-6 pb-32">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h1>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1"
          >
            Jump to Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-stone-400" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      </header>

      {/* Horizontal Date Picker */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto mb-10 pb-2 no-scrollbar scroll-smooth"
      >
        {calendarDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[56px] relative"
            >
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                isSelected ? "text-emerald-500" : "text-stone-500"
              )}>
                {format(day, 'EEE')}
              </span>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all relative",
                isSelected 
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-110' 
                  : 'bg-stone-900/50 text-stone-400 border border-stone-800 hover:border-stone-700'
              )}>
                {format(day, 'd')}
                {isToday && !isSelected && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Focus Goal Card */}
      <section className="bg-stone-900/40 p-8 rounded-[2.5rem] border border-stone-800/50 mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-white">Daily Focus Goal</h3>
            <p className="text-stone-500 text-xs font-medium">You're almost there! 15m left.</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-500" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="h-4 bg-stone-800 rounded-full overflow-hidden p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
            <span>45m Focused</span>
            <span>60m Goal</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-stone-900/50 p-4 rounded-2xl border border-stone-800">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Focus</span>
          <div className="text-xl font-bold">0m</div>
        </div>
        <div className="bg-stone-900/50 p-4 rounded-2xl border border-stone-800">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Usage</span>
          <div className="text-xl font-bold">6h 38m</div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="w-12 h-12 text-stone-800 mx-auto mb-4" />
            <p className="text-stone-500 text-sm">No schedules yet. Add one to stay focused!</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="bg-stone-900/50 p-5 rounded-3xl border border-stone-800 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
              <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center">
                <Moon className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{schedule.name}</h3>
                  {schedule.repeat && <Repeat className="w-4 h-4 text-emerald-500" />}
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black">
                    <Hourglass className="w-3 h-3" />
                    2
                  </div>
                </div>
                <div className="text-stone-400 text-sm font-medium">
                  {schedule.fromTime} - {schedule.toTime}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-stone-700" />
            </div>
          ))
        )}
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 left-1/2 -translate-x-1/2 px-8 py-4 bg-white text-black rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform z-40"
      >
        <Plus className="w-5 h-5" />
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
