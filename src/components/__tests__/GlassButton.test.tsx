import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GlassButton from '../GlassButton';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Wrapper for theme context
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('GlassButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = renderWithTheme(
      <GlassButton title="Test Button" onPress={() => {}} color="#FF375F" />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = renderWithTheme(
      <GlassButton title="Click Me" onPress={onPress} color="#FF375F" />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with custom color', () => {
    const { getByText } = renderWithTheme(
      <GlassButton title="Colored" onPress={() => {}} color="#FF6B6B" />
    );
    expect(getByText('Colored')).toBeTruthy();
  });
});
