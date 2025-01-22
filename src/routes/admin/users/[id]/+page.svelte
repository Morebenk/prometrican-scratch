<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { enhance } from "$app/forms";
  import type { AdminUser } from "../../types";
  import type { QuizAttempt } from "../../types";

  const adminSection = writable("users");
  setContext("adminSection", adminSection);

  export let data: {
    user: AdminUser;
    activity: {
      recentAttempts: QuizAttempt[];
      totalAttempts: number;
      averageScore: number;
    };
  };

  let errorMessage: string | null = null;
  let isProcessing = false;
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/users" class="btn btn-ghost btn-sm"> ← Back to Users </a>
    <h1 class="text-2xl font-bold">User Details</h1>
  </div>

  {#if errorMessage}
    <div class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{errorMessage}</span>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- User Profile -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Profile Information</h2>
        <div class="space-y-4">
          <div>
            <label class="label">
              <span class="label-text font-bold">Name</span>
            </label>
            <div>{data.user.full_name || "-"}</div>
          </div>

          <div>
            <label class="label">
              <span class="label-text font-bold">Email</span>
            </label>
            <div>{data.user.email || "-"}</div>
          </div>

          <div>
            <label class="label">
              <span class="label-text font-bold">Created</span>
            </label>
            <div>{new Date(data.user.created_at).toLocaleDateString()}</div>
          </div>

          <div>
            <label class="label">
              <span class="label-text font-bold">Admin Status</span>
            </label>
            <form
              method="POST"
              action="?/toggleAdmin"
              use:enhance={() => {
                isProcessing = true;
                return async ({ result, update }) => {
                  isProcessing = false;
                  if (result.type === "error") {
                    errorMessage =
                      result.error?.message ?? "Failed to update admin status";
                  } else {
                    await update();
                  }
                };
              }}
            >
              <input type="hidden" name="userId" value={data.user.id} />
              <input
                type="hidden"
                name="value"
                value={(!data.user.is_admin).toString()}
              />
              <input
                type="checkbox"
                class="toggle toggle-primary"
                checked={data.user.is_admin}
                disabled={isProcessing}
              />
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Overview -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">Activity Overview</h2>
        <div class="stats stats-vertical shadow">
          <div class="stat">
            <div class="stat-title">Total Quiz Attempts</div>
            <div class="stat-value">{data.activity.totalAttempts}</div>
          </div>

          <div class="stat">
            <div class="stat-title">Average Score</div>
            <div class="stat-value">
              {Math.round(data.activity.averageScore)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h2 class="card-title">Recent Quiz Attempts</h2>
      {#if data.activity.recentAttempts.length === 0}
        <p class="text-center py-4 text-base-content/60">
          No recent quiz attempts
        </p>
      {:else}
        <div class="overflow-x-auto">
          <table class="table w-full">
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {#each data.activity.recentAttempts as attempt}
                <tr>
                  <td>{attempt.quiz_id}</td>
                  <td>{new Date(attempt.started_at).toLocaleString()}</td>
                  <td>
                    {attempt.completed_at
                      ? new Date(attempt.completed_at).toLocaleString()
                      : "In Progress"}
                  </td>
                  <td>{attempt.score}%</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>
