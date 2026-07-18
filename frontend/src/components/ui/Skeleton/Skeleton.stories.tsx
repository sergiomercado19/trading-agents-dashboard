import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonCard } from './Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  subcomponents: { SkeletonCard },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A skeleton loading placeholder component with multiple variants and animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
      description: 'Shape variant',
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'none'],
      description: 'Animation type',
    },
    width: { control: 'text' },
    height: { control: 'text' },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: '200px',
    height: '16px',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: '48px',
    height: '48px',
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: '300px',
    height: '100px',
  },
};

export const TextMultipleLines: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="70%" height="16px" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Text</label>
        <Skeleton variant="text" width="200px" height="16px" />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Circular</label>
        <Skeleton variant="circular" width="48px" height="48px" />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Rectangular</label>
        <Skeleton variant="rectangular" width="300px" height="80px" />
      </div>
    </div>
  ),
};

export const AllAnimations: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Pulse</label>
        <Skeleton variant="text" width="200px" height="16px" animation="pulse" />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Wave</label>
        <Skeleton variant="text" width="200px" height="16px" animation="wave" />
      </div>
      <div>
        <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>None</label>
        <Skeleton variant="text" width="200px" height="16px" animation="none" />
      </div>
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div style={{ width: '350px' }}>
      <SkeletonCard lines={3} showAvatar showAction />
    </div>
  ),
};

export const CardSkeletonNoAvatar: Story = {
  render: () => (
    <div style={{ width: '350px' }}>
      <SkeletonCard lines={2} showAvatar={false} showAction />
    </div>
  ),
};

export const CardSkeletonWithAction: Story = {
  render: () => (
    <div style={{ width: '350px' }}>
      <SkeletonCard lines={4} showAvatar showAction />
    </div>
  ),
};

export const CardList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SkeletonCard lines={2} showAvatar showAction />
      <SkeletonCard lines={3} showAvatar showAction={false} />
      <SkeletonCard lines={1} showAvatar={false} showAction />
    </div>
  ),
};

export const FormSkeleton: Story = {
  render: () => (
    <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Skeleton variant="text" width="40%" height="16px" />
      <Skeleton variant="text" width="100%" height="40px" />
      <Skeleton variant="text" width="100%" height="40px" />
      <Skeleton variant="rectangular" width="100%" height="40px" />
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton variant="text" width="60%" height="14px" />
      <Skeleton variant="text" width="80%" height="14px" />
      <Skeleton variant="text" width="50%" height="14px" />
      <Skeleton variant="text" width="70%" height="14px" />
    </div>
  ),
};