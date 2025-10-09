import packageJson from '../../package.json';

/**
 * SystemIndicator Component
 *
 * Displays the current app version and environment in the bottom-right corner.
 *
 * Environment colors:
 * - PRODUCTION: Green (rgba(0, 200, 0, 0.6))
 * - STAGING: Orange (rgba(255, 180, 0, 0.7))
 * - PREVIEW: Red (rgba(255, 0, 0, 0.6))
 * - LOCAL: Gray (rgba(100, 100, 100, 0.5))
 */
export default function SystemIndicator() {
  const env = import.meta.env.VITE_APP_ENV || 'local';
  const version = packageJson.version || '0.0.0';

  // Determine environment display name
  const envDisplay = env === 'production'
    ? 'PROD'
    : env === 'staging'
    ? 'TEST'
    : env === 'preview'
    ? 'PREVIEW'
    : 'LOCAL';

  // Determine background color based on environment
  const backgroundColor =
    env === 'production'
      ? 'rgba(0, 200, 0, 0.6)'
      : env === 'staging'
      ? 'rgba(255, 180, 0, 0.7)'
      : env === 'preview'
      ? 'rgba(255, 0, 0, 0.6)'
      : 'rgba(100, 100, 100, 0.5)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: backgroundColor,
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'white',
        fontWeight: 600,
        letterSpacing: '0.5px',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        fontFamily: 'monospace',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
      aria-label={`App version ${version}, environment ${envDisplay}`}
    >
      v{version} – {envDisplay}
    </div>
  );
}
