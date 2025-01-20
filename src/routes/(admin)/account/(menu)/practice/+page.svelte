<script lang="ts">
  import { onMount } from "svelte"
  import { selectedSubject } from "./stores/subject-store"
  import type { PageData } from "./$types"
  import { goto } from "$app/navigation"
  import { getContext } from "svelte"
  import type { Writable } from "svelte/store"

  export let data: PageData

  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("practice")

  $: subjects = data.subjects
  $: categories = data.categories
  $: activeSubjectId = data.activeSubjectId

  onMount(() => {
    // Initialize selected subject from URL or stored value
    if (activeSubjectId) {
      selectedSubject.setSubject(activeSubjectId)
    }
  })

  function handleSubjectChange(event: Event) {
    const select = event.target as HTMLSelectElement
    const newSubjectId = select.value
    selectedSubject.setSubject(newSubjectId)
    goto(`?subject=${newSubjectId}`, { keepFocus: true })
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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each categories as category}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title flex justify-between items-center">
              {category.name}
              <div class="badge badge-primary">
                {category.completion.toFixed(0)}% Complete
              </div>
            </h2>

            {#if category.description}
              <p class="text-sm text-base-content/70 mb-4">
                {category.description}
              </p>
            {/if}

            <div class="space-y-4">
              {#each category.quizzes as quiz}
                <div class="bg-base-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium">{quiz.title}</h3>
                    <div class="badge badge-sm">
                      {quiz.completion.toFixed(0)}%
                    </div>
                  </div>

                  {#if quiz.description}
                    <p class="text-sm text-base-content/70 mb-2">
                      {quiz.description}
                    </p>
                  {/if}

                  <div class="flex justify-between items-center mt-2">
                    <span class="text-sm">
                      {quiz.completed_questions} / {quiz.total_questions} Questions
                    </span>
                    <a
                      href="/account/practice/{quiz.id}"
                      class="btn btn-primary btn-sm"
                    >
                      {quiz.completed_questions > 0 ? "Continue" : "Start"}
                    </a>
                  </div>

                  <progress
                    class="progress progress-primary w-full mt-2"
                    value={quiz.completion}
                    max="100"
                  ></progress>
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

  /* Custom progress bar styling */
  progress {
    height: 0.5rem;
    border-radius: 999px;
  }

  progress::-webkit-progress-bar {
    background-color: hsl(var(--b2));
    border-radius: 999px;
  }

  progress::-webkit-progress-value {
    background-color: hsl(var(--p));
    border-radius: 999px;
    transition: width 0.3s ease-in-out;
  }
</style>
