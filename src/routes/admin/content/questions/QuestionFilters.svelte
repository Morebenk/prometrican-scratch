<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

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

  let { subjects, quizzes, currentFilters } = $props<{
    subjects: Subject[];
    quizzes: Quiz[];
    currentFilters: {
      subject_id: string | null;
      category_id: string | null;
      quiz_id: string | null;
      search: string | null;
      show_inactive: boolean;
    };
  }>();

  let selectedSubject = $state(currentFilters.subject_id ?? "");
  let selectedCategory = $state(currentFilters.category_id ?? "");
  let selectedQuiz = $state(currentFilters.quiz_id ?? "");
  let searchQuery = $state(currentFilters.search ?? "");
  let showInactive = $state(currentFilters.show_inactive);
  let isOpen = $state(false);

  // Filter categories based on selected subject
  let categories = $derived(
    selectedSubject
      ? subjects.find((s: Subject) => s.id === selectedSubject)?.categories ||
          []
      : [],
  );

  // Filter quizzes based on selected category
  let filteredQuizzes = $derived(
    selectedCategory
      ? quizzes.filter((q: Quiz) => q.category.id === selectedCategory)
      : quizzes,
  );

  function updateURL() {
    const params = new URLSearchParams($page.url.searchParams);

    if (selectedSubject) {
      params.set("subject", selectedSubject);
    } else {
      params.delete("subject");
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    } else {
      params.delete("category");
    }

    if (selectedQuiz) {
      params.set("quiz", selectedQuiz);
    } else {
      params.delete("quiz");
    }

    if (searchQuery) {
      params.set("search", searchQuery);
    } else {
      params.delete("search");
    }

    if (showInactive) {
      params.set("show_inactive", "true");
    } else {
      params.delete("show_inactive");
    }

    goto(`?${params.toString()}`, { replaceState: true });
  }

  function handleSubjectChange() {
    selectedCategory = "";
    selectedQuiz = "";
    updateURL();
  }

  function handleCategoryChange() {
    selectedQuiz = "";
    updateURL();
  }

  function handleSearch(e: Event) {
    if (e instanceof KeyboardEvent && e.key === "Enter") {
      updateURL();
    }
  }

  function clearFilters() {
    selectedSubject = "";
    selectedCategory = "";
    selectedQuiz = "";
    searchQuery = "";
    showInactive = false;
    updateURL();
  }
</script>

<div class="bg-base-100 shadow rounded-lg overflow-hidden mb-6">
  <div class="p-4 border-b flex justify-between items-center">
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-medium">Filters</h2>
      {#if selectedSubject || selectedCategory || selectedQuiz || searchQuery || showInactive}
        <button class="btn btn-ghost btn-sm" on:click={clearFilters}>
          Clear Filters
        </button>
      {/if}
    </div>
    <button class="btn btn-ghost btn-sm" on:click={() => (isOpen = !isOpen)}>
      {isOpen ? "Hide Filters" : "Show Filters"}
    </button>
  </div>

  {#if isOpen}
    <div class="p-4 space-y-4">
      <!-- Search -->
      <div class="form-control">
        <div class="input-group">
          <input
            type="text"
            placeholder="Search questions..."
            class="input input-bordered flex-1"
            bind:value={searchQuery}
            on:keydown={handleSearch}
          />
          <button class="btn" on:click={updateURL}>Search</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Subject -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Subject</span>
          </label>
          <select
            class="select select-bordered w-full"
            bind:value={selectedSubject}
            on:change={handleSubjectChange}
          >
            <option value="">All Subjects</option>
            {#each subjects as subject}
              <option value={subject.id}>{subject.name}</option>
            {/each}
          </select>
        </div>

        <!-- Category -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Category</span>
          </label>
          <select
            class="select select-bordered w-full"
            bind:value={selectedCategory}
            disabled={!selectedSubject}
            on:change={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {#each categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </select>
        </div>

        <!-- Quiz -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Quiz</span>
          </label>
          <select
            class="select select-bordered w-full"
            bind:value={selectedQuiz}
            on:change={updateURL}
          >
            <option value="">All Quizzes</option>
            {#each filteredQuizzes as quiz}
              <option value={quiz.id}>{quiz.title}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Show Inactive Toggle -->
      <div class="form-control">
        <label class="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            class="toggle"
            bind:checked={showInactive}
            on:change={updateURL}
          />
          <span class="label-text">Show Inactive Questions</span>
        </label>
      </div>
    </div>
  {/if}
</div>
