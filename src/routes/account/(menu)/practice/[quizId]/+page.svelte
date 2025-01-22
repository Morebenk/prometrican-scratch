<script lang="ts">
  import { onMount } from "svelte";
  import type { PageData } from "./$types";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import QuizHeader from "./components/QuizHeader.svelte";
  import QuizProgress from "./components/QuizProgress.svelte";
  import QuestionCard from "./components/QuestionCard.svelte";
  import QuestionNavigation from "./components/QuestionNavigation.svelte";
  import QuizResults from "./components/QuizResults.svelte";

  export let data: PageData;

  let adminSection: Writable<string> = getContext("adminSection");
  adminSection.set("practice");

  let currentQuestionIndex = 0;
  let selectedChoices = new Map<string, string>();
  let isSubmitting = false;
  let quizCompleted = false;
  let score = 0;
  let bookmarkedQuestions = new Set<string>();
  let incorrectChoices = new Map<string, string[]>();
  let showFeedback = true;
  let timeStarted = Date.now();
  let timePerQuestion = new Map<string, number>();
  let flaggedQuestions = new Set<string>();

  $: quiz = data.quiz;
  $: questions = data.questions;
  $: attempt = data.attempt;
  $: currentQuestion = questions[currentQuestionIndex];
  $: progress = ((selectedChoices.size / questions.length) * 100).toFixed(0);
  $: isLastQuestion = currentQuestionIndex === questions.length - 1;
  $: storageKey = `quiz_${quiz.id}_attempt_${attempt.id}`;
  $: isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  onMount(() => {
    initializeQuizState();
    const autoSaveInterval = setInterval(saveQuizState, 5000);

    if (!isMobile) {
      document.addEventListener("keydown", handleKeyboardNavigation);
    }

    return () => {
      clearInterval(autoSaveInterval);
      saveQuizState();
      if (!isMobile) {
        document.removeEventListener("keydown", handleKeyboardNavigation);
      }
    };
  });

  function handleKeyboardNavigation(event: KeyboardEvent) {
    if (quizCompleted) return;

    if (event.key === "ArrowRight" && selectedChoices.has(currentQuestion.id)) {
      handleNext();
    } else if (event.key === "ArrowLeft" && currentQuestionIndex > 0) {
      currentQuestionIndex--;
    } else if (event.key === "f") {
      handleFlag();
    } else if (event.key === "b") {
      handleBookmark();
    } else if (event.key >= "1" && event.key <= "4") {
      const index = parseInt(event.key) - 1;
      if (index < currentQuestion.choices.length) {
        handleChoiceSelect(
          currentQuestion.id,
          currentQuestion.choices[index].id,
        );
      }
    }
  }

  function initializeQuizState() {
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      const state = JSON.parse(savedState);
      selectedChoices = new Map(state.selectedChoices);
      bookmarkedQuestions = new Set(state.bookmarkedQuestions);
      flaggedQuestions = new Set(state.flaggedQuestions);
      timePerQuestion = new Map(state.timePerQuestion);
      currentQuestionIndex = state.currentQuestionIndex || 0;
      showFeedback = state.showFeedback ?? true;
    }

    questions.forEach((q) => {
      if (q.isBookmarked) bookmarkedQuestions.add(q.id);
      if (q.incorrectChoices?.length > 0) {
        incorrectChoices.set(q.id, q.incorrectChoices);
      }
    });

    if (attempt.last_answered_question_id) {
      const index = questions.findIndex(
        (q) => q.id === attempt.last_answered_question_id,
      );
      if (index !== -1) {
        currentQuestionIndex = index;
      }
    }
    timeStarted = Date.now();
  }

  function saveQuizState() {
    const state = {
      selectedChoices: Array.from(selectedChoices.entries()),
      bookmarkedQuestions: Array.from(bookmarkedQuestions),
      flaggedQuestions: Array.from(flaggedQuestions),
      timePerQuestion: Array.from(timePerQuestion.entries()),
      currentQuestionIndex,
      showFeedback,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  async function handleChoiceSelect(questionId: string, choiceId: string) {
    if (quizCompleted || (showFeedback && selectedChoices.has(questionId)))
      return;

    const now = Date.now();
    if (!timePerQuestion.has(questionId)) {
      timePerQuestion.set(questionId, now - timeStarted);
    }
    timeStarted = now;

    selectedChoices.set(questionId, choiceId);
    selectedChoices = selectedChoices;
    saveQuizState();

    if (showFeedback) {
      const correctChoice = currentQuestion.choices.find((c) => c.is_correct);
      if (correctChoice && choiceId !== correctChoice.id) {
        await recordIncorrectResponse(questionId, choiceId);
        incorrectChoices.set(questionId, [
          ...(incorrectChoices.get(questionId) || []),
          choiceId,
        ]);
        incorrectChoices = incorrectChoices;
      }
    }
  }

  async function updateAttempt(attemptData: any) {
    if (!attempt.id) return;
    const response = await fetch(`/api/quiz-attempts/${attempt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attemptData),
    });
    return response.ok;
  }

  async function recordIncorrectResponse(questionId: string, choiceId: string) {
    try {
      await fetch("/api/incorrect-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, choiceId }),
      });
    } catch (error) {
      console.error("Error recording incorrect response:", error);
    }
  }

  async function handleNext() {
    if (!selectedChoices.has(currentQuestion.id)) return;

    await updateAttempt({
      last_answered_question_id: currentQuestion.id,
    });

    if (isLastQuestion) {
      await handleQuizSubmit();
    } else {
      currentQuestionIndex++;
      saveQuizState();
    }
  }

  async function handleQuizSubmit() {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      let correctAnswers = 0;
      for (const question of questions) {
        const selectedChoiceId = selectedChoices.get(question.id);
        const correctChoice = question.choices.find((c) => c.is_correct);

        if (selectedChoiceId && correctChoice) {
          if (selectedChoiceId === correctChoice.id) {
            correctAnswers++;
          } else if (!showFeedback) {
            await recordIncorrectResponse(question.id, selectedChoiceId);
          }
        }
      }

      score = (correctAnswers / questions.length) * 100;

      await updateAttempt({
        completed_at: new Date().toISOString(),
        score,
      });

      localStorage.removeItem(storageKey);
      quizCompleted = true;
    } catch (error) {
      console.error("Error submitting quiz:", error);
    } finally {
      isSubmitting = false;
    }
  }

  function handleRetry() {
    localStorage.removeItem(storageKey);
    window.location.reload();
  }

  function toggleFeedbackMode() {
    showFeedback = !showFeedback;
    saveQuizState();
  }

  function handleFlag() {
    flaggedQuestions = flaggedQuestions;
    saveQuizState();
  }

  async function handleBookmark() {
    const questionId = currentQuestion.id;
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
      );

      if (!response.ok) {
        const data = await response.json();
        console.error("Bookmark error:", data.message);
        return;
      }

      if (bookmarkedQuestions.has(questionId)) {
        bookmarkedQuestions.delete(questionId);
      } else {
        bookmarkedQuestions.add(questionId);
      }
      bookmarkedQuestions = bookmarkedQuestions;
      saveQuizState();
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  }

  function navigateToQuestion(index: number) {
    if (index >= 0 && index < questions.length) {
      currentQuestionIndex = index;
      saveQuizState();
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- Breadcrumb Navigation -->
  <nav class="breadcrumbs text-sm mb-6">
    <ul>
      <li><a href="/account/practice" class="link link-hover">Practice</a></li>
      <li class="text-base-content/70">{quiz.title}</li>
    </ul>
  </nav>

  <div class="mb-8">
    <QuizHeader {quiz} {showFeedback} onToggleFeedback={toggleFeedbackMode} />

    <QuizProgress
      questionsCount={questions.length}
      answeredCount={selectedChoices.size}
      {progress}
    />
  </div>

  {#if quizCompleted}
    <QuizResults
      {questions}
      {score}
      {selectedChoices}
      {timePerQuestion}
      onRetry={handleRetry}
    />
  {:else}
    <div class="card bg-base-100 shadow-xl">
      <QuestionCard
        question={currentQuestion}
        currentIndex={currentQuestionIndex}
        onChoiceSelect={handleChoiceSelect}
        selectedChoice={selectedChoices.get(currentQuestion.id)}
        {showFeedback}
        {incorrectChoices}
        onFlag={handleFlag}
        onBookmark={handleBookmark}
        isFlagged={flaggedQuestions.has(currentQuestion.id)}
        isBookmarked={bookmarkedQuestions.has(currentQuestion.id)}
      />

      <!-- Navigation -->
      <div class="card-body pt-0">
        <div class="flex justify-between mt-6">
          <button
            class="btn btn-outline {currentQuestionIndex === 0
              ? 'btn-disabled'
              : ''}"
            on:click={() => currentQuestionIndex--}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
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

        <QuestionNavigation
          {questions}
          currentIndex={currentQuestionIndex}
          onNavigate={navigateToQuestion}
          {flaggedQuestions}
          {bookmarkedQuestions}
          {selectedChoices}
        />

        {#if !isMobile}
          <div class="mt-4 text-sm text-base-content/70">
            <p>Keyboard shortcuts:</p>
            <ul class="list-disc list-inside">
              <li>Arrow keys: Navigate between questions</li>
              <li>1-4: Select answer choices</li>
              <li>F: Flag question</li>
              <li>B: Bookmark question</li>
            </ul>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
