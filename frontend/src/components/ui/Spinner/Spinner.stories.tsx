import type { Meta, StoryObj } from '@storybook/react';
import { Spinner, SpinnerOverlay } from './Spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A loading spinner component with multiple sizes and overlay variant.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Spinner size',
    },
    label: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Loading',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Loading',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Loading content...',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    label: 'Loading page...',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <Spinner size="sm" label="Small" />
      <Spinner size="md" label="Medium" />
      <Spinner size="lg" label="Large" />
      <Spinner size="xl" label="Extra Large" />
    </div>
  ),
};

export const Overlay: Story = {
  render: () => (
    <div style={{ position: 'relative', width: '300px', height: '200px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
      <SpinnerOverlay isVisible label="Loading content...">
        <div style={{ padding: '24px', color: 'var(--color-text-muted)' }}>
          Content that is being loaded...
        </div>
      </SpinnerOverlay>
    </div>
  ),
};

export const OverlayHidden: Story = {
  render: () => (
    <div style={{ position: 'relative', width: '300px', height: '200px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
      <SpinnerOverlay isVisible={false} label="Loading content...">
        <div style={{ padding: '24px', color: 'var(--color-text-muted)' }}>
          Content is visible now!
        </div>
      </SpinnerOverlay>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <div style={{ position: 'relative', height: '120px', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
        <SpinnerOverlay isVisible label="Loading card...">
          <div style={{ padding: '16px' }}>
            <h4>Card Title</h4>
            <p>Card content goes here...</p>
          </div>
        </SpinnerOverlay>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </div>
    </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Spinner size="sm" label="Saving" />
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Saving changes...</span>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Spinner size="md" label="Loading" />
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Loading data...</span>
      </div>
    </div>
  ),
};