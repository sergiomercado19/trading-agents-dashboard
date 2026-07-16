import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { BrowserRouter } from 'react-router-dom';

describe('ThemeProvider', () => {
  it('provides theme context to children', () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('modern')} data-testid="toggle">
            Toggle
          </button>
        </div>
      );
    }

    render(
      <BrowserRouter>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('terminal');
    vi.mocked(localStorage.getItem).mockReturnValue('modern');
    // Note: localStorage changes require re-render, which is tested in integration
  });

  it('persists theme to localStorage', () => {
    function TestComponent() {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('modern')} data-testid="toggle">
            Toggle
          </button>
        </div>
      );
    }

    render(
      <BrowserRouter>
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      </BrowserRouter>
    );

    const toggle = screen.getByTestId('toggle');
    toggle.click();
    expect(localStorage.setItem).toHaveBeenCalledWith('ta-theme', 'modern');
  });
});