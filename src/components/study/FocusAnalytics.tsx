import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import { Activity, Smartphone, BookOpen, AlertCircle } from "lucide-react";
import { translations } from "@/lib/translations";
import Skeleton from "@/components/shared/Skeleton";

interface FocusAnalyticsProps {
  studyData: any[];
  screenTimeData: any[];
  distractionData: any[];
  language?: string;
  loading?: boolean;
}

export default function FocusAnalytics({
  studyData,
  screenTimeData,
  distractionData,
  language = "English",
  loading = false,
}: FocusAnalyticsProps) {
  const t = translations[language] || translations.English;

  // Process data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((date) => {
    const dayStudy = studyData
      .filter((s) => {
        const sDate = s.timestamp?.toDate
          ? s.timestamp.toDate().toISOString().split("T")[0]
          : s.date;
        return sDate === date;
      })
      .reduce(
        (acc, curr) => acc + (curr.duration || curr.durationMinutes || 0),
        0,
      );

    const dayScreen =
      screenTimeData.find((s) => s.date === date)?.screenTime || 0;

    return {
      date: date.split("-").slice(1).join("/"),
      study: dayStudy,
      screen: dayScreen,
      ratio: dayStudy > 0 ? (dayStudy / (dayScreen || 1)).toFixed(2) : 0,
    };
  });

  const totalStudy = chartData.reduce((acc, curr) => acc + curr.study, 0);
  const totalScreen = chartData.reduce((acc, curr) => acc + curr.screen, 0);
  const totalDistractionTime = distractionData.reduce(
    (acc, curr) => acc + (curr.duration || 0),
    0,
  );
  const averageRatio =
    totalStudy > 0 ? (totalStudy / (totalScreen || 1)).toFixed(2) : "0.00";

  // Distraction breakdown
  const distractionBreakdown = distractionData.reduce((acc: any, curr) => {
    acc[curr.source] = (acc[curr.source] || 0) + 1;
    return acc;
  }, {});

  const topDistractions = Object.entries(distractionBreakdown)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3);

  return (
    <div className="glass-surface rounded-[40px] p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 to-transparent opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
              <Activity size={20} className="text-[#ff4e00]" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-sans font-bold opacity-40">
              {t.focusAnalytics}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff4e00]" />
              <span className="text-[8px] uppercase tracking-widest font-bold opacity-40">
                {t.studyTime}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-[8px] uppercase tracking-widest font-bold opacity-40">
                {t.screenTime}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          <div className="lg:col-span-2 h-[300px]">
            {loading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                      fontWeight: 700,
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fill: "rgba(255,255,255,0.3)",
                      fontWeight: 700,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                    }}
                  />
                  <Bar
                    dataKey="study"
                    fill="#ff4e00"
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="screen"
                    fill="rgba(255,255,255,0.1)"
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-6 flex flex-col justify-center">
            <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-widest font-bold opacity-30">
                  Weekly Ratio
                </span>
                <Activity size={12} className="text-[#ff4e00]" />
              </div>
              <div className="flex items-baseline gap-2">
                {loading ? (
                  <Skeleton className="w-16 h-8" />
                ) : (
                  <>
                    <span className="text-3xl font-display tracking-tighter">
                      {averageRatio}
                    </span>
                    <span className="text-[8px] font-bold opacity-30 uppercase">
                      Study/Screen
                    </span>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 space-y-3">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-full h-2" />
                <Skeleton className="w-full h-2" />
                <Skeleton className="w-full h-2" />
              </div>
            ) : (
              topDistractions.length > 0 && (
                <div className="p-6 bg-white/5 rounded-[32px] border border-white/10">
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-30 block mb-4">
                    Top Distractions
                  </span>
                  <div className="space-y-3">
                    {topDistractions.map(([source, count]: any) => (
                      <div
                        key={source}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[10px] font-bold opacity-60">
                          {source}
                        </span>
                        <span className="text-[10px] font-mono text-[#ff4e00]">
                          {count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <div className="p-6 bg-[#ff4e00]/5 rounded-[32px] border border-[#ff4e00]/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-[#ff4e00]" />
                <span className="text-[9px] uppercase tracking-widest font-bold text-[#ff4e00]">
                  Insight
                </span>
              </div>
              {loading ? (
                <Skeleton className="w-full h-10" />
              ) : (
                <p className="text-[10px] leading-relaxed opacity-60 italic">
                  {totalDistractionTime > totalStudy / 2
                    ? `Distractions are consuming ${Math.round((totalDistractionTime / (totalStudy || 1)) * 100)}% of your study time. Focus on reducing ${topDistractions[0]?.[0] || "distractions"}.`
                    : parseFloat(averageRatio) > 1
                      ? "You're outperforming your distractions. Your focus is sharp and intentional."
                      : "Distractions are winning. Try the 'Grey Scale' method to reduce phone allure."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center space-y-2"
              >
                <Skeleton className="w-4 h-4 mx-auto" />
                <Skeleton className="w-12 h-6 mx-auto" />
                <Skeleton className="w-16 h-2 mx-auto" />
              </div>
            ))
          ) : (
            <>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <BookOpen size={14} className="mx-auto mb-2 opacity-20" />
                <div className="text-lg font-display tracking-tighter">
                  {totalStudy}
                </div>
                <div className="text-[8px] uppercase tracking-widest font-bold opacity-30">
                  Total Study
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <Smartphone size={14} className="mx-auto mb-2 opacity-20" />
                <div className="text-lg font-display tracking-tighter">
                  {totalScreen}
                </div>
                <div className="text-[8px] uppercase tracking-widest font-bold opacity-30">
                  Total Screen
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <Activity size={14} className="mx-auto mb-2 opacity-20" />
                <div className="text-lg font-display tracking-tighter">
                  {totalDistractionTime}
                </div>
                <div className="text-[8px] uppercase tracking-widest font-bold opacity-30">
                  Total Distraction
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <Activity size={14} className="mx-auto mb-2 opacity-20" />
                <div className="text-lg font-display tracking-tighter">
                  {Math.round(totalStudy / 7)}
                </div>
                <div className="text-[8px] uppercase tracking-widest font-bold opacity-30">
                  Avg Study/Day
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
