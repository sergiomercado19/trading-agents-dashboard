import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'oklch(0.13 0.005 260)' },
        { name: 'light', value: '#ffffff' },
        { name: 'bloomberg', value: 'oklch(0.08 0.01 40)' },
      ],
    },
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'terminal',
toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: [
        { value: 'terminal', title: 'Terminal' },
        { value: 'modern', title: 'Modern' },
        { value: 'bloomberg', title: 'Bloomberg' },
      ],
      dynamicTitle: true,
    },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'terminal';
      return (
        <div data-theme={theme} style={{ minHeight: '100vh' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;