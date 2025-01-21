<script lang="ts">
  import { tick } from "svelte";

  export let icon: "flag" | "bookmark";
  export let isActive: boolean = false;
  export let tooltip = "";
  export let onClick: () => void;
  export let label: string;

  const paths = {
    flag: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    bookmark: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  };

  let svgElement: SVGElement;

  $: {
    if (svgElement) {
      // Force a reflow to ensure the attribute is updated
      tick().then(() => {
        svgElement.setAttribute("fill", isActive ? "currentColor" : "none");
      });
    }
  }
</script>

<button
  class="btn btn-ghost btn-sm tooltip tooltip-left hidden md:inline-flex"
  data-tip={tooltip}
  on:click={onClick}
  aria-label={label}
>
  <svg
    bind:this={svgElement}
    xmlns="http://www.w3.org/2000/svg"
    class="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d={paths[icon]} />
  </svg>
</button>
