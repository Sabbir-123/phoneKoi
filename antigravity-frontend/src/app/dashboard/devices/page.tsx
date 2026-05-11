'use client';

import { useDashboardStore } from '@/store/useDashboardStore';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Smartphone, Sparkles, Plus } from 'lucide-react';
import { MotionButton } from '@/components/ui/MotionButton';
import { useState } from 'react';

const mockDevices = [
  { id: 1, name: 'iPhone 14 Pro Max', imei: '359281093827164', status: 'Pending', risk: 'Medium', lastActivity: '2 hours ago' },
  { id: 2, name: 'Samsung Galaxy S23', imei: '867291038475621', status: 'Verified', risk: 'High', lastActivity: '1 day ago' },
];

export default function ReportedDevicesPage() {
  const { language } = useDashboardStore();
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {language === 'banglish' ? 'Amar Report Kora Devices' : 'My Reported Devices'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'banglish' ? 'Apnar harano device track korun.' : 'Manage and track your reported stolen devices.'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <MotionButton>
            <Plus className="w-5 h-5" />
            {language === 'banglish' ? 'Notun Device Add Korun' : 'Add New Device'}
          </MotionButton>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {mockDevices.map((device, i) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard 
                className={`p-6 cursor-pointer transition-colors ${selectedDevice === device.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'hover:bg-white/5'}`}
                onClick={() => setSelectedDevice(device.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <Smartphone className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{device.name}</h3>
                      <p className="text-sm font-mono text-slate-400">{device.imei}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                      {device.status}
                    </div>
                    <p className="text-xs text-slate-500">{device.lastActivity}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* AI Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDevice ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="sticky top-28"
            >
              <GlassCard className="p-6 space-y-6 border-indigo-500/20">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-white">
                    {language === 'banglish' ? 'AI Analysis' : 'AI Analysis'}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {language === 'banglish' 
                      ? 'Ei device ta multiple jaygay search hoise, jar mane keu eita use korar chesta korche. High risk detect hoise dhaka area theke.'
                      : 'This device has been searched from multiple locations recently, indicating someone is trying to use or sell it. High risk detected in the Dhaka area.'}
                  </p>
                  
                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Next Steps</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Wait for further verification signals
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Keep your purchase receipt handy
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-white/10 rounded-2xl">
              <p className="text-slate-500 text-sm text-center px-6">
                {language === 'banglish' ? 'Kono device select korun details dekhar jonno.' : 'Select a device to view detailed AI analysis.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
