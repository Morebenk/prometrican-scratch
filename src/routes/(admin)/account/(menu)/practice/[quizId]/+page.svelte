<script lang="ts">
  import { onMount } from "svelte"
  import type { PageData } from "./$types"
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  export let data: PageData

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("practice")

  let currentQuestionIndex = 0
  let selectedChoices = new Map<string, string>()
  let isSubmitting = false
  let quizCompleted = false
  let score = 0
  let bookmarkedQuestions = new Set<string>()
  let incorrectChoices = new Map<string, string[]>()
  let showFeedback = true
  let timeStarted = Date.now()
  let timePerQuestion = new Map<string, number>()

  $: quiz = data.quiz
  $: questions = data.questions
  $: attempt = data.attempt
  $: currentQuestion = questions[currentQuestionIndex]
  $: progress = ((selectedChoices.size / questions.length) * 100).toFixed(0)
  $: isLastQuestion = currentQuestionIndex === questions.length - 1
  $: storageKey = `quiz_${quiz.id}_attempt_${attempt.id}`

  onMount(() => {
    initializeQuizState()
    const autoSaveInterval = setInterval(saveQuizState, 5000)
    return () => {
      clearInterval(autoSaveInterval)
      saveQuizState()
    }
  })

  function initializeQuizState() {
    const savedState = localStorage.getItem(storageKey)
    if (savedState) {
      const state = JSON.parse(savedState)
      selectedChoices = new Map(state.selectedChoices)
      bookmarkedQuestions = new Set(state.bookmarkedQuestions)
      timePerQuestion = new Map(state.timePerQuestion)
      currentQuestionIndex = state.currentQuestionIndex || 0
      showFeedback = state.showFeedback ?? true
    }

    questions.forEach((q) => {
      if (q.isBookmarked) bookmarkedQuestions.add(q.id)
      if (q.incorrectChoices.length > 0) {
        incorrectChoices.set(q.id, q.incorrectChoices)
      }
    })

    if (attempt.last_answered_question_id) {
      const index = questions.findIndex(
        (q) => q.id === attempt.last_answered_question_id,
      )
      if (index !== -1) {
        currentQuestionIndex = index
      }
    }
    timeStarted = Date.now()
  }

  function saveQuizState() {
    const state = {
      selectedChoices: Array.from(selectedChoices.entries()),
      bookmarkedQuestions: Array.from(bookmarkedQuestions),
      timePerQuestion: Array.from(timePerQuestion.entries()),
      currentQuestionIndex,
      showFeedback,
    }
    localStorage.setItem(storageKey, JSON.stringify(state))
  }

  async function handleChoiceSelect(questionId: string, choiceId: string) {
    if (quizCompleted || selectedChoices.has(questionId)) return // Restrict further selections

    const now = Date.now()
    if (!timePerQuestion.has(questionId)) {
      timePerQuestion.set(questionId, now - timeStarted)
    }
    timeStarted = now

    selectedChoices.set(questionId, choiceId)
    selectedChoices = selectedChoices
    saveQuizState()

    if (showFeedback) {
      const correctChoice = currentQuestion.choices.find((c) => c.is_correct)
      if (correctChoice) {
        await recordIncorrectResponse(questionId, choiceId)
        incorrectChoices.set(questionId, [
          ...(incorrectChoices.get(questionId) || []),
          choiceId,
        ])
        incorrectChoices = incorrectChoices
      }
    }
  }

  async function updateAttempt(attemptData: any) {
    if (!attempt.id) return
    const response = await fetch(`/api/quiz-attempts/${attempt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attemptData),
    })
    return response.ok
  }

  async function recordIncorrectResponse(questionId: string, choiceId: string) {
    try {
      await fetch("/api/incorrect-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, choiceId }),
      })
    } catch (error) {
      console.error("Error recording incorrect response:", error)
    }
  }

  function navigateToQuestion(index: number) {
    if (index >= 0 && index < questions.length) {
      currentQuestionIndex = index
      saveQuizState()
    }
  }

  async function handleNext() {
    if (!selectedChoices.has(currentQuestion.id)) return

    await updateAttempt({
      last_answered_question_id: currentQuestion.id,
    })

    if (isLastQuestion) {
      await handleQuizSubmit()
    } else {
      currentQuestionIndex++
      saveQuizState()
    }
  }

  async function handleQuizSubmit() {
    if (isSubmitting) return
    isSubmitting = true

    try {
      let correctAnswers = 0
      for (const question of questions) {
        const selectedChoiceId = selectedChoices.get(question.id)
        const correctChoice = question.choices.find((c) => c.is_correct)

        if (selectedChoiceId && correctChoice) {
          if (selectedChoiceId === correctChoice.id) {
            correctAnswers++
          } else if (!showFeedback) {
            await recordIncorrectResponse(question.id, selectedChoiceId)
          }
        }
      }

      score = (correctAnswers / questions.length) * 100

      await updateAttempt({
        completed_at: new Date().toISOString(),
        score,
      })

      localStorage.removeItem(storageKey)
      quizCompleted = true
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      isSubmitting = false
    }
  }

  function handleRetry() {
    localStorage.removeItem(storageKey)
    window.location.reload()
  }

  function toggleFeedbackMode() {
    showFeedback = !showFeedback
    saveQuizState()
  }

  async function toggleBookmark() {
    const questionId = currentQuestion.id
    try {
      const response = await fetch(
        `/api/bookmarks${bookmarkedQuestions.has(questionId) ? `?questionId=${questionId}` : ""}`,
        {
          method: bookmarkedQuestions.has(questionId) ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: !bookmarkedQuestions.has(questionId)
            ? JSON.stringify({ questionId })
            : undefined,
        },
      )

      if (response.ok) {
        if (bookmarkedQuestions.has(questionId)) {
          bookmarkedQuestions.delete(questionId)
        } else {
          bookmarkedQuestions.add(questionId)
        }
        bookmarkedQuestions = bookmarkedQuestions
        saveQuizState()
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error)
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- Quiz Header -->
  <div class="mb-8">
    <div class="flex flex-wrap justify-between items-start gap-4 mb-2">
      <div class="flex-grow">
        <h1 class="text-2xl font-bold">{quiz.title}</h1>
        {#if quiz.description}
          <p class="text-base-content/70 mt-2">{quiz.description}</p>
        {/if}
      </div>

      <div class="flex items-center gap-4">
        <label class="cursor-pointer label gap-2">
          <span class="label-text">Instant Feedback</span>
          <input
            type="checkbox"
            class="toggle toggle-primary"
            bind:checked={showFeedback}
            on:change={toggleFeedbackMode}
          />
        </label>
      </div>
    </div>

    <!-- Progress Bar and Stats -->
    <div class="flex flex-col gap-2 mt-4">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium">
          Progress: {selectedChoices.size} / {questions.length} Questions
        </span>
        <span class="text-sm font-medium">
          {progress}% Complete
        </span>
      </div>
      <div class="w-full bg-base-200 rounded-full h-2.5">
        <div
          class="bg-primary h-2.5 rounded-full transition-all duration-300"
          style="width: {progress}%"
        ></div>
      </div>
    </div>

    <!-- Question Navigation -->
    <div class="mt-4 overflow-x-auto hide-scrollbar">
      <div class="flex gap-2 pb-2">
        {#each questions as question, index}
          {@const isAnswered = selectedChoices.has(question.id)}
          {@const isCurrent = index === currentQuestionIndex}
          <button
            class="btn btn-sm min-w-[3rem] {isCurrent
              ? 'btn-primary'
              : ''} {isAnswered ? 'btn-outline' : 'btn-ghost'}"
            on:click={() => navigateToQuestion(index)}
          >
            Q{index + 1}
          </button>
        {/each}
      </div>
    </div>
  </div>
  <!-- Quiz Content -->
  {#if quizCompleted}
    <div class="card bg-base-100 shadow-xl">
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
              {(
                Array.from(timePerQuestion.values()).reduce(
                  (a, b) => a + b,
                  0,
                ) /
                timePerQuestion.size /
                1000
              ).toFixed(1)}s
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
              {@const correctChoice = question.choices.find(
                (c) => c.is_correct,
              )}
              {@const isCorrect = selectedChoice === correctChoice?.id}
              <div class="bg-base-200 p-4 rounded-lg">
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
                      {((timePerQuestion.get(question.id) || 0) / 1000).toFixed(
                        1,
                      )}s
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
                      class="p-3 rounded-lg flex items-start gap-3 {isSelected &&
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
          <button class="btn btn-primary" on:click={handleRetry}>
            Try Again
          </button>
          <a href="/account/practice" class="btn btn-outline">
            Back to Practice
          </a>
        </div>
      </div>
    </div>
  {:else}
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body relative">
        <!-- Question Content -->
        <div class="mb-6">
          <div class="flex justify-between items-start gap-4 mb-4">
            <h2 class="text-xl font-medium">
              Question {currentQuestionIndex + 1}
            </h2>
            <button
              class="btn btn-ghost btn-sm gap-2"
              on:click={toggleBookmark}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill={bookmarkedQuestions.has(currentQuestion.id)
                  ? "currentColor"
                  : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          <p class="mb-4">{currentQuestion.content}</p>
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
            {@const isSelected =
              selectedChoices.get(currentQuestion.id) === choice.id}
            {@const wasIncorrect = incorrectChoices
              .get(currentQuestion.id)
              ?.includes(choice.id)}
            <button
              class="w-full btn justify-start normal-case px-4 py-3 h-auto min-h-[3rem]
              {isSelected ? 'btn-primary' : 'btn-outline'} 
              {wasIncorrect ? 'btn-error' : ''}"
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
              <span class="loading loading-spinner"></span>
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

  /* Hide scrollbar */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style>
