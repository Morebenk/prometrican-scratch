<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { enhance } from "$app/forms";
  import type { AdminUser } from "../types";

  const adminSection = writable("users");
  setContext("adminSection", adminSection);

  export let data: {
    users: AdminUser[];
  };

  let searchQuery = "";
  let processingUser: string | null = null;
  let errorMessage: string | null = null;

  $: filteredUsers = data.users.filter(
    (user) =>
      searchQuery === "" ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleToggleAdmin(userId: string, currentValue: boolean) {
    // Clear any previous error
    errorMessage = null;
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Users</h1>
    <div class="form-control">
      <input
        type="text"
        placeholder="Search users..."
        class="input input-bordered w-64"
        bind:value={searchQuery}
      />
    </div>
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

  <div class="bg-base-100 shadow rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Created</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredUsers as user}
            <tr class:opacity-50={processingUser === user.id}>
              <td class="font-medium">{user.full_name || "-"}</td>
              <td>{user.email || "-"}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <form
                  method="POST"
                  action="?/toggleAdmin"
                  use:enhance={() => {
                    processingUser = user.id;
                    return async ({ result, update }) => {
                      processingUser = null;
                      if (result.type === "error") {
                        errorMessage =
                          result.error?.message ??
                          "Failed to update admin status";
                      } else {
                        await update();
                      }
                    };
                  }}
                >
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="value"
                    value={(!user.is_admin).toString()}
                  />
                  <input
                    type="checkbox"
                    class="toggle toggle-primary"
                    checked={user.is_admin}
                    disabled={processingUser === user.id}
                    on:change={() => handleToggleAdmin(user.id, user.is_admin)}
                  />
                </form>
              </td>
              <td>
                <div class="flex gap-2">
                  <a href="/admin/users/{user.id}" class="btn btn-ghost btn-sm">
                    View Details
                  </a>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
