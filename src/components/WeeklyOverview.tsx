import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import GlassCard from './GlassCard';
import {
  getSportEntries,
  getPushUpEntries,
  getProteinEntries,
  getWaterEntries,
} from '../services/database';

interface DayProgress {
  date: Date;
  pushups: boolean;
  sport: boolean;
  protein: boolean;
  water: boolean;
  completion: number;
}

type ViewMode = 'week' | 'month';

const SEGMENT_COLORS = ['#FF6B6B', '#45AAF2', '#FFB347', '#00D084'];

const getStartOfWeek = (reference: Date) => {
  const date = new Date(reference);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStartOfMonth = (reference: Date) => {
  const date = new Date(reference.getFullYear(), reference.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDaysInMonth = (reference: Date) => new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();

const formatDayLabel = (date: Date, mode: ViewMode) => {
  if (mode === 'week') {
    const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    return labels[(date.getDay() + 6) % 7];
  }
  return date.getDate().toString();
};

const ProgressRing: React.FC<{ day: DayProgress; mode: ViewMode; colors: any }> = ({ day, mode, colors }) => {
  const segments = [day.pushups, day.water, day.protein, day.sport];
  const size = mode === 'month' ? 46 : 72;
  const strokeWidth = mode === 'month' ? 8 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / segments.length;

  return (
    <View style={[styles.ringContainer, mode === 'month' && styles.ringContainerSmall]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="transparent" />
        {segments.map((active, index) => (
          <Circle
            key={`segment-${index}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={active ? SEGMENT_COLORS[index] : colors.border}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference}`}
            strokeDashoffset={circumference - segmentLength * (index + 1)}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.ringValue, { color: colors.text }]}>{Math.round(day.completion)}%</Text>
        <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{formatDayLabel(day.date, mode)}</Text>
      </View>
    </View>
  );
};

export default function WeeklyOverview() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState<DayProgress[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  useEffect(() => {
    loadData();
  }, [user, viewMode]);

  const loadData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = viewMode === 'week' ? getStartOfWeek(today) : getStartOfMonth(today);
    const totalDays = viewMode === 'week' ? 7 : getDaysInMonth(today);

    if (!user) {
      const fallback: DayProgress[] = Array.from({ length: totalDays }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        return {
          date,
          pushups: false,
          sport: false,
          protein: false,
          water: false,
          completion: 0,
        };
      });
      setData(fallback);
      return;
    }

    const [sportData, pushData, proteinData, waterData] = await Promise.all([
      getSportEntries(user.uid),
      getPushUpEntries(user.uid),
      getProteinEntries(user.uid),
      getWaterEntries(user.uid),
    ]);

    const days: DayProgress[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const fallsIntoDay = (entries: { date: Date | string }[]) =>
        entries.some(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= date && entryDate < nextDay;
        });

      const hasSport = fallsIntoDay(sportData);
      const hasPushups = fallsIntoDay(pushData);
      const hasProtein = fallsIntoDay(proteinData);
      const hasWater = fallsIntoDay(waterData);

      const completed = [hasSport, hasPushups, hasProtein, hasWater].filter(Boolean).length;
      const completion = (completed / 4) * 100;

      days.push({
        date,
        pushups: hasPushups,
        sport: hasSport,
        protein: hasProtein,
        water: hasWater,
        completion,
      });
    }

    setData(days);
  };

  const getStats = () => {
    if (!data.length) {
      return { total: 0, completed: 0, avgCompletion: 0 };
    }
    const total = data.length;
    const completed = data.filter(day => day.completion === 100).length;
    const avgCompletion = data.reduce((sum, day) => sum + day.completion, 0) / total;
    return { total, completed, avgCompletion };
  };

  const stats = getStats();

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Wochenübersicht</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {stats.completed} von {stats.total} Tagen perfekt · {Math.round(stats.avgCompletion)}%
          </Text>
        </View>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: viewMode === 'week' ? colors.primary : colors.background },
            ]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'week' ? 'white' : colors.text }]}>Woche</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: viewMode === 'month' ? colors.primary : colors.background },
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'month' ? 'white' : colors.text }]}>Monat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.ringsContainer, viewMode === 'month' && styles.ringsContainerMonth]}>
        {data.map((day, index) => (
          <ProgressRing key={`${day.date.toISOString()}-${index}`} day={day} mode={viewMode} colors={colors} />
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SEGMENT_COLORS[0] }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Push-ups</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SEGMENT_COLORS[1] }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Wasser</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SEGMENT_COLORS[2] }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Protein</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SEGMENT_COLORS[3] }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>Sport</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ringsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ringsContainerMonth: {
    justifyContent: 'flex-start',
  },
  ringContainer: {
    alignItems: 'center',
  },
  ringContainerSmall: {
    marginVertical: 4,
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
