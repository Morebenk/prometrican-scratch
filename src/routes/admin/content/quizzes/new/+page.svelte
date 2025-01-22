<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  type Subject = {
    id: string;
    name: string;
    categories: {
      id: string;
      name: string;
    }[];
  };

  type FormData = {
    success?: boolean;
    error?: string;
    values?: {
      category_id?: string;
      title?: string;
      description?: string;
      is_active?: boolean;
    };
    errors?: {
      category_id?: string;
      title?: string;
      description?: string;
    };
  };

  let { data, form } = $props();
  let subjects = data?.subjects as Subject[];
  let formData = (form ?? {}) as FormData;

  let submitting = $state(false);
  let selectedSubject = $state("");

  // Filter categories based on selected subject
  let categories = $derived(
    selectedSubject
      ? subjects.find((s: Subject) => s.id === selectedSubject)?.categories ||
          []
      : [],
  );

  function handleSubmit() {
    submitting = true;
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/content/quizzes" class="btn btn-ghost btn-sm">
      ← Back to Quizzes
    </a>
    <h1 class="text-2xl font-bold">New Quiz</h1>
  </div>

  <form method="POST" class="card bg-base-100 shadow" on:submit={handleSubmit}>
    <div class="card-body">
      {#if formData.error}
        <div class="alert alert-error mb-4">
          {formData.error}
        </div>
      {/if}

      <!-- Subject and Category Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Subject</span>
          </label>
          <select
            class="select select-bordered"
            bind:value={selectedSubject}
            disabled={submitting}
            required
          >
            <option value="">Select a subject</option>
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>

        <div class="form-control">
          <label for="category_id" class="label">
            <span class="label-text">Category</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            class="select select-bordered"
            class:select-error={formData.errors?.category_id}
            value={formData.values?.category_id ?? ""}
            disabled={submitting || !selectedSubject}
            required
          >
            <option value="">Select a category</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
          {#if formData.errors?.category_id}
            <label class="label">
              <span class="label-text-alt text-error"
                >{formData.errors.category_id}</span
              >
            </label>
          {/if}
        </div>
      </div>

      <!-- Quiz Title -->
      <div class="form-control">
        <label for="title" class="label">
          <span class="label-text">Title</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          class="input input-bordered"
          class:input-error={formData.errors?.title}
          value={formData.values?.title ?? ""}
          disabled={submitting}
          placeholder="Enter quiz title..."
          required
        />
        {#if formData.errors?.title}
          <label class="label">
            <span class="label-text-alt text-error"
              >{formData.errors.title}</span
            >
          </label>
        {/if}
      </div>

      <!-- Description -->
      <div class="form-control">
        <label for="description" class="label">
          <span class="label-text">Description (Optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered h-24"
          class:textarea-error={formData.errors?.description}
          value={formData.values?.description ?? ""}
          disabled={submitting}
          placeholder="Enter quiz description..."
        />
        {#if formData.errors?.description}
          <label class="label">
            <span class="label-text-alt text-error"
              >{formData.errors.description}</span
            >
          </label>
        {/if}
      </div>

      <!-- Active Status -->
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Active</span>
          <input
            type="checkbox"
            name="is_active"
            class="toggle"
            checked={formData.values?.is_active ?? true}
            value="true"
            disabled={submitting}
          />
        </label>
      </div>

      <div class="card-actions justify-end mt-4">
        <a
          href="/admin/content/quizzes"
          class="btn btn-ghost"
          class:hidden={submitting}
        >
          Cancel
        </a>
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {#if submitting}
            <span class="loading loading-spinner" />
            Creating...
          {:else}
            Create Quiz
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>
