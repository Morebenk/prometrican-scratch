<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    change: { url: string | null };
  }>();

  export let imageUrl: string | null = null;
  export let disabled = false;

  let urlInput = "";
  let showUrlInput = false;

  function handleUrlSubmit() {
    if (urlInput) {
      imageUrl = urlInput;
      dispatch("change", { url: urlInput });
      showUrlInput = false;
    }
  }

  function handleRemove() {
    imageUrl = null;
    urlInput = "";
    showUrlInput = false;
    dispatch("change", { url: null });
  }
</script>

<div class="space-y-4">
  {#if imageUrl}
    <div class="relative">
      <img
        src={imageUrl}
        alt="Question"
        class="max-h-64 rounded-lg object-contain bg-base-200"
      />
      <button
        type="button"
        class="btn btn-circle btn-sm absolute top-2 right-2 bg-base-100"
        {disabled}
        on:click={handleRemove}
      >
        ✕
      </button>
    </div>
  {:else if showUrlInput}
    <div class="join w-full">
      <input
        type="url"
        class="input input-bordered join-item flex-1"
        placeholder="Enter image URL"
        bind:value={urlInput}
        {disabled}
      />
      <button
        type="button"
        class="btn join-item"
        disabled={disabled || !urlInput}
        on:click={handleUrlSubmit}
      >
        Add
      </button>
      <button
        type="button"
        class="btn join-item"
        {disabled}
        on:click={() => (showUrlInput = false)}
      >
        Cancel
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="btn btn-outline w-full h-32 flex flex-col gap-2"
      {disabled}
      on:click={() => (showUrlInput = true)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      Add Image
    </button>
  {/if}
</div>
