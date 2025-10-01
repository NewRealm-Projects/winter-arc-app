import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Loading Skeleton Component
 *
 * Displays an animated placeholder while content is loading
 *
 * @example
 * <LoadingSkeleton width="100%" height={20} borderRadius={8} />
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            opacity,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

/**
 * Card Skeleton - For loading cards with multiple elements
 */
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <LoadingSkeleton width={50} height={50} borderRadius={25} />
        <View style={styles.cardHeaderText}>
          <LoadingSkeleton width="60%" height={20} />
          <LoadingSkeleton width="40%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
      <LoadingSkeleton width="100%" height={100} style={{ marginTop: 16 }} />
      <View style={styles.cardFooter}>
        <LoadingSkeleton width="30%" height={16} />
        <LoadingSkeleton width="30%" height={16} />
      </View>
    </View>
  );
};

/**
 * List Item Skeleton - For loading list entries
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <LoadingSkeleton width="30%" height={16} />
      <LoadingSkeleton width="20%" height={16} />
    </View>
  );
};

/**
 * Graph Skeleton - For loading weight graph
 */
export const GraphSkeleton: React.FC = () => {
  return (
    <View style={styles.graphContainer}>
      <View style={styles.graphHeader}>
        <LoadingSkeleton width={40} height={40} borderRadius={20} />
        <View style={styles.graphHeaderText}>
          <LoadingSkeleton width={120} height={20} />
          <LoadingSkeleton width={80} height={16} style={{ marginTop: 4 }} />
        </View>
      </View>
      <LoadingSkeleton width="100%" height={120} style={{ marginTop: 16 }} />
      <View style={styles.graphLegend}>
        <LoadingSkeleton width={80} height={12} />
        <LoadingSkeleton width={80} height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
  },
  cardContainer: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  graphContainer: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  graphHeaderText: {
    marginLeft: 12,
  },
  graphLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
});

export default LoadingSkeleton;
