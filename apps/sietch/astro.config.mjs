import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://arrakis.example",
  integrations: [
    starlight({
      title: "arrakis",
      description: "Better Auth + Dune MCP for the people who use the spice.",
      social: {
        github: "https://github.com/Quantumlyy/arrakis",
      },
      sidebar: [
        { label: "Introduction", link: "/" },
        { label: "Installation", link: "/installation/" },
        { label: "Quickstart", link: "/quickstart/" },
        {
          label: "Guides",
          items: [
            { label: "Connecting accounts", link: "/guides/connecting-accounts/" },
            { label: "Fetching data", link: "/guides/fetching-data/" },
          ],
        },
        {
          label: "Notes",
          items: [
            { label: "Why link mode", link: "/notes/why-link-mode/" },
            { label: "Security model", link: "/notes/security-model/" },
          ],
        },
        { label: "API reference", link: "/api/" },
      ],
    }),
  ],
});
