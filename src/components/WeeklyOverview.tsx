import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getSportEntries,
  getPushUpEntries,
  getProteinEntries,
  getWaterEntries
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

const ProgressRing: React.FC<{ progress: number; day: string; colors: any; small?: boolean }> = ({ progress, day, colors, small = false }) => {
  const size = small ? 40 : 70;
  const strokeWidth = small ? 4 : 6;

  const getColor = () => {
    if (progress === 100) return '#00D084';
    if (progress >= 75) return '#4ECDC4';
    if (progress >= 50) return '#FFD93D';
    if (progress >= 25) return '#FF6B6B';
    return colors.border;
  };

  return (
    <View style={[styles.ringContainer, small && styles.ringContainerSmall]}>
      <View style={{ width: size, height: size, position: 'relative' }}>
        {/* Background Ring */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.border,
          }}
        />
        {/* Progress Ring */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: getColor(),
            borderTopColor: progress >= 25 ? getColor() : colors.border,
            borderRightColor: progress >= 50 ? getColor() : colors.border,
            borderBottomColor: progress >= 75 ? getColor() : colors.border,
            borderLeftColor: progress >= 100 ? getColor() : colors.border,
            transform: [{ rotate: '-90deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={[styles.ringPercentage, { color: colors.text, fontSize: small ? 10 : 14 }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
      <Text style={[styles.dayLabel, { color: colors.textSecondary, fontSize: small ? 10 : 12 }]}>{day}</Text>
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
    if (!user) {
      // Show empty data when no user
      const today = new Date();
      const days: DayProgress[] = [];
      const daysToShow = viewMode === 'week' ? 7 : 30;

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push({
          date,
          pushups: false,
          sport: false,
          protein: false,
          water: false,
          completion: 0,
        });
      }
      setData(days);
      return;
    }

    const today = new Date();
    const days: DayProgress[] = [];
    const daysToShow = viewMode === 'week' ? 7 : 30;

    // Fetch all data once
    const [sportData, pushupData, proteinData, waterData] = await Promise.all([
      getSportEntries(user.uid),
      getPushUpEntries(user.uid),
      getProteinEntries(user.uid),
      getWaterEntries(user.uid),
    ]);

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const hasSport = sportData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

      const hasPushups = pushupData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

      const hasProtein = proteinData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

      const hasWater = waterData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

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

  const getDayName = (date: Date) => {
    if (viewMode === 'week') {
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return days[date.getDay()];
    } else {
      return date.getDate().toString();
    }
  };

  const getWeekStats = () => {
    const total = data.length;
    const completed = data.filter(d => d.completion === 100).length;
    const avgCompletion = data.reduce((sum, d) => sum + d.completion, 0) / total;
    return { total, completed, avgCompletion };
  };

  const stats = getWeekStats();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {viewMode === 'week' ? 'Wochenübersicht' : 'Monatsübersicht'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {stats.completed} von {stats.total} Tagen perfekt · ⌀ {Math.round(stats.avgCompletion)}%
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
            <Text style={[styles.toggleText, { color: viewMode === 'week' ? 'white' : colors.text }]}>
              Woche
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: viewMode === 'month' ? colors.primary : colors.background },
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.toggleText, { color: viewMode === 'month' ? 'white' : colors.text }]}>
              Monat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.ringsContainer, viewMode === 'month' && styles.ringsContainerMonth]}>
        {data.map((day, index) => (
          <ProgressRing
            key={index}
            progress={day.completion}
            day={getDayName(day.date)}
            colors={colors}
            small={viewMode === 'month'}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    gap: 4,
    backgroundColor: 'transparent',
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
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  ringsContainerMonth: {
    gap: 8,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  ringContainerSmall: {
    marginBottom: 5,
  },
  ringPercentage: {
    fontWeight: '700',
  },
  dayLabel: {
    marginTop: 4,
    fontWeight: '600',
  },
});
