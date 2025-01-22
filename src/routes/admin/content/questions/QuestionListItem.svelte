<script lang="ts">
  import type { Choice } from "../../types";

  type Quiz = {
    id: string;
    title: string;
  };

  let { question, onDelete } = $props<{
    question: {
      id: string;
      content: string;
      image_url: string | null;
      explanation: string | null;
      is_active: boolean;
      created_at: string;
      category: {
        name: string;
        subject: {
          name: string;
        };
      } | null;
      choices: Choice[];
      quiz_questions: {
        quiz: Quiz;
      }[];
    };
    onDelete: (id: string) => void;
  }>();

  let expanded = $state(false);
  let deleting = $state(false);

  function handleDelete() {
    if (confirm("Are you sure you want to delete this question?")) {
      deleting = true;
      onDelete(question.id);
    }
  }

  let quizzes = $derived(question.quiz_questions.map(qq => qq.quiz));
</script>

<tr>
  <td class="max-w-xl">
    <div class="space-y-2">
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-xs mt-1"
          on:click={() => (expanded = !expanded)}
        >
          {expanded ? "−" : "+"}
        </button>
        <div>
          <!-- Text and Badges -->
          <div class="flex flex-wrap gap-2 items-center">
            <p class="font-medium">{question.content}</p>
            {#if question.image_url}
              <span class="badge badge-info badge-outline">Has image</span>
            {/if}
            {#if question.explanation}
              <span class="badge badge-accent badge-outline">Has explanation</span>
            {/if}
            {#if quizzes.length > 0}
              <span class="badge badge-primary badge-outline">
                {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
              </span>
            {/if}
          </div>

          <!-- Image Preview -->
          {#if expanded && question.image_url}
            <div class="mt-2">
              <img
                src={question.image_url}
                alt="Question"
                class="max-h-32 rounded object-contain bg-base-200"
              />
            </div>
          {/if}
        </div>
      </div>

      {#if expanded}
        <div class="pl-8 space-y-4 mt-2">
          <!-- Choices -->
          <div class="space-y-2">
            {#each question.choices as choice}
              <div
                class="p-3 rounded-lg border"
                class:bg-success/10={choice.is_correct}
                class:border-success={choice.is_correct}
                class:border-base-300={!choice.is_correct}
              >
                <div class="flex items-start gap-2">
                  <span
                    class="mt-1"
                    class:text-success={choice.is_correct}
                  >
                    {choice.is_correct ? "✓" : "○"}
                  </span>
                  <div class="space-y-1">
                    <p>{choice.content}</p>
                    {#if choice.explanation}
                      <p class="text-sm text-base-content/60">
                        Explanation: {choice.explanation}
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Question Explanation -->
          {#if question.explanation}
            <div class="bg-base-200 p-3 rounded-lg">
              <p class="text-sm font-medium">Question Explanation:</p>
              <p class="text-sm mt-1">{question.explanation}</p>
            </div>
          {/if}

          <!-- Linked Quizzes -->
          {#if quizzes.length > 0}
            <div class="bg-base-200 p-3 rounded-lg">
              <p class="text-sm font-medium mb-2">Used in Quizzes:</p>
              <div class="flex flex-wrap gap-2">
                {#each quizzes as quiz}
                  <a
                    href="/admin/content/quizzes/{quiz.id}/edit"
                    class="badge badge-primary"
                  >
                    {quiz.title}
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </td>
  <td>
    {#if question.category}
      {question.category.name}
    {:else}
      <span class="text-warning">Uncategorized</span>
    {/if}
  </td>
  <td>
    {#if question.category?.subject}
      {question.category.subject.name}
    {:else}
      -
    {/if}
  </td>
  <td>
    <span 
      class="badge gap-1"
      class:badge-success={question.is_active}
      class:badge-warning={!question.is_active}
    >
      <span 
        class="w-2 h-2 rounded-full"
        class:bg-success-content={question.is_active}
        class:bg-warning-content={!question.is_active}
      />
      {question.is_active ? "Active" : "Inactive"}
    </span>
  </td>
  <td>
    {new Date(question.created_at || "").toLocaleDateString()}
  </td>
  <td>
    <div class="flex gap-2">
      <a
        href="/admin/content/questions/{question.id}/edit"
        class="btn btn-ghost btn-sm"
      >
        Edit
      </a>
      <button
        type="button"
        class="btn btn-ghost btn-sm text-error"
        disabled={deleting || quizzes.length > 0}
        on:click={handleDelete}
      >
        {#if deleting}
          <span class="loading loading-spinner loading-xs" />
        {/if}
        {#if quizzes.length > 0}
          <span class="tooltip tooltip-left" data-tip="Cannot delete question used in quizzes">
            Delete
          </span>
        {:else}
          Delete
        {/if}
      </button>
    </div>
  </td>
</tr>