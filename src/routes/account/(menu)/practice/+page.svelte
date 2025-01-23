<script lang="ts">
  import { onMount } from "svelte";
  import { selectedSubject } from "./stores/subject-store";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { QuizStatus } from "./types";

  export let data: PageData;

  let adminSection: Writable<string> = getContext("adminSection");
  adminSection.set("practice");

  $: subjects = data.subjects;
  $: categories = data.categories;
  $: activeSubjectId = data.activeSubjectId;

  onMount(() => {
    if (activeSubjectId) {
      selectedSubject.setSubject(activeSubjectId);
    }
  });

  function handleSubjectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    selectedSubject.setSubject(select.value);
    goto(`?subject=${select.value}`, { keepFocus: true });
  }

  function getQuizActionButton(quiz: { id: string; status: QuizStatus }) {
    switch (quiz.status) {
      case QuizStatus.COMPLETED:
        return {
          href: `/account/practice/${quiz.id}?restart=true`,
          label: "Restart Quiz",
          class: "btn-secondary",
        };
      case QuizStatus.IN_PROGRESS:
        return {
          href: `/account/practice/${quiz.id}`,
          label: "Continue",
          class: "btn-primary",
        };
      default:
        return {
          href: `/account/practice/${quiz.id}`,
          label: "Start Quiz",
          class: "btn-primary",
        };
    }
  }

  function getQuizStatusBadge(status: QuizStatus) {
    switch (status) {
      case QuizStatus.COMPLETED:
        return {
          class: "badge-success",
          label: "Completed",
        };
      case QuizStatus.IN_PROGRESS:
        return {
          class: "badge-warning",
          label: "In Progress",
        };
      default:
        return {
          class: "badge-ghost",
          label: "Not Started",
        };
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Subject Selector -->
  <div class="flex flex-col gap-6 mb-8">
    <h1 class="text-2xl font-bold">Practice Quizzes</h1>
    <div class="form-control w-full max-w-xs">
      <label class="label" for="subject-select">
        <span class="label-text">Select Subject</span>
      </label>
      <select
        class="select select-bordered w-full"
        id="subject-select"
        value={activeSubjectId ?? ""}
        on:change={handleSubjectChange}
      >
        <option value="" disabled>Choose a subject...</option>
        {#each subjects as subject}
          <option value={subject.id}>{subject.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Categories and Quizzes -->
  {#if categories.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
      {#each categories as category}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex flex-wrap justify-between items-start gap-2 mb-4">
              <h2 class="card-title">{category.name}</h2>
              <div class="badge badge-primary whitespace-nowrap">
                {category.completion.toFixed(0)}% Complete
              </div>
            </div>

            {#if category.description}
              <p class="text-sm text-base-content/70 mb-4">
                {category.description}
              </p>
            {/if}

            <div class="space-y-4">
              {#each category.quizzes as quiz}
                {@const statusBadge = getQuizStatusBadge(quiz.status)}
                {@const actionButton = getQuizActionButton(quiz)}
                <div class="bg-base-200 rounded-lg p-4">
                  <div
                    class="flex flex-wrap justify-between items-start gap-2 mb-2"
                  >
                    <h3 class="font-medium flex-grow">{quiz.title}</h3>
                    <div class="badge {statusBadge.class} badge-sm">
                      {statusBadge.label}
                    </div>
                  </div>

                  {#if quiz.description}
                    <p class="text-sm text-base-content/70 mb-2">
                      {quiz.description}
                    </p>
                  {/if}

                  <div
                    class="flex flex-wrap justify-between items-center gap-2 mt-2"
                  >
                    <span class="text-sm whitespace-nowrap">
                      {quiz.total_questions} Questions
                    </span>
                    <a
                      href={actionButton.href}
                      class="btn btn-sm ml-auto {actionButton.class}"
                    >
                      {actionButton.label}
                    </a>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if activeSubjectId}
    <div class="alert">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="stroke-info shrink-0 w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>No quizzes available for this subject yet.</span>
    </div>
  {/if}
</div>

<style>
  /* Smooth transitions */
  .card {
    transition: transform 0.2s ease-in-out;
  }

  .card:hover {
    transform: translateY(-2px);
  }

  /* Ensure consistent badge width */
  .badge {
    min-width: max-content;
  }
</style>
