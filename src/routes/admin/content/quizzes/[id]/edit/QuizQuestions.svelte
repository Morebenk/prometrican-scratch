<script lang="ts">
  import type { DbQuestion } from "../../../../types";
  import type { Database } from "../../../../../../DatabaseDefinitions";

  type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"] & {
    question: DbQuestion & {
      choices: {
        id: string;
        content: string;
        is_correct: boolean;
      }[];
    };
  };

  interface Props {
    quizId: string;
    categoryId: string;
    questions?: QuizQuestion[];
    availableQuestions?: DbQuestion[];
  }

  let {
    quizId,
    categoryId,
    questions = [],
    availableQuestions = [],
  } = $props();

  let loading = $state(false);
  let searchQuery = $state("");
  let showAddQuestionModal = $state(false);

  const availableQuestionsInCategory = $derived(
    availableQuestions.filter((q: DbQuestion) => q.category_id === categoryId),
  );

  const filteredQuestions = $derived(
    availableQuestionsInCategory.filter(
      (q: DbQuestion) =>
        !questions.some(
          (existing: QuizQuestion) => existing.question.id === q.id,
        ) &&
        (searchQuery === "" ||
          q.content.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  );

  async function handleAddQuestion(questionId: string) {
    loading = true;

    try {
      const response = await fetch(`/api/quiz-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: quizId,
          question_id: questionId,
          order: questions.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add question");
      }

      // Refresh the page to show updated questions
      window.location.reload();
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    } finally {
      loading = false;
      showAddQuestionModal = false;
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (
      !confirm("Are you sure you want to remove this question from the quiz?")
    ) {
      return;
    }

    loading = true;

    try {
      const response = await fetch(
        `/api/quiz-questions/${quizId}/${questionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove question");
      }

      // Refresh the page to show updated questions
      window.location.reload();
    } catch (error) {
      console.error("Error removing question:", error);
      alert("Failed to remove question. Please try again.");
    } finally {
      loading = false;
    }
  }

  async function handleReorderQuestions(
    event: CustomEvent<{ oldIndex: number; newIndex: number }>,
  ) {
    const { oldIndex, newIndex } = event.detail;

    loading = true;

    try {
      const response = await fetch(`/api/quiz-questions/${quizId}/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_index: oldIndex,
          new_index: newIndex,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder questions");
      }

      // Refresh the page to show updated order
      window.location.reload();
    } catch (error) {
      console.error("Error reordering questions:", error);
      alert("Failed to reorder questions. Please try again.");
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h2 class="text-xl font-semibold">Quiz Questions</h2>
    <button
      class="btn btn-primary btn-sm"
      on:click={() => (showAddQuestionModal = true)}
      disabled={loading}
    >
      Add Question
    </button>
  </div>

  <!-- Questions List -->
  {#if questions.length === 0}
    <div class="text-center py-8 bg-base-200 rounded-lg">
      <p class="text-base-content/70">No questions added to this quiz yet.</p>
      <button
        class="btn btn-ghost btn-sm mt-2"
        on:click={() => (showAddQuestionModal = true)}
        disabled={loading}
      >
        Add your first question
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each questions as quizQuestion, index}
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="badge">{index + 1}</span>
                  <h3 class="font-medium">{quizQuestion.question.content}</h3>
                </div>

                <div class="grid grid-cols-2 gap-2 ml-8">
                  {#each quizQuestion.question.choices as choice}
                    <div class="flex items-center gap-2">
                      <span
                        class={choice.is_correct
                          ? "text-success"
                          : "text-base-content/70"}
                      >
                        {choice.is_correct ? "✓" : "•"}
                      </span>
                      <span class={choice.is_correct ? "font-medium" : ""}>
                        {choice.content}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  class="btn btn-ghost btn-sm"
                  disabled={index === 0 || loading}
                  on:click={() =>
                    handleReorderQuestions(
                      new CustomEvent("reorder", {
                        detail: { oldIndex: index, newIndex: index - 1 },
                      }),
                    )}
                >
                  ↑
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  disabled={index === questions.length - 1 || loading}
                  on:click={() =>
                    handleReorderQuestions(
                      new CustomEvent("reorder", {
                        detail: { oldIndex: index, newIndex: index + 1 },
                      }),
                    )}
                >
                  ↓
                </button>
                <button
                  class="btn btn-ghost btn-sm text-error"
                  on:click={() =>
                    handleRemoveQuestion(quizQuestion.question_id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add Question Modal -->
  {#if showAddQuestionModal}
    <div class="modal modal-open">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-4">Add Question to Quiz</h3>

        <div class="form-control mb-4">
          <input
            type="text"
            placeholder="Search questions..."
            class="input input-bordered"
            bind:value={searchQuery}
          />
        </div>

        <div class="space-y-4 max-h-96 overflow-y-auto">
          {#if filteredQuestions.length === 0}
            <div class="text-center py-4">
              <p class="text-base-content/70">
                No matching questions found in this category.
              </p>
            </div>
          {:else}
            {#each filteredQuestions as question}
              <div class="card bg-base-200">
                <div class="card-body p-4">
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex-1">
                      <p class="font-medium mb-2">{question.content}</p>
                      <div class="grid grid-cols-2 gap-2">
                        {#each question.choices as choice}
                          <div class="flex items-center gap-2">
                            <span
                              class={choice.is_correct
                                ? "text-success"
                                : "text-base-content/70"}
                            >
                              {choice.is_correct ? "✓" : "•"}
                            </span>
                            <span
                              class={choice.is_correct ? "font-medium" : ""}
                            >
                              {choice.content}
                            </span>
                          </div>
                        {/each}
                      </div>
                    </div>
                    <button
                      class="btn btn-primary btn-sm"
                      on:click={() => handleAddQuestion(question.id)}
                      disabled={loading}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <div class="modal-action">
          <button
            class="btn"
            on:click={() => (showAddQuestionModal = false)}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
      <div
        class="modal-backdrop"
        on:click={() => (showAddQuestionModal = false)}
      ></div>
    </div>
  {/if}
</div>
