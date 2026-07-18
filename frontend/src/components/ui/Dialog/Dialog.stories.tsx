import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from '../Button';

const { Root: DialogRoot, Trigger: DialogTrigger, Content: DialogContent, Close: DialogClose, Title: DialogTitle, Description: DialogDescription } = Dialog;

const meta = {
  title: 'UI/Dialog',
  component: DialogRoot as any,
  subcomponents: { DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A compound dialog component with focus trapping, keyboard navigation, and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modal: { control: 'boolean', description: 'Whether dialog is modal' },
    closeOnEscape: { control: 'boolean', description: 'Close on Escape key' },
    closeOnOverlayClick: { control: 'boolean', description: 'Close on overlay click' },
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<any>;

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>This is a description of the dialog content.</DialogDescription>
          <p style={{ marginTop: '16px' }}>This is a basic dialog with some content. You can put any content here including forms, lists, or other components.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsOpen(false)}>Confirm</Button>
          </div>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const WithForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open Form Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>Enter your credentials to access your account.</DialogDescription>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              Email
              <input type="email" className="input" placeholder="you@example.com" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              Password
              <input type="password" className="input" placeholder="••••••••" />
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsOpen(false)}>Sign In</Button>
            </div>
          </form>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const DangerAction: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button variant="danger" onClick={() => setIsOpen(true)}>Delete Item</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete Confirmation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogDescription>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setIsOpen(false)}>Delete</Button>
          </div>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const LargeContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open Large Dialog</Button>
        </DialogTrigger>
        <DialogContent style={{ maxWidth: '600px', maxHeight: '500px' }}>
          <DialogTitle>Large Dialog</DialogTitle>
          <DialogDescription>This dialog contains a lot of content and scrolls internally.</DialogDescription>
          <div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{ padding: '12px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <strong>Item {i + 1}</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  This is some content for item {i + 1}. You can put any content here.
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const NonModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)} modal={false}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open Non-Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Non-Modal Dialog</DialogTitle>
          <DialogDescription>This dialog allows interaction with the background.</DialogDescription>
          <p style={{ marginTop: '16px' }}>You can click outside to close, or press Escape.</p>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const ProgrammaticControl: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
        <Button variant="secondary" onClick={() => setIsOpen(false)}>Close Dialog</Button>
        <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <DialogContent>
            <DialogTitle>Programmatically Controlled</DialogTitle>
            <DialogDescription>This dialog is opened/closed via buttons outside the dialog.</DialogDescription>
          </DialogContent>
        </DialogRoot>
      </div>
    );
  },
};

export const AllComponents: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open Full Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Complete Dialog</DialogTitle>
          <DialogDescription>
            This dialog demonstrates all the compound components: Title, Description, Close button, and custom content.
          </DialogDescription>
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-elevated)', borderRadius: '6px' }}>
            <p><strong>Dialog.Title</strong> - The accessible dialog title</p>
            <p><strong>Dialog.Description</strong> - Additional context</p>
            <p><strong>Dialog.Close</strong> - Close button with X icon</p>
            <p><strong>Dialog.Content</strong> - The main content wrapper</p>
          </div>
        </DialogContent>
      </DialogRoot>
    );
  },
};

export const WithCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <DialogRoot isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTrigger>
          <Button onClick={() => setIsOpen(true)}>Open with Close Button</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog with Close Button</DialogTitle>
          <DialogDescription>
            This dialog has an explicit close button in the top right corner.
          </DialogDescription>
          <p style={{ marginTop: '16px' }}>You can close this dialog by clicking the X button, pressing Escape, or clicking the overlay.</p>
        </DialogContent>
      </DialogRoot>
    );
  },
};