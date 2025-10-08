import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeatherCard from '../WeatherCard';

vi.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('WeatherCard', () => {
  it('renders loading skeleton state', () => {
    render(<WeatherCard tempC={0} condition="sunny" loading />);

    expect(screen.getByTestId('weather-card-skeleton')).toBeInTheDocument();
  });

  it('shows weather details when data is available', () => {
    render(<WeatherCard tempC={12} condition="cloudy" location="Berlin" />);

    expect(screen.getByText('12°C')).toBeInTheDocument();
    expect(screen.getByText('weather.cloudy')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByTestId('weather-card')).toBeInTheDocument();
  });
});
