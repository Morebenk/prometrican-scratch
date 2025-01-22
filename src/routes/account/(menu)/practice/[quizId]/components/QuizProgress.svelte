<script lang="ts">
  export let questionsCount: number
  export let answeredCount: number
  export let progress: string
</script>

<div class="flex flex-col gap-2 mt-4">
  <div class="flex justify-between items-center">
    <span class="text-sm font-medium">
      Progress: {answeredCount} / {questionsCount} Questions
    </span>
    <span class="text-sm font-medium">
      {progress}% Complete
    </span>
  </div>
  <div class="w-full bg-base-200 rounded-full h-2.5">
    <div
      class="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
      style="width: {progress}%"
    ></div>
  </div>
</div>
