<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import type { Quiz } from "../../types.js";

  type QuizWithRelations = Quiz & {
    category: {
      name: string;
      subject: {
        name: string;
      };
    };
    quiz_attempts: { count: number }[];
  };

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  let { data, form } = $props();
  let quizzes = data?.quizzes as QuizWithRelations[];
  let formData = (form ?? {}) as { success?: boolean; error?: string };

  let deletingQuizId: string | null = $state(null);

  function handleDelete(quizId: string) {
    if (confirm("Are you sure you want to delete this quiz?")) {
      deletingQuizId = quizId;
      const formElement = document.getElementById(
        `delete-form-${quizId}`,
      ) as HTMLFormElement;
      if (formElement) {
        formElement.submit();
      }
    }
  }

  function getAttemptCount(quiz: QuizWithRelations): number {
    return quiz.quiz_attempts?.[0]?.count || 0;
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Quizzes</h1>
    <a href="/admin/content/quizzes/new" class="btn btn-primary"> New Quiz </a>
  </div>

  {#if formData.error}
    <div class="alert alert-error">
      {formData.error}
    </div>
  {/if}

  <div class="bg-base-100 shadow rounded-lg overflow-hidden">
    {#if !quizzes || quizzes.length === 0}
      <div class="p-6 text-center">
        <p class="text-gray-500">No quizzes found</p>
        <a href="/admin/content/quizzes/new" class="btn btn-ghost mt-2">
          Create your first quiz
        </a>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Attempts</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each quizzes as quiz}
              <tr>
                <td>
                  <div class="font-medium">{quiz.title}</div>
                  {#if quiz.description}
                    <div class="text-sm text-gray-500 truncate max-w-xs">
                      {quiz.description}
                    </div>
                  {/if}
                </td>
                <td>{quiz.category.name}</td>
                <td>{quiz.category.subject.name}</td>
                <td>
                  <span
                    class="badge"
                    class:badge-accent={getAttemptCount(quiz) > 0}
                  >
                    {getAttemptCount(quiz)}
                  </span>
                </td>
                <td>
                  {#if quiz.is_active}
                    <span class="badge badge-success">Active</span>
                  {:else}
                    <span class="badge badge-warning">Inactive</span>
                  {/if}
                </td>
                <td>
                  {new Date(quiz.created_at || "").toLocaleDateString()}
                </td>
                <td>
                  <div class="flex gap-2">
                    <a
                      href="/admin/content/quizzes/{quiz.id}/edit"
                      class="btn btn-ghost btn-sm"
                    >
                      Edit
                    </a>
                    <form
                      id="delete-form-{quiz.id}"
                      action="?/delete"
                      method="POST"
                      class="inline"
                    >
                      <input type="hidden" name="id" value={quiz.id} />
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm text-error"
                        disabled={deletingQuizId === quiz.id ||
                          getAttemptCount(quiz) > 0}
                        on:click={() => handleDelete(quiz.id)}
                      >
                        {#if deletingQuizId === quiz.id}
                          <span class="loading loading-spinner loading-xs" />
                        {/if}
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
