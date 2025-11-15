import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

type TelemetryProps = {
  /**
   * When set to false, Speed Insights is skipped. By default the component
   * renders Speed Insights in production builds because metrics are only
   * reported for deployed environments.
   */
  enableSpeedInsights?: boolean;
};

export function Telemetry({ enableSpeedInsights = process.env.NODE_ENV === 'production' }: TelemetryProps) {
  if (process.env.NEXT_PUBLIC_DISABLE_TELEMETRY === 'true') {
    return null;
  }

  return (
    <>
      <Analytics />
      {enableSpeedInsights ? <SpeedInsights /> : null}
    </>
  );
}
