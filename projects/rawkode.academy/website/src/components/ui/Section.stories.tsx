import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/Section',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'highlight', 'accent', 'muted'],
    },
    spacing: {
      control: 'select', 
      options: ['sm', 'md', 'lg', 'xl'],
    },
    container: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-7xl py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Default Section</h2>
            <p class="text-gray-600 dark:text-gray-300">This is a default section with standard styling and spacing.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const Highlight: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <div class="mx-auto max-w-7xl py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Highlight Section</h2>
            <p class="text-gray-600 dark:text-gray-300">This section has a subtle gradient background to draw attention.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const Accent: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-gray-50 dark:bg-gray-800">
          <div class="mx-auto max-w-7xl py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Accent Section</h2>
            <p class="text-gray-600 dark:text-gray-300">This section uses an accent background color for visual separation.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const SmallSpacing: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-7xl py-8 px-4 lg:py-12 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Small Spacing</h2>
            <p class="text-gray-600 dark:text-gray-300">This section demonstrates small vertical spacing.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-7xl py-20 px-4 lg:py-24 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Large Spacing</h2>
            <p class="text-gray-600 dark:text-gray-300">This section demonstrates large vertical spacing for important content.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const SmallContainer: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-3xl py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Small Container</h2>
            <p class="text-gray-600 dark:text-gray-300">This section uses a smaller max-width container for focused content like articles or forms.</p>
          </div>
        </section>
      `
    }} />
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-900">
          <div class="mx-auto max-w-none py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Full Width</h2>
            <p class="text-gray-600 dark:text-gray-300">This section spans the full width without container constraints.</p>
          </div>
        </section>
      `
    }} />
  ),
};