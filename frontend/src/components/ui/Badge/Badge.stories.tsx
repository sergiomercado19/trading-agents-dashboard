import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'success', 'warning', 'error', 'neutral'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Badge size',
    },
    dot: {
      control: 'boolean',
      description: 'Show indicator dot',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

export const Accent: Story = {
  args: {
    children: 'Accent',
    variant: 'accent',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};

export const Neutral: Story = {
  args: {
    children: 'Neutral',
    variant: 'neutral',
  },
};

export const WithDot: Story = {
  args: {
    children: 'Online',
    variant: 'success',
    dot: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="neutral">Neutral</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <Badge size="sm" variant="accent">Small</Badge>
      <Badge size="md" variant="accent">Medium</Badge>
    </div>
  ),
};

export const WithDots: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <Badge variant="success" dot>Online</Badge>
      <Badge variant="warning" dot>Busy</Badge>
      <Badge variant="error" dot>Offline</Badge>
      <Badge variant="accent" dot>Active</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      <Badge variant="success" dot>Completed</Badge>
      <Badge variant="warning" dot>Pending</Badge>
      <Badge variant="error" dot>Failed</Badge>
      <Badge variant="accent" dot>Processing</Badge>
      <Badge variant="neutral" dot>Idle</Badge>
    </div>
  ),
};