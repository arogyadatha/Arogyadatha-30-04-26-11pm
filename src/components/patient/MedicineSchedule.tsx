import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Bell, BellOff, Clock, CheckCircle, Pill } from 'lucide-react';
import { toast } from 'sonner';

interface Medicine {
  id: string;
  name?: string;
  medicineName?: string;
  dosage?: string;
  timing?: string;
  duration?: string;
  food?: 'before' | 'after';
  instructions?: string;
}

interface MedicineScheduleProps {
  caseId: string;
  patientId: string;
  medicines: Medicine[];
  onClose: () => void;
}

const timingMap: Record<string, { time: string; emoji: string; label: string; color: string }> = {
  Morning: { time: '08:00', emoji: '🌅', label: 'Morning', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  Afternoon: { time: '13:00', emoji: '☀️', label: 'Afternoon', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  Evening: { time: '18:00', emoji: '🌆', label: 'Evening', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  Night: { time: '21:00', emoji: '🌙', label: 'Night', color: 'bg-teal-50 border-teal-200 text-teal-700' },
};

export default function MedicineSchedule({ caseId, patientId, medicines, onClose }: MedicineScheduleProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  useEffect(() => {
    if (notificationPermission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, [notificationPermission]);

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications.');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success('🔔 Medicine reminders enabled!');
      // Schedule a test notification
      setTimeout(() => {
        new Notification('💊 Arogyadatha Medicine Reminder', {
          body: `Time to take your medicines! You have ${medicines.length} medicine(s) scheduled.`,
          icon: '/icon.png',
        });
      }, 2000);
    } else {
      toast.error('Notification permission denied.');
    }
  };

  const getMedicineName = (m: Medicine) => m.name || m.medicineName || 'Medicine';
  const getTimings = (m: Medicine): string[] => {
    if (!m.timing) return [];
    // Support "Morning, Night" or "Morning|Night" or object {morning: true, night: true}
    if (typeof m.timing === 'string') {
      return m.timing.split(/[,|]/).map((t) => t.trim());
    }
    return [];
  };

  // Group medicines by timing for schedule view
  const scheduleByTime: Record<string, Medicine[]> = {};
  medicines.forEach((m) => {
    const timings = getTimings(m);
    timings.forEach((t) => {
      if (!scheduleByTime[t]) scheduleByTime[t] = [];
      scheduleByTime[t].push(m);
    });
  });

  const orderedTimings = ['Morning', 'Afternoon', 'Evening', 'Night'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] border-2 border-pink-100 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm leading-none">Medicine Schedule</h3>
              <p className="text-pink-100 text-[10px] font-medium mt-0.5">{medicines.length} medicine{medicines.length !== 1 ? 's' : ''} prescribed</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Notification Toggle */}
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
          notificationsEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-emerald-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-xs font-black text-gray-800">Medicine Reminders</p>
              <p className="text-[10px] text-gray-500 font-medium">
                {notificationsEnabled ? 'Reminders are active' : 'Get notified at medicine times'}
              </p>
            </div>
          </div>
          {notificationsEnabled ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700">ON</span>
            </div>
          ) : (
            <button
              onClick={requestNotifications}
              className="px-3 py-1.5 bg-pink-500 text-white rounded-xl text-[10px] font-black active:scale-95 transition-all"
            >
              Enable
            </button>
          )}
        </div>

        {/* Schedule by Time */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">Daily Schedule</p>
          <div className="space-y-2">
            {orderedTimings.map((timeLabel) => {
              const meds = scheduleByTime[timeLabel];
              if (!meds || meds.length === 0) return null;
              const tc = timingMap[timeLabel];
              return (
                <div key={timeLabel} className={`rounded-2xl border-2 ${tc.color} p-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{tc.emoji}</span>
                    <div className="flex-1">
                      <p className="text-xs font-black">{tc.label}</p>
                      <p className="text-[10px] font-medium opacity-70">{tc.time}</p>
                    </div>
                    <Clock className="w-3.5 h-3.5 opacity-50" />
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {meds.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                        <p className="text-[11px] font-bold">{getMedicineName(m)}</p>
                        {m.dosage && (
                          <span className="text-[9px] font-medium opacity-60 bg-white/60 px-1.5 py-0.5 rounded-full">
                            {m.dosage}
                          </span>
                        )}
                        {m.food && (
                          <span className="text-[9px] opacity-60">{m.food === 'before' ? '🍽️ Before food' : '🍽️ After food'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Medicine List */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5 px-1">All Medicines</p>
          <div className="space-y-2">
            {medicines.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                    <Pill className="w-4 h-4 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800">{getMedicineName(m)}</p>
                    {m.dosage && <p className="text-[11px] text-gray-500 font-medium">{m.dosage}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {getTimings(m).map((t) => (
                        <span key={t} className="text-[9px] font-black bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                          {timingMap[t]?.emoji || '💊'} {t}
                        </span>
                      ))}
                      {m.duration && (
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {m.duration}
                        </span>
                      )}
                    </div>
                    {m.instructions && (
                      <p className="text-[10px] text-gray-400 italic mt-1">{m.instructions}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
