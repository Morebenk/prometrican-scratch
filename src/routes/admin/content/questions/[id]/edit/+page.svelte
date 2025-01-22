<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import QuestionChoice from "../../QuestionChoice.svelte";

  type Subject = {
    id: string;
    name: string;
    categories: {
      id: string;
      name: string;
    }[];
  };

  type Choice = {
    id?: string;
    content: string;
    is_correct: boolean;
    explanation?: string | null;
  };

  type Question = {
    id: string;
    content: string;
    explanation: string | null;
    image_url: string | null;
    is_active: boolean;
    category: {
      id: string;
      name: string;
      subject: {
        id: string;
        name: string;
      };
    };
    choices: Choice[];
  };

  type FormData = {
    success?: boolean;
    error?: string;
    values?: {
      category_id?: string;
      content?: string;
      image_url?: string;
      explanation?: string;
      is_active?: boolean;
      choices?: Choice[];
    };
    errors?: {
      category_id?: string;
      content?: string;
      explanation?: string;
      choices?: string;
    };
  };

  let { data, form } = $props();
  let subjects = data?.subjects as Subject[];
  let question = data?.question as Question;
  let formData = (form ?? {}) as FormData;

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  let submitting = $state(false);
  let selectedSubject = $state(question.category.subject.id);
  let choices = $state<Choice[]>(
    formData.values?.choices ??
      question.choices.map((c) => ({
        id: c.id,
        content: c.content,
        is_correct: c.is_correct,
        explanation: c.explanation,
      })),
  );
  let deletedChoiceIds = $state<string[]>([]);

  // Filter categories based on selected subject
  let categories = $derived(
    selectedSubject
      ? subjects.find((s: Subject) => s.id === selectedSubject)?.categories ||
          []
      : [],
  );

  function addChoice() {
    choices = [...choices, { content: "", is_correct: false, explanation: "" }];
  }

  function removeChoice(index: number) {
    const choice = choices[index];
    if (choice.id) {
      deletedChoiceIds = [...deletedChoiceIds, choice.id];
    }
    choices = choices.filter((_, i) => i !== index);
  }

  function setCorrectChoice(index: number) {
    choices = choices.map((choice, i) => ({
      ...choice,
      is_correct: i === index,
    }));
  }

  function moveChoice(fromIndex: number, toIndex: number) {
    const updatedChoices = [...choices];
    const [removed] = updatedChoices.splice(fromIndex, 1);
    updatedChoices.splice(toIndex, 0, removed);
    choices = updatedChoices;
  }

  function handleSubmit() {
    submitting = true;
    // Add choices and deletedChoiceIds to form data
    const formElement = document.createElement("input");
    formElement.type = "hidden";
    formElement.name = "choices";
    formElement.value = JSON.stringify(choices);
    document.querySelector("form")?.appendChild(formElement);

    const deletedElement = document.createElement("input");
    deletedElement.type = "hidden";
    deletedElement.name = "deletedChoiceIds";
    deletedElement.value = JSON.stringify(deletedChoiceIds);
    document.querySelector("form")?.appendChild(deletedElement);
  }

  function handleDragStart(e: DragEvent, index: number) {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    const draggedIndex = parseInt(
      e.dataTransfer?.getData("text/plain") || "-1",
    );
    if (draggedIndex !== -1 && draggedIndex !== index) {
      moveChoice(draggedIndex, index);
    }
  }
</script>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/content/questions" class="btn btn-ghost btn-sm">
      ← Back to Questions
    </a>
    <h1 class="text-2xl font-bold">Edit Question</h1>
  </div>

  <form method="POST" class="card bg-base-100 shadow" on:submit={handleSubmit}>
    <div class="card-body space-y-6">
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
            value={formData.values?.category_id ?? question.category.id}
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

      <!-- Question Content -->
      <div class="form-control">
        <label for="content" class="label">
          <span class="label-text">Question Content</span>
        </label>
        <textarea
          id="content"
          name="content"
          class="textarea textarea-bordered h-32"
          class:textarea-error={formData.errors?.content}
          value={formData.values?.content ?? question.content}
          disabled={submitting}
          placeholder="Enter your question content here..."
          required
        />
        {#if formData.errors?.content}
          <label class="label">
            <span class="label-text-alt text-error"
              >{formData.errors.content}</span
            >
          </label>
        {/if}
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
          value={formData.values?.explanation ?? question.explanation ?? ""}
          disabled={submitting}
          placeholder="Enter an explanation that will be shown after answering..."
        />
        {#if formData.errors?.explanation}
          <label class="label">
            <span class="label-text-alt text-error"
              >{formData.errors.explanation}</span
            >
          </label>
        {/if}
      </div>

      <!-- Choices -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <label class="text-lg font-medium">Answer Choices</label>
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
            <div
              class="card bg-base-200"
              draggable={!submitting}
              on:dragstart={(e) => handleDragStart(e, i)}
              on:dragover={(e) => handleDragOver(e, i)}
            >
              <div class="card-body">
                <div class="flex gap-4 items-start">
                  <div class="flex flex-col items-center gap-2">
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
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs"
                      disabled={submitting}
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </button>
                  </div>
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
                        <span class="label-text"
                          >Choice Explanation (Optional)</span
                        >
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

      <!-- Active Status -->
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">Active</span>
          <input
            type="checkbox"
            name="is_active"
            class="toggle"
            checked={formData.values?.is_active ?? question.is_active}
            value="true"
            disabled={submitting}
          />
        </label>
      </div>

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
            Saving...
          {:else}
            Save Changes
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>
