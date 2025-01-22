<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const adminSection = writable("content");
  setContext("adminSection", adminSection);
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Content Management</h1>
    <div class="flex gap-2">
      <a href="/admin/content/subjects/new" class="btn btn-primary">
        New Subject
      </a>
      <a href="/admin/content/questions/new" class="btn btn-primary">
        New Question
      </a>
      <a href="/admin/content/quizzes/new" class="btn btn-primary">
        New Quiz
      </a>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Subjects Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Subjects</h2>
        <p>Manage subject areas and their categories</p>
        <div class="card-actions justify-end">
          <a href="/admin/content/subjects" class="btn btn-ghost">View All</a>
        </div>
      </div>
    </div>

    <!-- Questions Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Questions</h2>
        <p>Create and edit questions in the question bank</p>
        <div class="card-actions justify-end">
          <a href="/admin/content/questions" class="btn btn-ghost">View All</a>
        </div>
      </div>
    </div>

    <!-- Quizzes Card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Quizzes</h2>
        <p>Build and manage quizzes from questions</p>
        <div class="card-actions justify-end">
          <a href="/admin/content/quizzes" class="btn btn-ghost">View All</a>
        </div>
      </div>
    </div>
  </div>
</div>
