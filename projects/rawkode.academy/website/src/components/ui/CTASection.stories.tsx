import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'UI/CTASection',
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gradient', 'dark'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-800">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-gray-900 dark:text-white">
              Ready to Get Started?
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Join thousands of developers who have advanced their careers with our expert-led training programs.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
                Start Learning
              </a>
              
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white px-6 py-3 text-lg gap-2.5">
                Learn More
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-800">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-gray-900 dark:text-white">
              Accelerate Your Career
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Transform your development skills with our comprehensive cloud native training programs designed by industry experts.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
                Explore Courses
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};

export const Gradient: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-gray-900 dark:text-white">
              Join Our Community
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Connect with thousands of developers, share knowledge, and grow together in our vibrant learning community.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
                Join Community
              </a>
              
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 hover:text-primary hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 px-6 py-3 text-lg gap-2.5">
                Browse Resources
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};

export const Dark: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-gray-900 dark:bg-black">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
            </div>
            
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-white">
              Need Help Getting Started?
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-300">
              Our team of experts is here to help you choose the right learning path and answer any questions you might have.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
                Contact Us
              </a>
              
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:text-primary dark:text-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white px-6 py-3 text-lg gap-2.5">
                Browse FAQ
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};

export const SingleButton: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-white dark:bg-gray-800">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-gray-900 dark:text-white">
              Start Your Journey Today
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Take the first step towards mastering cloud native development with our comprehensive learning platform.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-gradient-to-br from-primary to-secondary hover:from-secondary hover:to-primary shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5">
                Get Started Now
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};

export const Newsletter: Story = {
  render: () => (
    <div dangerouslySetInnerHTML={{
      __html: `
        <section class="section-separator bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <div class="mx-auto max-w-4xl text-center py-16 px-4 lg:py-20 lg:px-6">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6"></path>
                </svg>
              </div>
            </div>
            
            <h2 class="text-3xl font-bold tracking-tight lg:text-4xl mb-4 text-gray-900 dark:text-white">
              Stay Updated
            </h2>
            
            <p class="text-lg mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              Get the latest updates on new courses, industry insights, and exclusive learning resources delivered to your inbox.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <a href="#" class="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-[--duration-fast] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-primary hover:bg-primary-hover shadow-sm hover:shadow-md px-6 py-3 text-lg gap-2.5 whitespace-nowrap">
                Subscribe
              </a>
            </div>
          </div>
        </section>
      `
    }} />
  ),
};