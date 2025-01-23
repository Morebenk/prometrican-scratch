<script lang="ts">
  import type { DbQuestion, DbChoice } from "../../types";

  export let question: DbQuestion & { order: number; isBookmarked: boolean };
  export let currentIndex: number;
  export let selectedChoice: string | undefined;
  export let onChoiceSelect: (questionId: string, choiceId: string) => void;
  export let showFeedback: boolean;
  export let incorrectChoices: string[] = [];
  export let onFlag: () => void;
  export let onBookmark: () => void;
  export let isFlagged: boolean;
  export let isBookmarked: boolean;

  let showReportDialog = false;
  let reportType = "";
  let reportReason = "";
  let isSubmittingReport = false;

  $: isAnswered = !!selectedChoice;
  $: isCorrect =
    showFeedback &&
    isAnswered &&
    question.choices.find((c) => c.id === selectedChoice)?.is_correct;

  async function handleChoiceSelect(choiceId: string) {
    if (isAnswered && showFeedback) return;
    onChoiceSelect(question.id, choiceId);
  }

  function getChoiceClasses(choice: DbChoice) {
    if (!showFeedback || !isAnswered) return "";

    if (choice.id === selectedChoice) {
      return choice.is_correct ? "choice-correct" : "choice-incorrect";
    }

    if (choice.is_correct) return "choice-correct";
    return "";
  }

  async function handleFlagClick() {
    showReportDialog = true;
  }

  async function submitReport() {
    if (!reportType) return; // Only type is required
    isSubmittingReport = true;

    try {
      const response = await fetch("/api/question-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          type: reportType,
          reason: reportReason || undefined, // Send undefined if empty
        }),
      });

      if (response.ok) {
        onFlag();
        showReportDialog = false;
        reportType = "";
        reportReason = "";
      } else {
        console.error("Error submitting report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      isSubmittingReport = false;
    }
  }

  function closeReportDialog() {
    showReportDialog = false;
    reportType = "";
    reportReason = "";
  }
</script>

<div class="card-body relative">
  <!-- Question Number -->
  <div class="absolute top-4 right-4 flex gap-2">
    <span class="badge">Question {currentIndex + 1}</span>
    <button
      class="btn btn-ghost btn-xs {isBookmarked ? 'text-warning' : ''}"
      on:click={onBookmark}
      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark question"}
      title={isBookmarked ? "Remove bookmark" : "Bookmark question"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={isBookmarked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-xs"
      on:click={handleFlagClick}
      aria-label={isFlagged ? "Question reported" : "Report question"}
      title={isFlagged ? "Question reported" : "Report question"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-5 h-5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
        />
      </svg>
    </button>
  </div>

  <!-- Question Content -->
  <div class="mb-6">
    <p class="text-lg">{@html question.content}</p>
    {#if question.image_url}
      <img
        src={question.image_url}
        alt="Question illustration"
        class="mt-4 rounded-lg max-h-64 object-contain"
      />
    {/if}
  </div>

  <!-- Answer Choices -->
  <div class="space-y-3">
    {#each question.choices as choice}
      {@const isChoiceIncorrect = incorrectChoices.includes(choice.id)}
      <button
        class="choice-button w-full text-left p-4 rounded-lg border transition-all duration-200
                    {isAnswered ? 'cursor-default' : 'hover:border-primary'} 
                    {selectedChoice === choice.id
          ? 'border-primary'
          : 'border-base-content/20'}
                    {getChoiceClasses(choice)}"
        on:click={() => handleChoiceSelect(choice.id)}
        disabled={isAnswered && showFeedback}
      >
        <div class="flex items-start gap-3">
          <div
            class="choice-indicator w-6 h-6 rounded-full border-2 border-current flex-shrink-0
                            flex items-center justify-center mt-0.5
                            {selectedChoice === choice.id
              ? 'border-primary'
              : ''}"
          >
            {#if showFeedback && isAnswered}
              {#if choice.is_correct}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              {:else if selectedChoice === choice.id}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              {/if}
            {/if}
          </div>
          <span>{@html choice.content}</span>
        </div>
        {#if showFeedback && isAnswered && choice.explanation}
          <p class="mt-2 text-sm ml-9 text-base-content/70">
            {@html choice.explanation}
          </p>
        {/if}
      </button>
    {/each}
  </div>

  {#if showFeedback && isAnswered && question.explanation}
    <div class="mt-6 p-4 bg-base-200 rounded-lg">
      <h4 class="font-medium mb-2">Explanation</h4>
      <p class="text-base-content/70">
        {@html question.explanation}
      </p>
    </div>
  {/if}
</div>

<!-- Report Dialog -->
{#if showReportDialog}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-base-100 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h3 class="text-lg font-bold mb-4">Report Question</h3>

      <div class="form-control">
        <label class="label" for="report-type">
          <span class="label-text"
            >Type of Issue <span class="text-error">*</span></span
          >
        </label>
        <select
          id="report-type"
          class="select select-bordered w-full"
          bind:value={reportType}
        >
          <option value="">Select an issue type</option>
          <option value="incorrect">Incorrect Answer</option>
          <option value="unclear">Unclear Question</option>
          <option value="typo">Typo/Grammar</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-control mt-4">
        <label class="label" for="report-description">
          <span class="label-text">Additional Details (Optional)</span>
        </label>
        <textarea
          id="report-description"
          class="textarea textarea-bordered h-24"
          placeholder="Provide more details about the issue (optional)"
          bind:value={reportReason}
        ></textarea>
      </div>

      <div class="modal-action mt-6">
        <button
          class="btn btn-outline"
          on:click={closeReportDialog}
          disabled={isSubmittingReport}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary ml-2"
          on:click={submitReport}
          disabled={!reportType || isSubmittingReport}
        >
          {#if isSubmittingReport}
            <span class="loading loading-spinner"></span>
          {/if}
          Submit Report
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .choice-button {
    background-color: hsl(var(--b1));
  }

  .choice-button:hover:not(:disabled) {
    background-color: hsl(var(--b2));
  }

  .choice-correct {
    @apply border-success text-success;
    background-color: hsl(var(--su) / 0.1);
  }

  .choice-incorrect {
    @apply border-error text-error;
    background-color: hsl(var(--er) / 0.1);
  }

  /* Ensure SVG icons inherit color properly */
  :global(svg) {
    @apply inline-block align-text-bottom;
  }
</style>
