<script lang="ts">
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import SettingsModule from "../settings_module.svelte";

  let adminSection: Writable<string> = getContext("adminSection");
  adminSection.set("settings");

  let { data } = $props();
  let { session } = data;
</script>

<svelte:head>
  <title>Reset Quiz Progress</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Settings</h1>

<SettingsModule
  title="Reset Quiz Progress"
  editable={true}
  dangerous={true}
  message="Select which data you want to reset. This action cannot be undone. You are currently logged in as '{session
    ?.user?.email}'"
  saveButtonTitle="Reset Selected Data"
  successTitle="Progress reset successfully"
  successBody="Your selected quiz data has been reset."
  formTarget="?/resetData"
  fields={[
    {
      id: "resetAttempts",
      label: "Quiz Attempts",
      initialValue: true,
      inputType: "checkbox",
    },
    {
      id: "resetIncorrect",
      label: "Incorrect Answers History",
      initialValue: false,
      inputType: "checkbox",
    },
    {
      id: "resetBookmarks",
      label: "Bookmarked Questions",
      initialValue: false,
      inputType: "checkbox",
    },
    {
      id: "currentPassword",
      label: "Current Password (required)",
      initialValue: "",
      inputType: "password",
    },
  ]}
/>

<div class="card p-6 pb-7 mt-4 max-w-xl shadow-sm">
  <h3 class="text-lg font-medium mb-3">What will be reset?</h3>
  <ul class="list-disc list-inside space-y-2 text-sm text-gray-600">
    <li><strong>Quiz Attempts</strong> - All your quiz history and scores</li>
    <li>
      <strong>Incorrect Answers History</strong> - Record of questions you've answered
      incorrectly
    </li>
    <li>
      <strong>Bookmarked Questions</strong> - Questions you've saved for later review
    </li>
  </ul>
</div>
