<script lang="ts">
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("practice")
</script>

<div class="container mx-auto px-4 py-8">
  <div class="alert alert-error shadow-lg">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="stroke-current shrink-0 h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div>
      <h3 class="font-bold">Error</h3>
      <div class="text-sm">
        Sorry, we couldn't load the practice content. Please try again later.
      </div>
    </div>
  </div>

  <div class="mt-4">
    <a href="/account/practice" class="btn btn-primary"> Back to Practice </a>
  </div>
</div>
