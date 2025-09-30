import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  getSportEntries,
  getPushUpEntries,
  getNutritionEntries,
  getWaterEntries
} from '../services/database';

interface DayProgress {
  date: Date;
  pushups: boolean;
  sport: boolean;
  nutrition: boolean;
  water: boolean;
  completion: number;
}

const ProgressRing: React.FC<{ progress: number; day: string; colors: any }> = ({ progress, day, colors }) => {
  const size = 70;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const getColor = () => {
    if (progress === 100) return '#00D084';
    if (progress >= 75) return '#4ECDC4';
    if (progress >= 50) return '#FFD93D';
    if (progress >= 25) return '#FF6B6B';
    return colors.border;
  };

  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.ringContainer}>
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
        {/* Progress Ring using conic gradient simulation */}
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
          <Text style={[styles.ringPercentage, { color: colors.text }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
      <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
    </View>
  );
};

export default function WeeklyOverview() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [weekData, setWeekData] = useState<DayProgress[]>([]);

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    if (!user) {
      // Show empty week when no user
      const today = new Date();
      const weekDays: DayProgress[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        weekDays.push({
          date,
          pushups: false,
          sport: false,
          nutrition: false,
          water: false,
          completion: 0,
        });
      }
      setWeekData(weekDays);
      return;
    }

    const today = new Date();
    const weekDays: DayProgress[] = [];

    // Fetch all data once
    const [sportData, pushupData, nutritionData, waterData] = await Promise.all([
      getSportEntries(user.uid),
      getPushUpEntries(user.uid),
      getNutritionEntries(user.uid),
      getWaterEntries(user.uid),
    ]);

    for (let i = 6; i >= 0; i--) {
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

      const hasNutrition = nutritionData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

      const hasWater = waterData.some(e => {
        const entryDate = new Date(e.date);
        return entryDate >= date && entryDate < nextDay;
      });

      const completed = [hasSport, hasPushups, hasNutrition, hasWater].filter(Boolean).length;
      const completion = (completed / 4) * 100;

      weekDays.push({
        date,
        pushups: hasPushups,
        sport: hasSport,
        nutrition: hasNutrition,
        water: hasWater,
        completion,
      });
    }

    setWeekData(weekDays);
  };

  const getDayName = (date: Date) => {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Wochenübersicht</Text>
      <View style={styles.ringsContainer}>
        {weekData.map((day, index) => (
          <ProgressRing
            key={index}
            progress={day.completion}
            day={getDayName(day.date)}
            colors={colors}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  ringPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
