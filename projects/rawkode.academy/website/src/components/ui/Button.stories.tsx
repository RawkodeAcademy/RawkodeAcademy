import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/Button',
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
          Primary Button
        </button>
      `
    }} />
  ),
};

export const Secondary: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
          Secondary Button
        </button>
      `
    }} />
  ),
};

export const Outline: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white px-4 py-2 text-base gap-2">
          Outline Button
        </button>
      `
    }} />
  ),
};

export const Ghost: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-primary hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 px-4 py-2 text-base gap-2">
          Ghost Button
        </button>
      `
    }} />
  ),
};

export const SmallSize: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-3 py-1.5 text-sm gap-1.5">
          Small Button
        </button>
      `
    }} />
  ),
};

export const LargeSize: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
          Large Button
        </button>
      `
    }} />
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14"></path>
          </svg>
          Add Item
        </button>
      `
    }} />
  ),
};

export const AsLink: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
          Link Button
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      `
    }} />
  ),
};

export const Disabled: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <button disabled class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
          Disabled Button
        </button>
      `
    }} />
  ),
};

export const ButtonGroup: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="flex flex-wrap gap-3">
          <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-4 py-2 text-base gap-2">
            Save
          </button>
          <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white px-4 py-2 text-base gap-2">
            Cancel
          </button>
          <button class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-primary hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 px-4 py-2 text-base gap-2">
            More Options
          </button>
        </div>
      `
    }} />
  ),
};