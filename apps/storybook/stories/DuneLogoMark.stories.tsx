import { DuneLogoMark } from "@arrakis/fremen/react";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof DuneLogoMark> = {
  title: "fremen/DuneLogoMark",
  component: DuneLogoMark,
};

export default meta;

type Story = StoryObj<typeof DuneLogoMark>;

export const Default: Story = {
  render: () => <DuneLogoMark style={{ width: 24, height: 24 }} />,
};

export const Small: Story = {
  render: () => <DuneLogoMark style={{ width: 16, height: 16 }} />,
};

export const Large: Story = {
  render: () => <DuneLogoMark style={{ width: 48, height: 48 }} />,
};

export const WithTitle: Story = {
  render: () => (
    <DuneLogoMark title="Dune" style={{ width: 32, height: 32 }} />
  ),
};
