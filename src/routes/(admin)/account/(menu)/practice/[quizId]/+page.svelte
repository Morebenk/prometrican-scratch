<script lang="ts">
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { getContext } from 'svelte';
    import type { Writable } from 'svelte/store';

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

    $: quiz = data.quiz;
    $: questions = data.questions;
    $: attempt = data.attempt;
    $: currentQuestion = questions[currentQuestionIndex];
    $: progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    $: isLastQuestion = currentQuestionIndex === questions.length - 1;

    onMount(() => {
        // Initialize bookmarks and incorrect responses
        questions.forEach(q => {
            if (q.isBookmarked) bookmarkedQuestions.add(q.id);
            if (q.incorrectChoices.length > 0) {
                incorrectChoices.set(q.id, q.incorrectChoices);
            }
        });

        // If there's a last answered question, start from there
        if (attempt.last_answered_question_id) {
            const index = questions.findIndex(q => q.id === attempt.last_answered_question_id);
            if (index !== -1) {
                currentQuestionIndex = index;
            }
        }
    });

    async function handleChoiceSelect(questionId: string, choiceId: string) {
        if (quizCompleted) return;
        selectedChoices.set(questionId, choiceId);
        selectedChoices = selectedChoices; // Trigger reactivity
    }

    async function toggleBookmark(questionId: string) {
        const isBookmarked = bookmarkedQuestions.has(questionId);
        try {
            const response = await fetch(`/api/bookmarks${isBookmarked ? `?questionId=${questionId}` : ''}`, {
                method: isBookmarked ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: !isBookmarked ? JSON.stringify({ questionId }) : undefined
            });

            if (response.ok) {
                if (isBookmarked) {
                    bookmarkedQuestions.delete(questionId);
                } else {
                    bookmarkedQuestions.add(questionId);
                }
                bookmarkedQuestions = bookmarkedQuestions; // Trigger reactivity
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    }

    async function updateAttempt(attemptData: any) {
        if (!attempt.id) return;
        
        const response = await fetch(`/api/quiz-attempts/${attempt.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attemptData)
        });
        return response.ok;
    }

    async function recordIncorrectResponse(questionId: string, choiceId: string) {
        try {
            await fetch('/api/incorrect-responses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId, choiceId })
            });
        } catch (error) {
            console.error('Error recording incorrect response:', error);
        }
    }

    async function handleNext() {
        if (!selectedChoices.has(currentQuestion.id)) return;
        
        const selectedChoiceId = selectedChoices.get(currentQuestion.id)!;
        const correctChoice = currentQuestion.choices.find(c => c.is_correct);
        
        // Record incorrect response if wrong answer
        if (correctChoice && selectedChoiceId !== correctChoice.id) {
            await recordIncorrectResponse(currentQuestion.id, selectedChoiceId);
            incorrectChoices.set(currentQuestion.id, 
                [...(incorrectChoices.get(currentQuestion.id) || []), selectedChoiceId]
            );
            incorrectChoices = incorrectChoices; // Trigger reactivity
        }

        // Update progress
        await updateAttempt({
            last_answered_question_id: currentQuestion.id
        });

        if (isLastQuestion) {
            await handleQuizSubmit();
        } else {
            currentQuestionIndex++;
        }
    }

    async function handleQuizSubmit() {
        if (isSubmitting) return;
        isSubmitting = true;

        try {
            // Calculate score
            let correctAnswers = 0;
            questions.forEach(question => {
                const selectedChoiceId = selectedChoices.get(question.id);
                const correctChoice = question.choices.find(c => c.is_correct);
                if (selectedChoiceId && correctChoice && selectedChoiceId === correctChoice.id) {
                    correctAnswers++;
                }
            });

            score = (correctAnswers / questions.length) * 100;

            // Update attempt
            await updateAttempt({
                completed_at: new Date().toISOString(),
                score
            });

            quizCompleted = true;

        } catch (error) {
            console.error('Error submitting quiz:', error);
        } finally {
            isSubmitting = false;
        }
    }

    function handleRetry() {
        goto(`/account/practice/${quiz.id}`, { replaceState: true });
    }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Quiz Header -->
    <div class="mb-8">
        <div class="flex justify-between items-start gap-4 mb-2">
            <h1 class="text-2xl font-bold">{quiz.title}</h1>
            <button
                class="btn btn-ghost btn-sm gap-2"
                on:click={() => toggleBookmark(currentQuestion.id)}
                disabled={quizCompleted}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill={bookmarkedQuestions.has(currentQuestion.id) ? 'currentColor' : 'none'}
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
                {bookmarkedQuestions.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}
            </button>
        </div>

        {#if quiz.description}
            <p class="text-base-content/70">{quiz.description}</p>
        {/if}
        
        <!-- Progress Bar -->
        <div class="w-full bg-base-200 rounded-full h-2.5 my-4">
            <div
                class="bg-primary h-2.5 rounded-full transition-all duration-300"
                style="width: {progress}%"
            ></div>
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
                    <a href="/account/practice" class="btn btn-outline">
                        Back to Practice
                    </a>
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
                        {@const isSelected = selectedChoices.get(currentQuestion.id) === choice.id}
                        {@const wasIncorrect = incorrectChoices.get(currentQuestion.id)?.includes(choice.id)}
                        <button
                            class="w-full btn btn-outline justify-start normal-case px-4 py-3 h-auto min-h-[3rem] {
                                isSelected ? 'btn-primary' : ''
                            } {
                                wasIncorrect ? 'btn-error' : ''
                            }"
                            on:click={() => handleChoiceSelect(currentQuestion.id, choice.id)}
                        >
                            {choice.content}
                        </button>
                    {/each}
                </div>

                <!-- Navigation -->
                <div class="flex justify-end mt-6">
                    <button
                        class="btn btn-primary {!selectedChoices.has(currentQuestion.id) ? 'btn-disabled' : ''}"
                        on:click={handleNext}
                        disabled={!selectedChoices.has(currentQuestion.id) || isSubmitting}
                    >
                        {#if isSubmitting}
                            <span class="loading loading-spinner"></span>
                        {/if}
                        {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
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
