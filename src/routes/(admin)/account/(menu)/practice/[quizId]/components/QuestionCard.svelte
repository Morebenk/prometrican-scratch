<script lang="ts">
  import type { Question, Choice } from "../types";
  import IconButton from "./IconButton.svelte";

  export let question: Question;
  export let currentIndex: number;
  export let onChoiceSelect: (questionId: string, choiceId: string) => void;
  export let selectedChoice: string | undefined;
  export let showFeedback: boolean;
  export let incorrectChoices: Map<string, string[]>;
  export let onFlag: () => void;
  export let onBookmark: () => void;
  export let isFlagged: boolean;
  export let isBookmarked: boolean;

  let showFlagDialog = false;
  let flagDetails = "";
  let flagReason = "question_content";
  let flagError = "";
  let isSubmittingFlag = false;
  let flagFormId = `flag-form-${question.id}`;
  let detailsId = `details-${question.id}`;

  $: correctChoice = question.choices.find((c) => c.is_correct);
  $: isCorrect = selectedChoice === correctChoice?.id;
  $: wasIncorrect = Boolean(
    selectedChoice &&
      incorrectChoices.get(question.id)?.includes(selectedChoice),
  );

  function handleFlag() {
    showFlagDialog = true;
  }

  async function submitFlag() {
    if (flagReason && flagDetails) {
      isSubmittingFlag = true;
      flagError = "";

      try {
        const response = await fetch("/api/flagged-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            type: flagReason,
            reason: flagDetails,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit report");
        }

        onFlag();
        showFlagDialog = false;
        flagDetails = "";
        flagReason = "question_content";
      } catch (error) {
        flagError =
          error instanceof Error ? error.message : "Failed to submit report";
      } finally {
        isSubmittingFlag = false;
      }
    }
  }
</script>

<div class="card-body">
  <div class="mb-6">
    <div class="flex justify-between items-start gap-4 mb-4">
      <h2 class="text-xl font-medium">Question {currentIndex + 1}</h2>
      <div class="flex gap-2">
        <IconButton
          icon="flag"
          tooltip="Flag question (F)"
          isActive={isFlagged}
          onClick={handleFlag}
          label="Flag this question"
        />
        <IconButton
          icon="bookmark"
          tooltip="Bookmark question (B)"
          isActive={isBookmarked}
          onClick={onBookmark}
          label="Bookmark this question"
        />
      </div>
    </div>

    <p class="mb-4">{question.content}</p>
    {#if question.image_url}
      <img
        src={question.image_url}
        alt="Question illustration"
        class="rounded-lg max-h-64 object-contain mb-4"
      />
    {/if}
  </div>

  <div class="space-y-3">
    {#each question.choices as choice, i}
      {@const isSelected = selectedChoice === choice.id}
      {@const isCorrectChoice = choice.id === correctChoice?.id}
      <button
        class="w-full btn justify-start normal-case px-4 py-3 h-auto min-h-[3rem] transition-all duration-200
        {isSelected ? 'btn-primary' : 'btn-outline'} 
        {showFeedback && selectedChoice
          ? isSelected && !isCorrect
            ? 'btn-error'
            : isCorrectChoice
              ? 'btn-success bg-opacity-50'
              : ''
          : ''}"
        on:click={() =>
          !showFeedback || !selectedChoice
            ? onChoiceSelect(question.id, choice.id)
            : null}
        disabled={showFeedback && selectedChoice && !isSelected}
        aria-label="Choice {i + 1}"
      >
        <span class="mr-3 opacity-70">{i + 1}.</span>
        {choice.content}
        {#if showFeedback && selectedChoice && isCorrectChoice}
          <span class="badge badge-success ml-2">Correct Answer</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if showFeedback && selectedChoice}
    <div
      class="mt-4 p-4 rounded-lg {isCorrect ? 'bg-success/10' : 'bg-error/10'}"
    >
      <p class="font-medium {isCorrect ? 'text-success' : 'text-error'}">
        {isCorrect ? "Correct!" : "Incorrect"}
      </p>
      {#if !isCorrect}
        <p class="mt-2 font-medium text-success">
          The correct answer is: {correctChoice?.content}
        </p>
      {/if}
      {#if question.explanation}
        <p class="mt-2">{question.explanation}</p>
      {/if}
    </div>
  {/if}
</div>

<!-- Flag Dialog -->
{#if showFlagDialog}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-base-100 p-6 rounded-lg w-full max-w-md mx-4">
      <h3 class="text-lg font-bold mb-4">Report Question</h3>

      {#if flagError}
        <div class="alert alert-error mb-4">
          <p>{flagError}</p>
        </div>
      {/if}

      <form id={flagFormId}>
        <div class="form-control w-full mb-4">
          <label for="flag-type" class="label">
            <span class="label-text">Issue Type</span>
          </label>
          <select
            id="flag-type"
            class="select select-bordered"
            bind:value={flagReason}
          >
            <option value="question_content">Question Content Issue</option>
            <option value="answer_choices">Answer Choices Issue</option>
            <option value="correct_answer">Correct Answer Issue</option>
            <option value="explanation">Explanation Issue</option>
            <option value="technical">Technical Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-control w-full mb-4">
          <label for={detailsId} class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
            id={detailsId}
            class="textarea textarea-bordered h-24"
            placeholder="Please describe the issue in detail"
            bind:value={flagDetails}
          ></textarea>
        </div>
      </form>

      <div class="flex justify-end gap-2">
        <button
          class="btn btn-ghost"
          on:click={() => (showFlagDialog = false)}
          disabled={isSubmittingFlag}
        >
          Cancel
        </button>
        <button
          type="submit"
          form={flagFormId}
          class="btn btn-primary"
          disabled={!flagReason || !flagDetails || isSubmittingFlag}
          on:click|preventDefault={submitFlag}
        >
          {#if isSubmittingFlag}
            <span class="loading loading-spinner"></span>
          {/if}
          Submit Report
        </button>
      </div>
    </div>
  </div>
{/if}
