<script lang="ts">
  import type { Question } from "../types";

  export let questions: Question[];
  export let currentIndex: number;
  export let onNavigate: (index: number) => void;
  export let flaggedQuestions: Set<string>;
  export let bookmarkedQuestions: Set<string>;
  export let selectedChoices: Map<string, string>;

  function getQuestionStatus(index: number) {
    const question = questions[index];
    if (!question) return "";
    if (flaggedQuestions.has(question.id)) return "flagged";
    if (bookmarkedQuestions.has(question.id)) return "bookmarked";
    if (selectedChoices.has(question.id)) return "answered";
    return "";
  }
</script>

<div class="mt-6 overflow-x-auto hide-scrollbar">
  <div class="flex gap-2 pb-2">
    {#each questions as _, index}
      {@const status = getQuestionStatus(index)}
      {@const isCurrent = index === currentIndex}
      <button
        class="btn btn-sm min-w-[3rem] relative {isCurrent
          ? 'btn-primary'
          : status === 'answered'
            ? 'btn-outline'
            : 'btn-ghost'}"
        on:click={() => onNavigate(index)}
      >
        <!-- {#if status === "flagged"}
          <div class="absolute -top-1 -right-1">
            <span class="badge badge-xs badge-warning"></span>
          </div>
        {/if} -->
        {#if status === "bookmarked"}
          <div class="absolute -top-1 -right-1">
            <span class="badge badge-xs badge-info"></span>
          </div>
        {/if}
        Q{index + 1}
      </button>
    {/each}
  </div>
</div>

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
