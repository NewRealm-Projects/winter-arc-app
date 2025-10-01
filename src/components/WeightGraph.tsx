import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getWeightEntries } from '../services/database';
import { WeightEntry } from '../types';
import GlassCard from './GlassCard';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 80; // Account for card padding
const GRAPH_HEIGHT = 120;
const POINT_RADIUS = 4;

interface WeightGraphProps {
  onPress: () => void;
}

export default function WeightGraph({ onPress }: WeightGraphProps) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [entries, setEntries] = useState<WeightEntry[]>([]);

  useEffect(() => {
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;

    const data = await getWeightEntries(user.uid);
    // Get last 14 days for mini graph
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentData = data.filter(e => new Date(e.date) >= fourteenDaysAgo);
    setEntries(recentData.reverse()); // Oldest first for graph
  };

  if (entries.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <TouchableOpacity onPress={onPress} style={styles.emptyContainer}>
          <Text style={styles.cardEmoji}>⚖️</Text>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Gewicht</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Tippen um Gewicht zu tracken
            </Text>
          </View>
        </TouchableOpacity>
      </GlassCard>
    );
  }

  // Calculate min/max for weight
  const weights = entries.map(e => e.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  // Calculate min/max for body fat (if available)
  const bodyFats = entries.filter(e => e.bodyFat !== undefined).map(e => e.bodyFat!);
  const hasBodyFat = bodyFats.length > 0;
  const minBodyFat = hasBodyFat ? Math.min(...bodyFats) : 0;
  const maxBodyFat = hasBodyFat ? Math.max(...bodyFats) : 0;
  const bodyFatRange = maxBodyFat - minBodyFat || 1;

  const getXPosition = (index: number) => {
    if (entries.length <= 1) {
      return GRAPH_WIDTH / 2;
    }
    return (index / (entries.length - 1)) * GRAPH_WIDTH;
  };

  // Calculate points for weight line
  const weightPoints = entries.map((entry, index) => {
    const x = getXPosition(index);
    const y = GRAPH_HEIGHT - ((entry.weight - minWeight) / weightRange) * GRAPH_HEIGHT;
    return { x, y, weight: entry.weight, bodyFat: entry.bodyFat };
  });

  // Calculate points for body fat line (with last known value logic)
  let lastKnownBodyFat = entries.find(e => e.bodyFat !== undefined)?.bodyFat;
  const bodyFatPoints = hasBodyFat ? entries.map((entry, index) => {
    const x = getXPosition(index);
    const bodyFat = entry.bodyFat !== undefined ? entry.bodyFat : lastKnownBodyFat;
    if (entry.bodyFat !== undefined) lastKnownBodyFat = entry.bodyFat;
    const y = GRAPH_HEIGHT - ((bodyFat! - minBodyFat) / bodyFatRange) * GRAPH_HEIGHT;
    return { x, y, bodyFat };
  }) : [];

  const currentWeight = entries[entries.length - 1].weight;
  const currentBodyFat = lastKnownBodyFat;
  const weightChange = entries.length > 1 ? currentWeight - entries[0].weight : 0;

  return (
    <GlassCard style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.cardEmoji}>⚖️</Text>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Gewicht</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {currentWeight.toFixed(1)}kg
                {weightChange !== 0 && (
                  <Text style={{ color: weightChange < 0 ? '#00D084' : '#FF6B6B' }}>
                    {' '}({weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg)
                  </Text>
                )}
              </Text>
            </View>
          </View>
          {currentBodyFat && (
            <View style={styles.bodyFatBadge}>
              <Text style={[styles.bodyFatText, { color: colors.text }]}>
                {currentBodyFat.toFixed(1)}% KFA
              </Text>
            </View>
          )}
        </View>

        {/* Graph */}
        <View style={[styles.graphContainer, { height: GRAPH_HEIGHT + 20 }]}>
          <View style={styles.graph}>
            {/* Weight Line */}
            {weightPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = weightPoints[index - 1];
              const length = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
              );
              const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);
              return (
                <View
                  key={`weight-line-${index}`}
                  style={[
                    styles.line,
                    {
                      backgroundColor: '#A29BFE',
                      width: length,
                      left: prevPoint.x,
                      top: prevPoint.y,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}

            {/* Body Fat Line (if available) */}
            {hasBodyFat && bodyFatPoints.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = bodyFatPoints[index - 1];
              const length = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
              );
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
                      opacity: 0.7,
                    },
                  ]}
                />
              );
            })}

            {/* Weight Points */}
            {weightPoints.map((point, index) => (
              <View
                key={`weight-point-${index}`}
                style={[
                  styles.point,
                  {
                    backgroundColor: '#A29BFE',
                    left: point.x - POINT_RADIUS,
                    top: point.y - POINT_RADIUS,
                  },
                ]}
              />
            ))}

            {/* Body Fat Points (if available) */}
            {hasBodyFat && bodyFatPoints.map((point, index) => (
              <View
                key={`bodyfat-point-${index}`}
                style={[
                  styles.point,
                  {
                    backgroundColor: '#F9CA24',
                    left: point.x - POINT_RADIUS,
                    top: point.y - POINT_RADIUS,
                    opacity: 0.7,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Legend */}
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

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tippen für Details (30 Tage)
        </Text>
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
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 12,
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
    width: GRAPH_WIDTH,
    height: GRAPH_HEIGHT,
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
    borderColor: 'white',
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



