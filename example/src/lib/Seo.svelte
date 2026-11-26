<script lang="ts">
  import { Head } from "svead";
  import { page } from "$app/state";

  let { title, description }: { title?: string; description: string } = $props();

  const siteName = "@joknoll/svelte-attach";
  // Keep prerendered metadata independent of the local build or preview host.
  const siteUrl = "https://joknoll.github.io/svelte-attach";
  const route = $derived((page.route.id ?? "").replace(/\/$/, ""));
</script>

<Head
  seo_config={{
    title: title ? `${title} · ${siteName}` : siteName,
    description,
    url: `${siteUrl}${route}/`,
    site_name: siteName,
    open_graph_image: `${siteUrl}/social-preview.png`,
    open_graph_image_alt: "svelte-attach: Svelte 5 attachments for keyboard, sound, vibration, and gamepad controls.",
    open_graph_image_type: "image/png",
    open_graph_image_width: 1200,
    open_graph_image_height: 630,
  }}
/>
