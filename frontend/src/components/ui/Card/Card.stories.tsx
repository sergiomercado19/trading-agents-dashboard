import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  subcomponents: { CardHeader, CardBody, CardFooter },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible card component with header, body, and footer sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
      description: 'Visual variant',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Internal padding',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: '300px' }}>
      <CardHeader title="Card Title" subtitle="Card subtitle" />
      <CardBody>
        <p>This is the card body content. You can put any content here.</p>
      </CardBody>
      <CardFooter>
        <button className="btn btn-primary btn-sm">Action</button>
      </CardFooter>
    </Card>
  ),
};

export const Elevated: Story = {
  render: () => (
    <Card variant="elevated" style={{ width: '300px' }}>
      <CardHeader title="Elevated Card" />
      <CardBody>
        <p>This card uses the elevated variant with a shadow.</p>
      </CardBody>
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" style={{ width: '300px' }}>
      <CardHeader title="Outlined Card" />
      <CardBody>
        <p>This card uses the outlined variant with transparent background.</p>
      </CardBody>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card style={{ width: '300px' }}>
      <CardHeader
        title="Card with Action"
        action={<button className="btn btn-ghost btn-sm">More</button>}
      />
      <CardBody>
        <p>This card has an action button in the header.</p>
      </CardBody>
    </Card>
  ),
};

export const DifferentPadding: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Card padding="none" style={{ width: '300px' }}>
        <CardBody>No padding (padding="none")</CardBody>
      </Card>
      <Card padding="sm" style={{ width: '300px' }}>
        <CardBody>Small padding (padding="sm")</CardBody>
      </Card>
      <Card padding="md" style={{ width: '300px' }}>
        <CardBody>Medium padding (padding="md") - Default</CardBody>
      </Card>
      <Card padding="lg" style={{ width: '300px' }}>
        <CardBody>Large padding (padding="lg")</CardBody>
      </Card>
    </div>
  ),
};

export const FormCard: Story = {
  render: () => (
    <Card style={{ width: '350px' }}>
      <CardHeader title="Login" subtitle="Enter your credentials" />
      <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          Email
          <input type="email" className="input" placeholder="you@example.com" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          Password
          <input type="password" className="input" placeholder="••••••••" />
        </label>
      </CardBody>
      <CardFooter>
        <button className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
      </CardFooter>
    </Card>
  ),
};