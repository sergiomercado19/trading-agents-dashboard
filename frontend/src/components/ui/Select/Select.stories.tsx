import type { Meta, StoryObj } from '@storybook/react';
import { Select, Option } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
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
    fullWidth: { control: 'boolean' },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Select Option',
    placeholder: 'Choose...',
    children: (
      <>
        <Option value="option1">Option 1</Option>
        <Option value="option2">Option 2</Option>
        <Option value="option3">Option 3</Option>
      </>
    ),
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select country',
    children: (
      <>
        <Option value="us">United States</Option>
        <Option value="uk">United Kingdom</Option>
        <Option value="ca">Canada</Option>
        <Option value="au">Australia</Option>
      </>
    ),
  },
};

export const WithError: Story = {
  args: {
    label: 'Category',
    placeholder: 'Choose category',
    error: 'Please select a category',
    children: (
      <>
        <Option value="tech">Technology</Option>
        <Option value="finance">Finance</Option>
        <Option value="health">Health</Option>
      </>
    ),
  },
};

export const WithHint: Story = {
  args: {
    label: 'Priority',
    placeholder: 'Select priority',
    hint: 'Higher priority items are processed first',
    children: (
      <>
        <Option value="low">Low</Option>
        <Option value="medium">Medium</Option>
        <Option value="high">High</Option>
        <Option value="urgent">Urgent</Option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    placeholder: 'Cannot select',
    disabled: true,
    children: (
      <>
        <Option value="option1">Option 1</Option>
        <Option value="option2">Option 2</Option>
      </>
    ),
  },
};

export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'Select an option',
    required: true,
    children: (
      <>
        <Option value="yes">Yes</Option>
        <Option value="no">No</Option>
      </>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '350px' }}>
      <Select label="Default" placeholder="Choose...">
        <Option value="1">Option 1</Option>
        <Option value="2">Option 2</Option>
      </Select>
      <Select label="With Error" placeholder="Choose..." error="Error message">
        <Option value="1">Option 1</Option>
        <Option value="2">Option 2</Option>
      </Select>
      <Select label="Disabled" placeholder="Cannot select" disabled>
        <Option value="1">Option 1</Option>
        <Option value="2">Option 2</Option>
      </Select>
    </div>
  ),
};