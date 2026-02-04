import { useState, useEffect } from 'react';

/**
 * Calculates the sun/moon position and color based on time of day.
 * The orb moves in an arc from left to right, mimicking the sun's path.
 *
 * Timeline:
 * - 5am: Dawn, far left, rising
 * - 12pm: Midday, center top (highest point)
 * - 7pm: Sunset, far right, setting
 * - 7pm-5am: Night, moon glow (stationary or subtle movement)
 */

interface SunPosition {
  // Position as percentage (0-100)
  x: number;
  y: number;
  // Colors for the orb
  color: string;
  glowColor: string;
  // Size multiplier (sun bigger at horizon due to atmosphere effect)
  scale: number;
  // Is it currently "day" (sun visible) or "night" (moon)
  isDay: boolean;
  // UI accent colors that complement the current light
  accent: string;
  accentHover: string;
  accentBg: string;
}

/**
 * Get the current hour as a decimal (e.g., 14.5 = 2:30 PM)
 */
function getCurrentHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

/**
 * Calculate sun position and appearance based on time
 */
function calculateSunPosition(hour: number): SunPosition {
  const DAWN = 5;      // 5am - sun starts rising
  const SUNSET = 19;   // 7pm - sun sets

  // Determine if it's daytime
  const isDay = hour >= DAWN && hour < SUNSET;

  if (isDay) {
    // Daytime: sun moves from left to right in an arc
    // Arc goes from bottom-left → top-center → bottom-right
    const dayLength = SUNSET - DAWN; // 14 hours
    const progress = (hour - DAWN) / dayLength; // 0 to 1

    // X position: 0% (far left) to 100% (far right)
    const x = progress * 100;

    // Y position: parabolic arc (highest at noon = lowest Y value)
    // At dawn/sunset: y = 95% (bottom), at noon: y = 8% (top)
    const normalizedProgress = progress * 2 - 1; // -1 to 1 (0 at noon)
    const arcHeight = normalizedProgress * normalizedProgress; // 0 at noon, 1 at edges
    const y = 8 + arcHeight * 87; // 8% at noon (top), 95% at edges (bottom)

    // Scale: larger at horizon (atmospheric effect)
    const scale = 1 + arcHeight * 0.4; // 1.0 at noon, 1.4 at horizon

    // Colors based on time of day
    let color: string;
    let glowColor: string;

    // Accent colors for UI elements - warm, natural tones
    let accent: string;
    let accentHover: string;
    let accentBg: string;

    if (hour < 7) {
      // Dawn (5-7am): warm orange/pink
      const t = (hour - DAWN) / 2;
      color = `hsl(${25 + t * 15}, 100%, ${60 + t * 10}%)`;
      glowColor = `hsla(${30 + t * 10}, 100%, 70%, 0.6)`;
      // Warm coral accent
      accent = '#f97316';
      accentHover = '#ea580c';
      accentBg = 'rgba(249, 115, 22, 0.2)';
    } else if (hour < 10) {
      // Morning (7-10am): golden yellow
      color = '#fef08a';
      glowColor = 'rgba(254, 240, 138, 0.5)';
      // Warm amber accent
      accent = '#f59e0b';
      accentHover = '#d97706';
      accentBg = 'rgba(245, 158, 11, 0.2)';
    } else if (hour < 15) {
      // Midday (10am-3pm): bright white/pale yellow
      color = '#fefce8';
      glowColor = 'rgba(254, 252, 232, 0.6)';
      // Soft golden accent
      accent = '#eab308';
      accentHover = '#ca8a04';
      accentBg = 'rgba(234, 179, 8, 0.2)';
    } else if (hour < 17) {
      // Afternoon (3-5pm): warm yellow
      color = '#fde047';
      glowColor = 'rgba(253, 224, 71, 0.5)';
      // Warm amber accent
      accent = '#f59e0b';
      accentHover = '#d97706';
      accentBg = 'rgba(245, 158, 11, 0.2)';
    } else {
      // Golden hour / Sunset (5-7pm): deep orange to red
      const t = (hour - 17) / 2;
      color = `hsl(${35 - t * 25}, 100%, ${65 - t * 15}%)`;
      glowColor = `hsla(${30 - t * 20}, 100%, 60%, 0.6)`;
      // Warm orange/coral accent
      accent = '#f97316';
      accentHover = '#ea580c';
      accentBg = 'rgba(249, 115, 22, 0.2)';
    }

    return { x, y, color, glowColor, scale, isDay, accent, accentHover, accentBg };
  } else {
    // Nighttime: moon rises from bottom-right, arcs across, sets bottom-left
    // Night is from 7pm (19) to 5am (29 = 5 + 24)
    const nightLength = 10; // 10 hours of night

    let nightProgress: number;
    if (hour >= SUNSET) {
      // Evening: 7pm to midnight (0-0.5 of night)
      nightProgress = (hour - SUNSET) / nightLength;
    } else {
      // Early morning: midnight to 5am (0.5-1 of night)
      nightProgress = (hour + 24 - SUNSET) / nightLength;
    }

    // X position: 100% (right) to 0% (left) - moon travels opposite to sun
    const x = 100 - nightProgress * 100;

    // Y position: parabolic arc, highest around midnight
    // At sunset/dawn: y = 95% (bottom), at midnight: y = 15% (higher than sun, more subtle)
    const normalizedProgress = nightProgress * 2 - 1; // -1 to 1 (0 at midnight)
    const arcHeight = normalizedProgress * normalizedProgress; // 0 at midnight, 1 at edges
    const y = 15 + arcHeight * 80; // 15% at midnight, 95% at edges

    // Moon colors: silvery blue
    const color = '#cbd5e1';
    const glowColor = 'rgba(148, 163, 184, 0.4)';

    // Cool, calm accent for night - soft slate blue
    const accent = '#64748b';
    const accentHover = '#475569';
    const accentBg = 'rgba(100, 116, 139, 0.2)';

    // Scale: slightly smaller moon, larger at horizon
    const scale = 0.7 + arcHeight * 0.3; // 0.7 at midnight, 1.0 at horizon

    return { x, y, color, glowColor, scale, isDay: false, accent, accentHover, accentBg };
  }
}

/**
 * Hook that provides the current sun/moon position and appearance.
 * Updates every minute.
 */
export function useSunPosition() {
  const [position, setPosition] = useState<SunPosition>(() =>
    calculateSunPosition(getCurrentHour())
  );

  useEffect(() => {
    // Update immediately
    setPosition(calculateSunPosition(getCurrentHour()));

    // Update every minute
    const interval = setInterval(() => {
      setPosition(calculateSunPosition(getCurrentHour()));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Return CSS variables for easy application
  const cssVariables = {
    '--sun-x': `${position.x}%`,
    '--sun-y': `${position.y}%`,
    '--sun-color': position.color,
    '--sun-glow': position.glowColor,
    '--sun-scale': position.scale.toString(),
    '--accent-primary': position.accent,
    '--accent-hover': position.accentHover,
    '--accent-bg': position.accentBg,
  } as React.CSSProperties;

  return {
    ...position,
    cssVariables,
  };
}
