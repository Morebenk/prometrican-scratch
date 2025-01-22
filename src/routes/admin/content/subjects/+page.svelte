<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import type { Subject } from "../../types.js";

  export let data: { subjects: Subject[] };
  export let form: { success?: boolean; error?: string } | null = null;

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  let deletingSubjectId: string | null = null;

  function handleDelete(subjectId: string) {
    if (confirm("Are you sure you want to delete this subject?")) {
      deletingSubjectId = subjectId;
      const formElement = document.getElementById(
        `delete-form-${subjectId}`,
      ) as HTMLFormElement;
      if (formElement) {
        formElement.submit();
      }
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Subjects</h1>
    <a href="/admin/content/subjects/new" class="btn btn-primary">
      New Subject
    </a>
  </div>

  {#if form?.error}
    <div class="alert alert-error">
      {form.error}
    </div>
  {/if}

  <div class="bg-base-100 shadow rounded-lg overflow-hidden">
    {#if data.subjects.length === 0}
      <div class="p-6 text-center">
        <p class="text-gray-500">No subjects found</p>
        <a href="/admin/content/subjects/new" class="btn btn-ghost mt-2">
          Create your first subject
        </a>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Categories</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.subjects as subject}
              <tr>
                <td class="font-medium">{subject.name}</td>
                <td>{subject.description || "-"}</td>
                <td>
                  <a
                    href="/admin/content/subjects/{subject.id}/categories"
                    class="btn btn-ghost btn-sm"
                  >
                    View Categories
                  </a>
                </td>
                <td>
                  {new Date(subject.created_at || "").toLocaleDateString()}
                </td>
                <td>
                  <div class="flex gap-2">
                    <a
                      href="/admin/content/subjects/{subject.id}/edit"
                      class="btn btn-ghost btn-sm"
                    >
                      Edit
                    </a>
                    <form
                      id="delete-form-{subject.id}"
                      action="?/delete"
                      method="POST"
                      class="inline"
                    >
                      <input type="hidden" name="id" value={subject.id} />
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm text-error"
                        disabled={deletingSubjectId === subject.id}
                        on:click={() => handleDelete(subject.id)}
                      >
                        {#if deletingSubjectId === subject.id}
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
