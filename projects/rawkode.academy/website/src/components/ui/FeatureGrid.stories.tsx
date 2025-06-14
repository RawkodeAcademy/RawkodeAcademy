import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/FeatureGrid',
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    columns: {
      control: 'select',
      options: [2, 3, 4],
    },
    iconColor: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],
    },
    variant: {
      control: 'select',
      options: ['cards', 'minimal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Development
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Expert development services using modern technologies and best practices.
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Consulting
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Strategic guidance and architectural consulting for your projects.
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Training
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Comprehensive training programs for individuals and teams.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const TwoColumns: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-secondary/10 text-secondary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M5 12V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 12h14"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Cloud Infrastructure
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Design and implement scalable cloud infrastructure solutions.
            </p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-secondary/10 text-secondary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 8c0 3.31-2.69 6-6 6H8c-3.31 0-6-2.69-6-6s2.69-6 6-6h6c3.31 0 6 2.69 6 6zM6 12h.01M10 12h.01"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              DevOps Practices
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Implement modern DevOps practices and CI/CD pipelines.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const FourColumns: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Kubernetes</h3>
            <p class="text-gray-600 dark:text-gray-300">Container orchestration expertise.</p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-secondary/10 text-secondary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Cloud Native</h3>
            <p class="text-gray-600 dark:text-gray-300">Modern cloud development.</p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-tertiary/10 text-tertiary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 12 21c0-2.319-.205-4.564-.582-6.816a11.955 11.955 0 0 1-8.618-3.04A12.02 12.02 0 0 0 12 21c2.972 0 5.691-1.081 7.8-2.87-.43.692-.943 1.339-1.526 1.926z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Security</h3>
            <p class="text-gray-600 dark:text-gray-300">Security best practices.</p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
            <div class="bg-quaternary/10 text-quaternary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Performance</h3>
            <p class="text-gray-600 dark:text-gray-300">Optimization strategies.</p>
          </div>
        </div>
      `
    }} />
  ),
};

export const MinimalVariant: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-3 gap-6">
          <div class="p-4">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Fast Delivery
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Quick turnaround times without compromising on quality.
            </p>
          </div>
          
          <div class="p-4">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Quality Assured
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              Rigorous testing and quality control processes.
            </p>
          </div>
          
          <div class="p-4">
            <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 011 1.73l-7 4a2 2 0 01-2 0l-7-4A2 2 0 015 8h2m0 0V6a2 2 0 012-2h6a2 2 0 012 2v2m-8 0h8"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Expert Support
            </h3>
            <p class="text-gray-600 dark:text-gray-300">
              24/7 support from our team of experienced professionals.
            </p>
          </div>
        </div>
      `
    }} />
  ),
};

export const WithLinks: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-2 gap-6">
          <a href="#" class="block transition-transform duration-200 hover:scale-105">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
              <div class="bg-primary/10 text-primary p-3 rounded-full mb-4 w-fit">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Learning Resources
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                Access our comprehensive library of tutorials and guides.
              </p>
            </div>
          </a>
          
          <a href="#" class="block transition-transform duration-200 hover:scale-105">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
              <div class="bg-secondary/10 text-secondary p-3 rounded-full mb-4 w-fit">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Community Support
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                Join our active community of developers and experts.
              </p>
            </div>
          </a>
        </div>
      `
    }} />
  ),
};