import React, { useEffect, useRef } from 'react';
import { createApp } from 'vue';
import SimpleStats from './simple.vue';

interface SimpleStatsWrapperProps {
  title: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
}

export const SimpleStatsWrapper: React.FC<SimpleStatsWrapperProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = createApp(SimpleStats, props);
    app.mount(containerRef.current);

    return () => {
      app.unmount();
    };
  }, [props]);

  return <div ref={containerRef} />;
};