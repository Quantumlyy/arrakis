import { DuneConnectionProvider, DuneConnectionStatus } from "@arrakis/fremen/react";
import type { Meta, StoryObj } from "@storybook/react";

import { mockAuthClient, type MockState } from "./mock-auth-client.js";

type Args = React.ComponentProps<typeof DuneConnectionStatus> & {
  sessionState: MockState;
  username: string;
};

const meta: Meta<Args> = {
  title: "fremen/DuneConnectionStatus",
  component: DuneConnectionStatus,
  argTypes: {
    sessionState: {
      control: "inline-radio",
      options: ["disconnected", "connected", "loading"],
    },
    hideDisconnect: { control: "boolean" },
  },
  args: {
    sessionState: "connected",
    username: "alice",
    hideDisconnect: false,
  },
  render: ({ sessionState, username, ...args }) => (
    <DuneConnectionProvider authClient={mockAuthClient(sessionState, username)}>
      <DuneConnectionStatus {...args} />
    </DuneConnectionProvider>
  ),
};

export default meta;

type Story = StoryObj<Args>;

export const Connected: Story = {};

export const ConnectedNoDisconnect: Story = {
  args: { hideDisconnect: true },
};

export const CustomLabel: Story = {
  args: {
    connectedLabel: (context) =>
      context ? `Linked to Dune · ${context}` : "Linked to Dune",
  },
};

export const Disconnected: Story = {
  args: { sessionState: "disconnected" },
  parameters: {
    docs: {
      description: { story: "When disconnected, the status pill renders nothing." },
    },
  },
};
