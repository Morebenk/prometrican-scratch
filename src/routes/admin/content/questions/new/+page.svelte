<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ImageUpload from "../ImageUpload.svelte";

  type Subject = {
    id: string;
    name: string;
    categories: {
      id: string;
      name: string;
    }[];
  };

  type Quiz = {
    id: string;
    title: string;
    category: {
      id: string;
      name: string;
      subject: {
        id: string;
        name: string;
      };
    };
  };

  type Choice = {
    content: string;
    is_correct: boolean;
    explanation?: string;
  };

  type FormData = {
    success?: boolean;
    error?: string;
    values?: {
      category_id?: string;
      quiz_ids?: string[];
      content?: string;
      image_url?: string;
      explanation?: string;
      is_active?: boolean;
      choices?: Choice[];
    };
    errors?: {
      category_id?: string;
      quiz_ids?: string;
      content?: string;
      explanation?: string;
      choices?: string;
    };
  };

  let { data, form } = $props();
  let subjects = data?.subjects as Subject[];
  let quizzes = data?.quizzes as Quiz[];
  let formData = (form ?? {}) as FormData;

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  let submitting = $state(false);
  let selectedSubject = $state(
    formData.values?.category_id
      ? subjects.find((s) =>
          s.categories.some((c) => c.id === formData.values?.category_id),
        )?.id
      : "",
  );
  let selectedCategoryId = $state(formData.values?.category_id ?? "");
  let selectedQuizIds = $state<string[]>(formData.values?.quiz_ids ?? []);
  let imageUrl = $state(formData.values?.image_url ?? null);
  let choices = $state<Choice[]>(
    formData.values?.choices ?? [
      { content: "", is_correct: true, explanation: "" },
      { content: "", is_correct: false, explanation: "" },
    ],
  );
  let addAnother = $state(false);

  // Filter categories based on selected subject
  let categories = $derived(
    selectedSubject
      ? subjects.find((s: Subject) => s.id === selectedSubject)?.categories ||
          []
      : [],
  );

  // Filter quizzes based on selected category
  let availableQuizzes = $derived(
    selectedCategoryId
      ? quizzes.filter((q) => q.category.id === selectedCategoryId)
      : [],
  );

  function addChoice() {
    choices = [...choices, { content: "", is_correct: false, explanation: "" }];
  }

  function removeChoice(index: number) {
    choices = choices.filter((_, i) => i !== index);
  }

  function setCorrectChoice(index: number) {
    choices = choices.map((choice, i) => ({
      ...choice,
      is_correct: i === index,
    }));
  }

  function handleCategoryChange(event: Event) {
    const newCategoryId = (event.target as HTMLSelectElement).value;
    selectedCategoryId = newCategoryId;
    // Clear quiz selection if category changes
    if (selectedQuizIds.length > 0) {
      selectedQuizIds = [];
    }
  }

  function handleSubmit() {
    submitting = true;
    // Add choices to form data
    const choicesElement = document.createElement("input");
    choicesElement.type = "hidden";
    choicesElement.name = "choices";
    choicesElement.value = JSON.stringify(choices);
    document.querySelector("form")?.appendChild(choicesElement);

    // Add quiz IDs to form data
    const quizIdsElement = document.createElement("input");
    quizIdsElement.type = "hidden";
    quizIdsElement.name = "quiz_ids";
    quizIdsElement.value = JSON.stringify(selectedQuizIds);
    document.querySelector("form")?.appendChild(quizIdsElement);

    // Add image URL to form data
    const imageElement = document.createElement("input");
    imageElement.type = "hidden";
    imageElement.name = "image_url";
    imageElement.value = imageUrl || "";
    document.querySelector("form")?.appendChild(imageElement);

    // Add another flag
    if (addAnother) {
      const addAnotherElement = document.createElement("input");
      addAnotherElement.type = "hidden";
      addAnotherElement.name = "add_another";
      addAnotherElement.value = "true";
      document.querySelector("form")?.appendChild(addAnotherElement);
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/content/questions" class="btn btn-ghost btn-sm">
      ← Back to Questions
    </a>
    <h1 class="text-2xl font-bold">New Question</h1>
  </div>

  <form method="POST" class="card bg-base-100 shadow" on:submit={handleSubmit}>
    <div class="card-body space-y-8">
      {#if formData.error}
        <div class="alert alert-error mb-4">
          {formData.error}
        </div>
      {/if}

      <!-- Organization Section -->
      <div class="border rounded-lg p-6 space-y-6">
        <h2 class="text-lg font-medium">Organization</h2>

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
              value={selectedCategoryId}
              disabled={submitting || !selectedSubject}
              required
              on:change={handleCategoryChange}
            >
              <option value="">Select a category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
            {#if formData.errors?.category_id}
              <label class="label">
                <span class="label-text-alt text-error">
                  {formData.errors.category_id}
                </span>
              </label>
            {/if}
          </div>
        </div>

        <!-- Quiz Selection -->
        {#if selectedCategoryId}
          <div class="form-control">
            <label class="label">
              <span class="label-text">Add to Quizzes (Optional)</span>
            </label>
            <div class="flex flex-wrap gap-2">
              {#each availableQuizzes as quiz}
                <label
                  class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-base-200"
                >
                  <input
                    type="checkbox"
                    class="checkbox"
                    value={quiz.id}
                    checked={selectedQuizIds.includes(quiz.id)}
                    on:change={(e) => {
                      if (e.currentTarget.checked) {
                        selectedQuizIds = [...selectedQuizIds, quiz.id];
                      } else {
                        selectedQuizIds = selectedQuizIds.filter(
                          (id) => id !== quiz.id,
                        );
                      }
                    }}
                    disabled={submitting}
                  />
                  <span>{quiz.title}</span>
                </label>
              {/each}
            </div>
            {#if formData.errors?.quiz_ids}
              <label class="label">
                <span class="label-text-alt text-error">
                  {formData.errors.quiz_ids}
                </span>
              </label>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Question Content Section -->
      <div class="border rounded-lg p-6 space-y-6">
        <h2 class="text-lg font-medium">Question Content</h2>

        <!-- Question Text -->
        <div class="form-control">
          <label for="content" class="label">
            <span class="label-text">Question Text</span>
          </label>
          <textarea
            id="content"
            name="content"
            class="textarea textarea-bordered h-32"
            class:textarea-error={formData.errors?.content}
            value={formData.values?.content ?? ""}
            disabled={submitting}
            placeholder="Enter your question content here..."
            required
          />
          {#if formData.errors?.content}
            <label class="label">
              <span class="label-text-alt text-error">
                {formData.errors.content}
              </span>
            </label>
          {/if}
        </div>

        <!-- Question Image -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Question Image (Optional)</span>
          </label>
          <ImageUpload bind:imageUrl disabled={submitting} />
        </div>

        <!-- Question Explanation -->
        <div class="form-control">
          <label for="explanation" class="label">
            <span class="label-text">Question Explanation (Optional)</span>
          </label>
          <textarea
            id="explanation"
            name="explanation"
            class="textarea textarea-bordered h-24"
            class:textarea-error={formData.errors?.explanation}
            value={formData.values?.explanation ?? ""}
            disabled={submitting}
            placeholder="Enter an explanation that will be shown after answering..."
          />
          {#if formData.errors?.explanation}
            <label class="label">
              <span class="label-text-alt text-error">
                {formData.errors.explanation}
              </span>
            </label>
          {/if}
        </div>
      </div>

      <!-- Choices Section -->
      <div class="border rounded-lg p-6 space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-medium">Answer Choices</h2>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            on:click={addChoice}
            disabled={submitting || choices.length >= 6}
          >
            Add Choice
          </button>
        </div>

        {#if formData.errors?.choices}
          <div class="alert alert-error">
            {formData.errors.choices}
          </div>
        {/if}

        <div class="space-y-4">
          {#each choices as choice, i}
            <div class="card bg-base-200">
              <div class="card-body">
                <div class="flex gap-4 items-start">
                  <label class="cursor-pointer">
                    <input
                      type="radio"
                      class="radio"
                      name="correct_choice"
                      checked={choice.is_correct}
                      on:change={() => setCorrectChoice(i)}
                      disabled={submitting}
                    />
                  </label>
                  <div class="flex-1 space-y-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Choice Content</span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered"
                        bind:value={choice.content}
                        placeholder="Enter choice content..."
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">
                          Choice Explanation (Optional)
                        </span>
                      </label>
                      <textarea
                        class="textarea textarea-bordered"
                        bind:value={choice.explanation}
                        placeholder="Enter an explanation for this choice..."
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  {#if choices.length > 2}
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm text-error"
                      disabled={submitting}
                      on:click={() => removeChoice(i)}
                    >
                      ✕
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Settings Section -->
      <div class="border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-medium">Settings</h2>

        <div class="flex flex-wrap gap-6">
          <!-- Active Status -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              class="toggle"
              checked={formData.values?.is_active ?? true}
              value="true"
              disabled={submitting}
            />
            <span>Active</span>
          </label>

          <!-- Add Another -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={addAnother}
              class="checkbox"
              disabled={submitting}
            />
            <span>Create another</span>
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="card-actions justify-end mt-4">
        <a
          href="/admin/content/questions"
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
            Create Question
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>
