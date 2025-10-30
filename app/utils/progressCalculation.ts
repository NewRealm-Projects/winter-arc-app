import type { CarouselStat } from '../hooks/useCarouselStats';

/**
 * Calculate what percentage of the progress circle this stat occupies
 * Each stat contributes 0-20% to the full circle (5 stats total = 100%)
 * Formula: (stat.progress / 100) * 20, clamped to [0, 20]
 */
export function calculateStatProgress(stat: CarouselStat): number {
  const maxContribution = 20; // Each stat can contribute up to 20% (360° / 5 stats)
  const contribution = (stat.progress / 100) * maxContribution;
  return Math.min(Math.max(contribution, 0), maxContribution);
}

/**
 * Calculate total progress across all stats
 * Returns 0-100 (100 = all stats at 100%)
 */
export function calculateTotalProgress(stats: CarouselStat[]): number {
  const total = stats.reduce((sum, stat) => sum + calculateStatProgress(stat), 0);
  return Math.min(total, 100);
}

/**
 * Convert progress (0-100) to SVG arc angle (0-360°)
 * Used for drawing progress circle bands
 */
export function progressToAngle(progress: number): number {
  return (progress / 100) * 360;
}

/**
 * Convert SVG arc angle to progress (0-100)
 * Inverse of progressToAngle
 */
export function angleToProgress(angle: number): number {
  return (angle / 360) * 100;
}

/**
 * Calculate the start and end angles for a stat's progress band
 * Given the stat's position (0-4) and its progress (0-100)
 * Returns { startAngle, endAngle } in degrees
 *
 * Example: Sport is stat 0, hydration is stat 2
 * If sport has 50% progress:
 *   - startAngle: 0° (beginning of circle)
 *   - endAngle: 36° (50% of 72°, since 360° / 5 stats = 72° per stat)
 */
export function calculateBandAngles(
  statIndex: number,
  progress: number,
  totalStats: number = 5
): { startAngle: number; endAngle: number } {
  const anglePerStat = 360 / totalStats;
  const baseDegrees = statIndex * anglePerStat;
  const progressDegrees = (progress / 100) * anglePerStat;

  return {
    startAngle: baseDegrees,
    endAngle: baseDegrees + progressDegrees,
  };
}

/**
 * Calculate SVG arc path for a progress band
 * Used for rendering the progress circle visualization
 *
 * @param centerX - Center X coordinate
 * @param centerY - Center Y coordinate
 * @param radius - Circle radius
 * @param startAngle - Start angle in degrees (0-360)
 * @param endAngle - End angle in degrees (0-360)
 * @returns SVG path string for arc
 */
export function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert degrees to radians, subtract 90 to start from top
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  // Calculate start and end points
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  // Large arc flag: set to 1 if angle > 180°
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  // Create SVG arc path
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

/**
 * Convert cartesian coordinates to polar (for positioning icons on circle)
 * @param angle - Angle in degrees (0-360)
 * @param distance - Distance from center
 * @returns { x, y } coordinates
 */
export function polarToCartesian(
  angle: number,
  distance: number
): { x: number; y: number } {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: distance * Math.cos(radians),
    y: distance * Math.sin(radians),
  };
}

/**
 * Calculate center position of a stat's band (for label/icon positioning)
 * @param statIndex - Stat position (0-4)
 * @param radius - Distance from circle center
 * @param totalStats - Total number of stats (default 5)
 * @returns { x, y, angle } for positioning elements
 */
export function getStatBandCenter(
  statIndex: number,
  radius: number,
  totalStats: number = 5
): { x: number; y: number; angle: number } {
  const anglePerStat = 360 / totalStats;
  const angle = (statIndex * anglePerStat) + (anglePerStat / 2);
  const { x, y } = polarToCartesian(angle, radius);
  return { x, y, angle };
}

