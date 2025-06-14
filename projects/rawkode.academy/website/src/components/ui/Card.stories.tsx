import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/Card',
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hoverable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Default Card</h3>
            <p class="text-gray-600 dark:text-gray-300">This is a basic card component with default styling and medium padding.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const Elevated: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 shadow-[--shadow-card] p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Elevated Card</h3>
            <p class="text-gray-600 dark:text-gray-300">This card has an elevated appearance with shadow styling for emphasis.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const Outlined: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-transparent border-2 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Outlined Card</h3>
            <p class="text-gray-600 dark:text-gray-300">This card uses a transparent background with a prominent border.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const Hoverable: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 hover:border-primary/30 dark:hover:border-primary/30 hover:-translate-y-1 cursor-pointer">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hoverable Card</h3>
            <p class="text-gray-600 dark:text-gray-300">This card responds to hover with elevation and subtle animation effects.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const SmallPadding: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Small Padding</h3>
            <p class="text-gray-600 dark:text-gray-300">This card uses small padding for compact layouts.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const LargePadding: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Large Padding</h3>
            <p class="text-gray-600 dark:text-gray-300">This card uses large padding for spacious, prominent content areas.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const NoPadding: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800">
            <img src="https://picsum.photos/400/200" alt="Example" class="w-full h-32 object-cover rounded-t-[--radius-card]" />
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Padding Card</h3>
              <p class="text-gray-600 dark:text-gray-300">This card has no default padding, useful for images or custom content.</p>
            </div>
          </div>
        </div>
      `
    }} />
  ),
};

export const WithAction: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-md">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="bg-primary/10 text-primary p-3 rounded-full">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
                </svg>
              </div>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01"></path>
                </svg>
              </button>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Card with Actions</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-4">This card includes an icon and action button in the header.</p>
            <div class="flex gap-3">
              <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-sm gap-2">
                Learn More
              </button>
              <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] text-gray-600 hover:text-primary hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 px-4 py-2 text-sm gap-2">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      `
    }} />
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-3 gap-6 max-w-4xl">
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 hover:border-primary/30 dark:hover:border-primary/30 hover:-translate-y-1 cursor-pointer">
            <div class="bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Development</h3>
            <p class="text-gray-600 dark:text-gray-300">Expert development services for your projects.</p>
          </div>
          
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 hover:border-primary/30 dark:hover:border-primary/30 hover:-translate-y-1 cursor-pointer">
            <div class="bg-secondary/10 text-secondary p-3 rounded-full w-fit mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Consulting</h3>
            <p class="text-gray-600 dark:text-gray-300">Strategic guidance for your technical decisions.</p>
          </div>
          
          <div class="rounded-[--radius-card] border border-gray-100 dark:border-gray-700 transition-all duration-[--duration-base] bg-white dark:bg-gray-800 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 hover:border-primary/30 dark:hover:border-primary/30 hover:-translate-y-1 cursor-pointer">
            <div class="bg-tertiary/10 text-tertiary p-3 rounded-full w-fit mb-4">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Training</h3>
            <p class="text-gray-600 dark:text-gray-300">Comprehensive training programs for your team.</p>
          </div>
        </div>
      `
    }} />
  ),
};