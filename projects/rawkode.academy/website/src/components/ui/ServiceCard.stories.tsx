import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/ServiceCard',
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated'],
    },
    iconColor: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'quaternary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-sm">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-primary/10 text-primary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Development Consulting
              </h3>
            </div>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Get expert guidance on your development projects with our comprehensive consulting services.
            </p>
            
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Architecture review and planning</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Code review and optimization</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Technology stack guidance</span>
              </li>
            </ul>
            
            <div class="mt-auto">
              <a href="#" class="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200">
                Learn More
              </a>
            </div>
          </div>
        </div>
      `
    }} />
  ),
};

export const Bordered: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-sm">
          <div class="bg-white dark:bg-gray-800 border-2 border-primary/20 dark:border-primary/30 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-secondary/10 text-secondary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Training Programs
              </h3>
            </div>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Upskill your team with our comprehensive training programs designed for modern development practices.
            </p>
            
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Hands-on workshops</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Custom curriculum</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Expert instructors</span>
              </li>
            </ul>
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
        <div class="max-w-sm">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-tertiary/10 text-tertiary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Enterprise Solutions
              </h3>
            </div>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Scale your business with our enterprise-grade solutions and ongoing support.
            </p>
            
            <ul class="space-y-2 mb-6">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">24/7 support</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Custom integrations</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Dedicated account manager</span>
              </li>
            </ul>
            
            <div class="mt-auto">
              <a href="#" class="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      `
    }} />
  ),
};

export const WithoutButton: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="max-w-sm">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-quaternary/10 text-quaternary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Cloud Infrastructure
              </h3>
            </div>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Reliable and scalable cloud infrastructure solutions for your growing business needs.
            </p>
            
            <ul class="space-y-2">
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Auto-scaling capabilities</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">99.9% uptime guarantee</span>
              </li>
              <li class="flex items-start">
                <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-gray-700 dark:text-gray-300">Security compliance</span>
              </li>
            </ul>
          </div>
        </div>
      `
    }} />
  ),
};

export const Grid: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <div class="grid md:grid-cols-3 gap-6 max-w-6xl">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-primary/10 text-primary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Development</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300">Expert development services for your projects.</p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-secondary/10 text-secondary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Training</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300">Comprehensive training programs for your team.</p>
          </div>
          
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg hover:shadow-md transition-all duration-300">
            <div class="flex items-center mb-4">
              <div class="bg-tertiary/10 text-tertiary shrink-0 p-3 rounded-full mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Enterprise</h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300">Enterprise-grade solutions for large organizations.</p>
          </div>
        </div>
      `
    }} />
  ),
};