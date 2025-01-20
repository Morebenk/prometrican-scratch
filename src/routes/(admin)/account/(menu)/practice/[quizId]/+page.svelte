<script lang="ts">
  import { onMount } from "svelte"
  import type { PageData } from "./$types"
  import { goto } from "$app/navigation"

  export let data: PageData

  let currentQuestionIndex = 0
  let selectedChoices = new Map<string, string>()
  let isSubmitting = false
  let quizCompleted = false
  let score = 0

  $: quiz = data.quiz
  $: questions = data.questions
  $: attempt = data.attempt
  $: currentQuestion = questions[currentQuestionIndex]
  $: progress = ((currentQuestionIndex + 1) / questions.length) * 100
  $: isLastQuestion = currentQuestionIndex === questions.length - 1

  onMount(() => {
    // If there's a last answered question, start from there
    if (attempt.last_answered_question_id) {
      const index = questions.findIndex(
        (q) => q.id === attempt.last_answered_question_id,
      )
      if (index !== -1) {
        currentQuestionIndex = index
      }
    }
  })

  async function handleChoiceSelect(questionId: string, choiceId: string) {
    if (quizCompleted) return
    selectedChoices.set(questionId, choiceId)
    selectedChoices = selectedChoices // Trigger reactivity
  }

  async function updateAttempt(attemptData: any) {
    const response = await fetch(`/api/quiz-attempts/${attempt.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attemptData),
    })
    return response.ok
  }

  async function handleNext() {
    if (!selectedChoices.has(currentQuestion.id)) return

    // Update progress
    await updateAttempt({
      last_answered_question_id: currentQuestion.id,
    })

    if (isLastQuestion) {
      await handleQuizSubmit()
    } else {
      currentQuestionIndex++
    }
  }

  async function handleQuizSubmit() {
    if (isSubmitting) return
    isSubmitting = true

    try {
      // Calculate score
      let correctAnswers = 0
      questions.forEach((question) => {
        const selectedChoiceId = selectedChoices.get(question.id)
        const correctChoice = question.choices.find((c) => c.is_correct)
        if (
          selectedChoiceId &&
          correctChoice &&
          selectedChoiceId === correctChoice.id
        ) {
          correctAnswers++
        }
      })

      score = (correctAnswers / questions.length) * 100

      // Update attempt
      await updateAttempt({
        completed_at: new Date().toISOString(),
        score,
      })

      quizCompleted = true
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      isSubmitting = false
    }
  }

  function handleRetry() {
    selectedChoices = new Map()
    currentQuestionIndex = 0
    quizCompleted = false
    score = 0
    goto(`/practice/${quiz.id}`, { replaceState: true })
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- Quiz Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-bold mb-2">{quiz.title}</h1>
    {#if quiz.description}
      <p class="text-base-content/70">{quiz.description}</p>
    {/if}

    <!-- Progress Bar -->
    <div class="w-full bg-base-200 rounded-full h-2.5 my-4">
      <div
        class="bg-primary h-2.5 rounded-full transition-all duration-300"
        style="width: {progress}%"
      />
    </div>
    <div class="text-sm text-base-content/70">
      Question {currentQuestionIndex + 1} of {questions.length}
    </div>
  </div>

  <!-- Quiz Content -->
  {#if quizCompleted}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Quiz Completed!</h2>
        <p class="text-lg mb-4">Your score: {score.toFixed(1)}%</p>

        <div class="flex gap-4">
          <button class="btn btn-primary" on:click={handleRetry}>
            Try Again
          </button>
          <a href="/practice" class="btn btn-outline"> Back to Practice </a>
        </div>
      </div>
    </div>
  {:else}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <!-- Question -->
        <div class="mb-6">
          <h2 class="text-xl font-medium mb-4">
            {currentQuestion.content}
          </h2>
          {#if currentQuestion.image_url}
            <img
              src={currentQuestion.image_url}
              alt="Question illustration"
              class="rounded-lg max-h-64 object-contain mb-4"
            />
          {/if}
        </div>

        <!-- Choices -->
        <div class="space-y-3">
          {#each currentQuestion.choices as choice}
            <button
              class="w-full btn btn-outline justify-start normal-case px-4 py-3 h-auto min-h-[3rem] {selectedChoices.get(
                currentQuestion.id,
              ) === choice.id
                ? 'btn-primary'
                : ''}"
              on:click={() => handleChoiceSelect(currentQuestion.id, choice.id)}
            >
              {choice.content}
            </button>
          {/each}
        </div>

        <!-- Navigation -->
        <div class="flex justify-end mt-6">
          <button
            class="btn btn-primary {!selectedChoices.has(currentQuestion.id)
              ? 'btn-disabled'
              : ''}"
            on:click={handleNext}
            disabled={!selectedChoices.has(currentQuestion.id) || isSubmitting}
          >
            {#if isSubmitting}
              <span class="loading loading-spinner" />
            {/if}
            {isLastQuestion ? "Submit Quiz" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Smooth transitions */
  .btn {
    transition: all 0.2s ease-in-out;
  }

  /* Progress bar animation */
  .bg-primary {
    transition: width 0.3s ease-in-out;
  }
</style>
