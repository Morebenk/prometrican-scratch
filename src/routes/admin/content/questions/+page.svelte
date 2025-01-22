<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import type { Question } from "../../types.js";
  import QuestionChoice from "./QuestionChoice.svelte";

  type QuestionWithRelations = Question & {
    category: {
      name: string;
      subject: {
        name: string;
      };
    } | null;
    choices: {
      id: string;
      content: string;
      is_correct: boolean;
      explanation: string | null;
    }[];
  };

  let { data, form } = $props();
  let questions = data?.questions as QuestionWithRelations[];
  let formData = (form ?? {}) as { success?: boolean; error?: string };

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  let deletingQuestionId: string | null = $state(null);
  let expandedQuestionId: string | null = $state(null);

  function handleDelete(questionId: string) {
    if (confirm("Are you sure you want to delete this question?")) {
      deletingQuestionId = questionId;
      const formElement = document.getElementById(
        `delete-form-${questionId}`,
      ) as HTMLFormElement;
      if (formElement) {
        formElement.submit();
      }
    }
  }

  function toggleQuestion(questionId: string) {
    expandedQuestionId = expandedQuestionId === questionId ? null : questionId;
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Questions</h1>
    <a href="/admin/content/questions/new" class="btn btn-primary">
      New Question
    </a>
  </div>

  {#if formData.error}
    <div class="alert alert-error">
      {formData.error}
    </div>
  {/if}

  <div class="bg-base-100 shadow rounded-lg overflow-hidden">
    {#if !questions || questions.length === 0}
      <div class="p-6 text-center">
        <p class="text-gray-500">No questions found</p>
        <a href="/admin/content/questions/new" class="btn btn-ghost mt-2">
          Create your first question
        </a>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Question & Choices</th>
              <th>Category</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each questions as question}
              <tr>
                <td class="max-w-xl">
                  <div class="space-y-2">
                    <div class="flex gap-2 items-start">
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs mt-1"
                        on:click={() => toggleQuestion(question.id)}
                      >
                        {expandedQuestionId === question.id ? "−" : "+"}
                      </button>
                      <div>
                        <p class="font-medium">{question.content}</p>
                        <div class="flex gap-2 text-sm mt-1">
                          <span class="badge badge-outline">
                            {question.choices.length} choices
                          </span>
                          {#if question.explanation}
                            <span class="badge badge-outline badge-info">
                              Has explanation
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>

                    {#if expandedQuestionId === question.id}
                      <div class="pl-8 space-y-4 mt-4">
                        <div class="space-y-2">
                          {#each question.choices as choice}
                            <QuestionChoice
                              content={choice.content}
                              isCorrect={choice.is_correct}
                              explanation={choice.explanation}
                            />
                          {/each}
                        </div>

                        {#if question.explanation}
                          <div class="bg-base-200 p-3 rounded-lg">
                            <p class="text-sm font-medium">
                              Question Explanation:
                            </p>
                            <p class="text-sm mt-1">{question.explanation}</p>
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
                  {#if question.is_active}
                    <div class="badge badge-success gap-1">
                      <div
                        class="w-2 h-2 bg-success-content rounded-full"
                      ></div>
                      Active
                    </div>
                  {:else}
                    <div class="badge badge-warning gap-1">
                      <div
                        class="w-2 h-2 bg-warning-content rounded-full"
                      ></div>
                      Inactive
                    </div>
                  {/if}
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
                    <form
                      id="delete-form-{question.id}"
                      action="?/delete"
                      method="POST"
                      class="inline"
                    >
                      <input type="hidden" name="id" value={question.id} />
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm text-error"
                        disabled={deletingQuestionId === question.id}
                        on:click={() => handleDelete(question.id)}
                      >
                        {#if deletingQuestionId === question.id}
                          <span class="loading loading-spinner loading-xs"
                          ></span>
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
