import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    hint: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'date', 'search'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'John Doe',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter email',
    error: 'Please enter a valid email address',
    value: 'invalid-email',
  },
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
    hint: 'Must be at least 8 characters',
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    value: 'Pre-filled value',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search...',
    leftIcon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
      </svg>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '350px' }}>
      <Input label="Default" placeholder="Type here..." />
      <Input label="With Hint" placeholder="Type here..." hint="This is a helpful hint" />
      <Input label="With Error" placeholder="Type here..." error="This field has an error" />
      <Input label="Disabled" placeholder="Cannot edit" disabled />
      <Input label="Required" placeholder="Required field" required />
    </div>
  ),
};