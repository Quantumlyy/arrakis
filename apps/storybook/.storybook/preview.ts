import type { Preview } from "@storybook/react";

import "@arrakis/fremen/react/styles.css";
import "./preview.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0b0d12" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
