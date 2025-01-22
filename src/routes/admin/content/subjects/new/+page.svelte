<script lang="ts">
  import { setContext } from "svelte";
  import { writable } from "svelte/store";

  const adminSection = writable("content");
  setContext("adminSection", adminSection);

  export let form: {
    success?: boolean;
    error?: string;
    values?: {
      name?: string;
      description?: string;
    };
    errors?: {
      name?: string;
      description?: string;
    };
  } = {};

  let submitting = false;

  function handleSubmit() {
    submitting = true;
  }
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/content/subjects" class="btn btn-ghost btn-sm">
      ← Back to Subjects
    </a>
    <h1 class="text-2xl font-bold">New Subject</h1>
  </div>

  <form method="POST" class="card bg-base-100 shadow" on:submit={handleSubmit}>
    <div class="card-body">
      {#if form.error}
        <div class="alert alert-error mb-4">
          {form.error}
        </div>
      {/if}

      <div class="form-control">
        <label for="name" class="label">
          <span class="label-text">Name</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          class="input input-bordered"
          class:input-error={form.errors?.name}
          value={form.values?.name ?? ""}
          disabled={submitting}
          required
        />
        {#if form.errors?.name}
          <label class="label">
            <span class="label-text-alt text-error">{form.errors.name}</span>
          </label>
        {/if}
      </div>

      <div class="form-control">
        <label for="description" class="label">
          <span class="label-text">Description</span>
        </label>
        <textarea
          id="description"
          name="description"
          class="textarea textarea-bordered h-24"
          class:textarea-error={form.errors?.description}
          value={form.values?.description ?? ""}
          disabled={submitting}
        />
        {#if form.errors?.description}
          <label class="label">
            <span class="label-text-alt text-error"
              >{form.errors.description}</span
            >
          </label>
        {/if}
      </div>

      <div class="card-actions justify-end mt-4">
        <a
          href="/admin/content/subjects"
          class="btn btn-ghost"
          class:hidden={submitting}
        >
          Cancel
        </a>
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {#if submitting}
            <span class="loading loading-spinner" />
            Creating...
          {:else}
            Create Subject
          {/if}
        </button>
      </div>
    </div>
  </form>
</div>
