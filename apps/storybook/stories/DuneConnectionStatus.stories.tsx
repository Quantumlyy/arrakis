import { DuneConnectionProvider, DuneConnectionStatus } from "@arrakis/fremen/react";
import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

import {
  installFetchMock,
  mockAuthClient,
  uninstallFetchMock,
  type MockState,
} from "./mock-auth-client.js";

type Args = React.ComponentProps<typeof DuneConnectionStatus> & {
  sessionState: MockState;
  username: string;
};

function Harness({
  sessionState,
  username,
  ...args
}: Args): React.ReactElement {
  React.useLayoutEffect(() => {
    installFetchMock(sessionState, username);
    return () => uninstallFetchMock();
  }, [sessionState, username]);
  return (
    <DuneConnectionProvider authClient={mockAuthClient(sessionState)}>
      <DuneConnectionStatus {...args} />
    </DuneConnectionProvider>
  );
}

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
  render: (args) => <Harness {...args} />,
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
