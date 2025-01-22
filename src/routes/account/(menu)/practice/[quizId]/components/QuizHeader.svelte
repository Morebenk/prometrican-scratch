<script lang="ts">
  import type { Quiz } from "../types";

  export let quiz: Quiz;
  export let showFeedback: boolean;
  export let onToggleFeedback: () => void;

  function handleToggle() {
    onToggleFeedback();
  }
</script>

<div class="flex flex-wrap justify-between items-start gap-4 mb-2">
  <div class="flex-grow">
    <h1 class="text-2xl font-bold">{quiz.title}</h1>
    {#if quiz.description}
      <p class="text-base-content/70 mt-2">{quiz.description}</p>
    {/if}
  </div>

  <div class="flex items-center gap-4">
    <div class="tooltip tooltip-left" data-tip="Toggle instant feedback">
      <label class="cursor-pointer label gap-2">
        <span class="label-text">Instant Feedback</span>
        <input
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={showFeedback}
          on:change={handleToggle}
        />
      </label>
    </div>
  </div>
</div>
