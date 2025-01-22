<script lang="ts">
  export let content: string;
  export let isCorrect: boolean;
  export let explanation: string | null;
</script>

<div
  class="p-3 rounded-lg border {isCorrect
    ? 'bg-success/10 border-success'
    : 'border-base-300'}"
>
  <div class="flex items-start gap-2">
    <span class="mt-1 {isCorrect ? 'text-success' : ''}">
      {isCorrect ? "✓" : "○"}
    </span>
    <div class="space-y-1">
      <p>{content}</p>
      {#if explanation}
        <p class="text-sm text-base-content/60">
          Explanation: {explanation}
        </p>
      {/if}
    </div>
  </div>
</div>
