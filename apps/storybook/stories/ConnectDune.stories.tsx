import { ConnectDune, DuneConnectionProvider } from "@arrakis/fremen/react";
import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";

import {
  installFetchMock,
  mockAuthClient,
  uninstallFetchMock,
  type MockState,
} from "./mock-auth-client.js";

type Args = React.ComponentProps<typeof ConnectDune> & { sessionState: MockState };

function Harness({
  sessionState,
  ...args
}: Args): React.ReactElement {
  // Install a per-render fetch mock so the hook sees `/dune/status` replies
  // matching the current story's sessionState.
  React.useLayoutEffect(() => {
    installFetchMock(sessionState);
    return () => uninstallFetchMock();
  }, [sessionState]);
  return (
    <DuneConnectionProvider authClient={mockAuthClient(sessionState)}>
      <ConnectDune {...args} />
    </DuneConnectionProvider>
  );
}

const meta: Meta<Args> = {
  title: "fremen/ConnectDune",
  component: ConnectDune,
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "outline", "inline"],
    },
    sessionState: {
      control: "inline-radio",
      options: ["disconnected", "connected", "loading"],
    },
  },
  args: {
    variant: "default",
    sessionState: "disconnected",
  },
  render: (args) => <Harness {...args} />,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Inline: Story = {
  args: { variant: "inline", label: "Connect your Dune account" },
};

export const CustomLabel: Story = {
  args: { label: "Link Dune" },
};

export const Connected: Story = {
  args: { sessionState: "connected" },
  parameters: {
    docs: { description: { story: "When the user is connected, ConnectDune renders nothing." } },
  },
};

export const Loading: Story = {
  args: { sessionState: "loading" },
};
