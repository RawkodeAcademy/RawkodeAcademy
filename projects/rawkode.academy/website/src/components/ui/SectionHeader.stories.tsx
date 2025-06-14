import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/SectionHeader',
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    alignment: {
      control: 'select',
      options: ['left', 'center', 'right'],
    },
    titleLevel: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Section Title
          </h2>
        </div>
      `
    }} />
  ),
};

export const WithSubtitle: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <p class="text-lg font-medium text-primary mb-2">Our Services</p>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Professional Development Solutions
          </h2>
        </div>
      `
    }} />
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Why Choose Rawkode Academy
          </h2>
          <div class="mx-auto">
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              We provide comprehensive training and consulting services to help your team master modern development practices and cloud-native technologies.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const Complete: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <p class="text-lg font-medium text-primary mb-2">About Us</p>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Expert Cloud Native Training
          </h2>
          <div class="mx-auto">
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              Discover how our expert-led training programs can accelerate your team's cloud native journey with hands-on learning and real-world projects.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const LeftAligned: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-left">
          <p class="text-lg font-medium text-primary mb-2">Getting Started</p>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Begin Your Journey
          </h2>
          <div>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              Start with our foundational courses and work your way up to advanced cloud native architectures.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const RightAligned: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-right">
          <p class="text-lg font-medium text-primary mb-2">Contact</p>
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Ready to Get Started?
          </h2>
          <div>
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              Reach out to our team to discuss your training needs and create a custom learning plan.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const LargeTitle: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <p class="text-lg font-medium text-primary mb-2">Welcome</p>
          <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Rawkode Academy
          </h1>
          <div class="mx-auto">
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              Your premier destination for cloud native development training and professional consulting services.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const SmallTitle: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="mb-10 text-center">
          <h3 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-4xl">
            Quick Overview
          </h3>
          <div class="mx-auto">
            <p class="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
              A brief introduction to what you'll learn in this section.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};