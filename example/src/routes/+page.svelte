<script lang="ts">
  import { resolve } from "$app/paths";

  const demos = [
    {
      href: "/haptic",
      title: "Haptic",
      pkg: "@joknoll/svelte-attach/haptic",
      blurb: "Vibration feedback on DOM events via the Web Vibration API.",
    },
    {
      href: "/sound",
      title: "Sound",
      pkg: "@joknoll/svelte-attach/sound",
      blurb: "Sound playback bound to DOM events via the Web Audio API.",
    },
    {
      href: "/key",
      title: "Key",
      pkg: "@joknoll/svelte-attach/key",
      blurb: "Keyboard shortcut attachments for DOM elements.",
    },
    {
      href: "/gamepad",
      title: "Gamepad",
      pkg: "@joknoll/svelte-attach/gamepad",
      blurb: "Gamepad buttons that activate the focused element via the Gamepad API.",
    },
  ] as const;
</script>

<h1>svelte-attach</h1>
<p>A collection of Svelte 5 attachments. Pick a demo:</p>

<ul class="cards">
  {#each demos as demo (demo.href)}
    <li>
      <a href={resolve(demo.href)}>
        <h2>{demo.title}</h2>
        <code>{demo.pkg}</code>
        <p>{demo.blurb}</p>
      </a>
    </li>
  {/each}
</ul>

<style>
  .cards {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  }

  .cards a {
    display: block;
    padding: 1.25rem;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    background: #fff;
    text-decoration: none;
    color: inherit;
  }

  .cards a:hover {
    border-color: #bbb;
  }

  .cards h2 {
    margin: 0 0 0.5rem;
  }

  .cards code {
    font-size: 0.8rem;
    color: #666;
  }
</style>
