import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getWeightEntries } from '../services/database';
import { WeightEntry } from '../types';
import GlassCard from './GlassCard';

const GRAPH_HEIGHT = 120;
const POINT_RADIUS = 4;
const MAX_AXIS_TICKS = 6;
const AXIS_LABEL_WIDTH = 48;

const formatDateLabel = (date: Date) => date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

interface WeightGraphProps {
  onPress: () => void;
}

export default function WeightGraph({ onPress }: WeightGraphProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const graphWidth = Math.max(width - 80, 260);
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    const data = await getWeightEntries(user.uid);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Fill all 30 days, marking missing days
    const allDays: (WeightEntry & { isMissing?: boolean })[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const existingEntry = data.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      if (existingEntry) {
        allDays.push(existingEntry);
      } else {
        // Mark missing days
        allDays.push({
          id: `missing-${i}`,
          userId: user.uid,
          weight: allDays.length > 0 ? allDays[allDays.length - 1].weight : 0,
          date: date.toISOString(),
          isMissing: true
        });
      }
    }

    setEntries(allDays);
  };

  if (!entries.length) {
    return (
      <GlassCard style={styles.container}>
        <TouchableOpacity onPress={onPress} style={styles.emptyContainer} activeOpacity={0.8}>
          <MaterialCommunityIcons name="scale-bathroom" size={36} color={colors.textSecondary} />
          <View style={styles.emptyCopy}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Gewicht</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Tippen, um Gewicht zu erfassen</Text>
          </View>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  const weights = entries.map(entry => entry.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  const bodyFats = entries.filter(entry => entry.bodyFat !== undefined).map(entry => entry.bodyFat!);
  const hasBodyFat = bodyFats.length > 0;
  const minBodyFat = hasBodyFat ? Math.min(...bodyFats) : 0;
  const maxBodyFat = hasBodyFat ? Math.max(...bodyFats) : 0;
  const bodyFatRange = maxBodyFat - minBodyFat || 1;

  const axisLabelInterval = Math.max(1, Math.ceil(entries.length / MAX_AXIS_TICKS));

  const getXPosition = (index: number) => {
    if (entries.length <= 1) {
      return graphWidth / 2;
    }
    return (index / (entries.length - 1)) * graphWidth;
  };

  const weightPoints = entries.map((entry, index) => {
    const x = getXPosition(index);
    const y = GRAPH_HEIGHT - ((entry.weight - minWeight) / weightRange) * GRAPH_HEIGHT;
    return { x, y, weight: entry.weight, bodyFat: entry.bodyFat };
  });

  let lastKnownBodyFat = entries.find(entry => entry.bodyFat !== undefined)?.bodyFat;
  const bodyFatPoints = hasBodyFat
    ? entries.map((entry, index) => {
        const x = getXPosition(index);
        const bodyFat = entry.bodyFat !== undefined ? entry.bodyFat : lastKnownBodyFat;
        if (entry.bodyFat !== undefined) {
          lastKnownBodyFat = entry.bodyFat;
        }
        const y = GRAPH_HEIGHT - ((bodyFat! - minBodyFat) / bodyFatRange) * GRAPH_HEIGHT;
        return { x, y, bodyFat };
      })
    : [];

  const currentWeight = entries[entries.length - 1].weight;
  const currentBodyFat = lastKnownBodyFat;
  const weightChange = entries.length > 1 ? currentWeight - entries[0].weight : 0;

  return (
    <GlassCard style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="scale-bathroom" size={28} color="#A29BFE" />
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Gewicht</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {currentWeight.toFixed(1)} kg
                {weightChange !== 0 && (
                  <Text style={{ color: weightChange < 0 ? '#00D084' : '#FF6B6B' }}>
                    {' '}({weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg)
                  </Text>
                )}
              </Text>
            </View>
          </View>
          {currentBodyFat !== undefined && currentBodyFat !== null && (
            <View style={styles.bodyFatBadge}>
              <Text style={[styles.bodyFatText, { color: colors.text }]}>
                {currentBodyFat.toFixed(1)} % KFA
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.graphContainer, { height: GRAPH_HEIGHT + 20 }]}>
          <View style={[styles.graph, { width: graphWidth }]}>
            {weightPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = weightPoints[index - 1];
              const currentEntry = entries[index];
              const prevEntry = entries[index - 1];
              const isMissingSegment = currentEntry.isMissing || prevEntry.isMissing;
              const length = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);
              return (
                <View
                  key={`weight-line-${index}`}
                  style={[
                    styles.line,
                    {
                      backgroundColor: isMissingSegment ? '#999' : '#A29BFE',
                      width: length,
                      left: prevPoint.x,
                      top: prevPoint.y,
                      transform: [{ rotate: `${angle}deg` }],
                      opacity: isMissingSegment ? 0.3 : 1,
                    },
                  ]}
                />
              );
            })}

            {hasBodyFat && bodyFatPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = bodyFatPoints[index - 1];
              const length = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);
              return (
                <View
                  key={`bodyfat-line-${index}`}
                  style={[
                    styles.line,
                    {
                      backgroundColor: '#F9CA24',
                      width: length,
                      left: prevPoint.x,
                      top: prevPoint.y,
                      transform: [{ rotate: `${angle}deg` }],
                      opacity: 0.65,
                    },
                  ]}
                />
              );
            })}

            {weightPoints.map((point, index) => {
              const entry = entries[index];
              const isMissing = entry.isMissing;
              return (
                <View
                  key={`weight-point-${index}`}
                  style={[
                    styles.point,
                    {
                      backgroundColor: isMissing ? '#999' : '#A29BFE',
                      left: point.x - POINT_RADIUS,
                      top: point.y - POINT_RADIUS,
                      opacity: isMissing ? 0.3 : 1,
                    },
                  ]}
                />
              );
            })}

            {hasBodyFat && bodyFatPoints.map((point, index) => (
              <View
                key={`bodyfat-point-${index}`}
                style={[
                  styles.point,
                  {
                    backgroundColor: '#F9CA24',
                    left: point.x - POINT_RADIUS,
                    top: point.y - POINT_RADIUS,
                    opacity: 0.65,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.axisContainer, { width: graphWidth }]}>
          {entries.map((entry, index) => {
            const x = getXPosition(index);
            const showLabel = index === 0 || index === entries.length - 1 || index % axisLabelInterval === 0;
            return (
              <View key={`axis-${entry.id ?? index}`} style={[styles.axisTick, { left: x - AXIS_LABEL_WIDTH / 2 }] }>
                <View style={[styles.axisLine, { backgroundColor: colors.border }]} />
                {showLabel && (
                  <Text style={[styles.axisLabelText, { color: colors.textSecondary }]}> 
                    {formatDateLabel(new Date(entry.date))}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#A29BFE' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Gewicht</Text>
          </View>
          {hasBodyFat && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F9CA24', opacity: 0.7 }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Körperfett</Text>
            </View>
          )}
        </View>

        <Text style={[styles.hint, { color: colors.textSecondary }]}>Tippen für Details (30 Tage)</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyCopy: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  bodyFatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 202, 36, 0.2)',
  },
  bodyFatText: {
    fontSize: 12,
    fontWeight: '600',
  },
  graphContainer: {
    marginVertical: 12,
    paddingHorizontal: 10,
  },
  graph: {
    position: 'relative',
    height: GRAPH_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: POINT_RADIUS * 2,
    height: POINT_RADIUS * 2,
    borderRadius: POINT_RADIUS,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  axisContainer: {
    position: 'relative',
    height: 32,
    marginTop: 8,
  },
  axisTick: {
    position: 'absolute',
    bottom: 0,
    width: AXIS_LABEL_WIDTH,
    alignItems: 'center',
  },
  axisLine: {
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  axisLabelText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
