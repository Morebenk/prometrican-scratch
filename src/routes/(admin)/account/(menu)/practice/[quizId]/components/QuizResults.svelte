<script lang="ts">
  import type { Question } from "../types"

  export let questions: Question[]
  export let score: number
  export let selectedChoices: Map<string, string>
  export let timePerQuestion: Map<string, number>
  export let onRetry: () => void

  function getAverageTime(): string {
    const times = Array.from(timePerQuestion.values())
    const average = times.reduce((a, b) => a + b, 0) / times.length / 1000
    return average.toFixed(1)
  }
</script>

<div class="card-body">
  <h2 class="card-title mb-4">Quiz Completed!</h2>

  <!-- Summary Stats -->
  <div class="stats stats-vertical lg:stats-horizontal shadow">
    <div class="stat">
      <div class="stat-title">Final Score</div>
      <div class="stat-value text-primary">{score.toFixed(1)}%</div>
    </div>
    <div class="stat">
      <div class="stat-title">Questions Correct</div>
      <div class="stat-value">
        {Math.round((score / 100) * questions.length)}/{questions.length}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title">Average Time</div>
      <div class="stat-value text-sm">
        {getAverageTime()}s
      </div>
      <div class="stat-desc">per question</div>
    </div>
  </div>

  <!-- Detailed Results -->
  <div class="mt-8">
    <h3 class="text-lg font-semibold mb-4">Detailed Results</h3>
    <div class="space-y-6">
      {#each questions as question, index}
        {@const selectedChoice = selectedChoices.get(question.id)}
        {@const correctChoice = question.choices.find((c) => c.is_correct)}
        {@const isCorrect = selectedChoice === correctChoice?.id}
        <div class="bg-base-200 p-4 rounded-lg transition-all duration-300">
          <div class="flex justify-between items-start gap-4 mb-2">
            <div class="flex-grow">
              <h4 class="font-medium mb-1">Question {index + 1}</h4>
              <p>{question.content}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div
                class="badge {isCorrect
                  ? 'badge-success'
                  : 'badge-error'} badge-lg"
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </div>
              <div class="text-sm opacity-70">
                {((timePerQuestion.get(question.id) || 0) / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {#if question.image_url}
            <img
              src={question.image_url}
              alt="Question illustration"
              class="rounded-lg max-h-48 object-contain my-4"
            />
          {/if}

          <div class="mt-4 space-y-2">
            {#each question.choices as choice}
              {@const isSelected = choice.id === selectedChoice}
              {@const isCorrectChoice = choice.id === correctChoice?.id}
              <div
                class="p-3 rounded-lg flex items-start gap-3 transition-all duration-200 {isSelected &&
                isCorrectChoice
                  ? 'bg-success/20'
                  : isSelected
                    ? 'bg-error/20'
                    : isCorrectChoice
                      ? 'bg-success/10'
                      : 'bg-base-100'}"
              >
                <div class="mt-1">
                  {#if isSelected && isCorrectChoice}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {:else if isSelected}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-error"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {:else if isCorrectChoice}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-success"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </div>
                <div class="flex-grow">{choice.content}</div>
              </div>
            {/each}
          </div>

          {#if question.explanation}
            <div class="bg-base-100 p-3 rounded mt-4">
              <p class="font-medium">Explanation:</p>
              <p class="mt-1">{question.explanation}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="flex gap-4 mt-6">
    <button class="btn btn-primary" on:click={onRetry}> Try Again </button>
    <a href="/account/practice" class="btn btn-outline"> Back to Practice </a>
  </div>
</div>
