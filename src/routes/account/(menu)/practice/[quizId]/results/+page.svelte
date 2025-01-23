<script lang="ts">
  import type { PageData, QuizAnswer } from "./types";

  export let data: PageData;

  $: ({ quiz, attempt, answers } = data);
  $: correctAnswers = answers.filter(
    (a: QuizAnswer) => a.selected_choice.is_correct,
  );
  $: score = attempt.score;
  $: completionTime = attempt.time_spent;

  function formatTime(timeStr: string): string {
    const time = new Date(timeStr);
    const hours = time.getUTCHours();
    const minutes = time.getUTCMinutes();
    const seconds = time.getUTCSeconds();

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex flex-col gap-8">
    <!-- Header -->
    <div>
      <div class="breadcrumbs text-sm mb-4">
        <ul>
          <li>{quiz.category.subject.name}</li>
          <li>{quiz.category.name}</li>
          <li>{quiz.title}</li>
        </ul>
      </div>
      <h1 class="text-3xl font-bold mb-2">Quiz Results</h1>
    </div>

    <!-- Summary Stats -->
    <div class="stats shadow stats-vertical lg:stats-horizontal w-full">
      <div class="stat">
        <div class="stat-title">Score</div>
        <div class="stat-value text-primary">{score.toFixed(1)}%</div>
        <div class="stat-desc">
          {correctAnswers.length} out of {answers.length} correct
        </div>
      </div>

      <div class="stat">
        <div class="stat-title">Time</div>
        <div class="stat-value">{formatTime(completionTime)}</div>
        <div class="stat-desc">Total time taken</div>
      </div>

      <div class="stat">
        <div class="stat-title">Questions</div>
        <div class="stat-value">{answers.length}</div>
        <div class="stat-desc">Total questions answered</div>
      </div>
    </div>

    <!-- Question Review -->
    <div class="flex flex-col gap-6">
      <h2 class="text-2xl font-bold">Question Review</h2>

      {#each answers as answer, index}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="text-lg font-medium mb-4">
              Question {index + 1}
            </h3>

            <div class="prose max-w-none mb-6">
              <p>{answer.question.content}</p>

              {#if answer.question.image_url}
                <img
                  src={answer.question.image_url}
                  alt="Question illustration"
                  class="max-w-2xl rounded-lg my-4"
                />
              {/if}
            </div>

            <div class="space-y-4">
              {#each answer.question.choices as choice}
                <div
                  class="flex items-center gap-4 p-4 rounded-lg border"
                  class:bg-success-100={choice.is_correct}
                  class:bg-error-100={!choice.is_correct &&
                    choice.id === answer.selected_choice.id}
                  class:border-success={choice.is_correct}
                  class:border-error={!choice.is_correct &&
                    choice.id === answer.selected_choice.id}
                  class:border-base-200={choice.id !==
                    answer.selected_choice.id && !choice.is_correct}
                >
                  <div class="flex-grow">
                    <p class="font-medium">{choice.content}</p>
                    {#if choice.explanation && (choice.is_correct || choice.id === answer.selected_choice.id)}
                      <p class="text-sm mt-2 text-base-content/70">
                        {choice.explanation}
                      </p>
                    {/if}
                  </div>

                  <div class="flex-none">
                    {#if choice.id === answer.selected_choice.id}
                      {#if choice.is_correct}
                        <div class="badge badge-success gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            class="w-4 h-4"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Your Answer
                        </div>
                      {:else}
                        <div class="badge badge-error gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            class="w-4 h-4"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Your Answer
                        </div>
                      {/if}
                    {:else if choice.is_correct}
                      <div class="badge badge-success">Correct Answer</div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>

            {#if answer.question.explanation}
              <div class="bg-base-200 rounded-lg p-4 mt-6">
                <h4 class="font-medium mb-2">Explanation</h4>
                <p>{answer.question.explanation}</p>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Actions -->
    <div class="flex justify-between mt-4">
      <a href="/account/practice" class="btn"> Back to Practice </a>
      <a
        href="/account/practice/{quiz.id}?restart=true"
        class="btn btn-primary"
      >
        Try Again
      </a>
    </div>
  </div>
</div>
