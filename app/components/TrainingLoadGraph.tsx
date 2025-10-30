'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

interface TrainingLoadDataPoint {
  day: string;
  load: number;
  date: string;
}

/**
 * Get the day abbreviation (Mo, Tu, We, etc.) for a given date
 */
function getDayAbbreviation(date: Date, language: string): string {
  const dayMap = {
    de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };
  const days = dayMap[language as keyof typeof dayMap] || dayMap.en;
  const day = days[date.getDay()];
  return day || 'Sun'; // Fallback to 'Sun' if undefined
}

/**
 * Get Monday of the current week (or selected date's week)
 */
function getMondayOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days, else go to Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const formatted = date.toISOString().split('T')[0];
  return formatted || date.toDateString(); // Fallback if split fails
}

/**
 * Generate 7 days of training load data (Mon-Sun) for the current week
 */
function generateWeekData(
  trainingLoadMap: Record<string, { load: number }>,
  selectedDate: string,
  language: string
): TrainingLoadDataPoint[] {
  const baseDate = selectedDate ? new Date(selectedDate) : new Date();
  const monday = getMondayOfWeek(baseDate);

  const weekData: TrainingLoadDataPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    const dateKey = formatDate(currentDate);

    const loadData = trainingLoadMap[dateKey];
    const load = loadData?.load ?? 0;

    weekData.push({
      day: getDayAbbreviation(currentDate, language),
      load,
      date: dateKey,
    });
  }

  return weekData;
}

interface TrainingLoadGraphProps {
  height?: number;
}

function TrainingLoadGraph({ height = 120 }: TrainingLoadGraphProps) {
  const { language } = useTranslation();
  const trainingLoadMap = useStore((state) => state.trainingLoad);
  const selectedDate = useStore((state) => state.selectedDate);

  const weekData = useMemo(
    () => generateWeekData(trainingLoadMap, selectedDate, language),
    [trainingLoadMap, selectedDate, language]
  );

  const maxLoad = useMemo(() => {
    const max = Math.max(...weekData.map((d) => d.load));
    return max > 0 ? Math.ceil(max / 100) * 100 : 1000; // Round up to nearest 100
  }, [weekData]);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={weekData}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="rgb(96, 165, 250)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis
            dataKey="day"
            tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
          />
          <YAxis
            domain={[0, maxLoad]}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            tickLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            ticks={[0, maxLoad / 2, maxLoad]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'white',
            }}
            labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
            formatter={(value: number) => [`${value}`, 'Load']}
          />
          <Area
            type="monotone"
            dataKey="load"
            stroke="rgb(96, 165, 250)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLoad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrainingLoadGraph;

