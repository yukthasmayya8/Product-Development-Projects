import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { translations } from '../lib/translations';

interface HistoryChartProps {
  data: any[];
  language?: string;
}

export default function HistoryChart({ data, language = 'English' }: HistoryChartProps) {
  const t = translations[language] || translations.English;
  const chartData = data.map((d) => ({
    name: d.subject,
    duration: d.durationMinutes,
  }));

  return (
    <div className="glass-surface rounded-[40px] p-10 h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#ff4e00]/5 to-transparent opacity-50" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
            <TrendingUp size={20} className="text-[#ff4e00]" />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-40">{t.focusAnalytics}</h3>
        </div>

        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700 }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="duration" radius={[12, 12, 0, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ff4e00' : 'rgba(255,78,0,0.4)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30 mb-2">{t.totalFocus}</span>
            <span className="text-4xl font-display tracking-tighter text-white">
              {data.reduce((acc, curr) => acc + curr.durationMinutes, 0)} <span className="text-xs opacity-30 font-serif lowercase italic">{t.minutes}</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30 mb-2">{t.sessions}</span>
            <span className="text-4xl font-display tracking-tighter text-[#ff4e00]">{data.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
