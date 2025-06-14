import type { Preview } from "@storybook/react";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#F9FAFB", // Using theme(colors.gray.50)
        },
        {
          name: "dark",
          value: "#0F172A", // Using theme(colors.gray.900)
        },
        {
          name: "primary",
          value: "#FF5C8D", // Using theme(colors.primary)
        },
      ],
    },
  },
};

export default preview;