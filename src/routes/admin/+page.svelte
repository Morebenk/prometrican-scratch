<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import type { Stats } from "./types";

  const adminSection = writable("dashboard");
  setContext("adminSection", adminSection);

  export let data: {
    stats: Stats;
  };
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Dashboard</h1>

  <!-- Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="stat bg-base-100 rounded-lg shadow">
      <div class="stat-title">Total Users</div>
      <div class="stat-value">{data.stats.totalUsers}</div>
    </div>

    <div class="stat bg-base-100 rounded-lg shadow">
      <div class="stat-title">Total Questions</div>
      <div class="stat-value">{data.stats.totalQuestions}</div>
    </div>

    <div class="stat bg-base-100 rounded-lg shadow">
      <div class="stat-title">Total Quizzes</div>
      <div class="stat-value">{data.stats.totalQuizzes}</div>
    </div>

    <div class="stat bg-base-100 rounded-lg shadow">
      <div class="stat-title">Pending Flags</div>
      <div class="stat-value text-warning">{data.stats.pendingFlags}</div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Quick Actions</h2>
        <div class="space-y-2">
          <a
            href="/admin/content/questions/new"
            class="btn btn-primary btn-block"
          >
            Add New Question
          </a>
          <a
            href="/admin/content/quizzes/new"
            class="btn btn-primary btn-block"
          >
            Create New Quiz
          </a>
          <a href="/admin/flags" class="btn btn-warning btn-block">
            Review Flagged Content ({data.stats.pendingFlags})
          </a>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Recent Activity</h2>
        <div class="stats stats-vertical w-full">
          <div class="stat">
            <div class="stat-title">Quiz Attempts Today</div>
            <div class="stat-value">{data.stats.recentAttempts}</div>
          </div>
        </div>
        <div class="card-actions justify-end">
          <a href="/admin/reports" class="btn btn-ghost">View Reports →</a>
        </div>
      </div>
    </div>
  </div>
</div>
