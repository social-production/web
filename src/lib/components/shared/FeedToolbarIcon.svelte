<script lang="ts">
  export let name:
    | 'home'
    | 'globe'
    | 'filter'
    | 'sort'
    | 'clock'
    | 'people'
    | 'trending'
    | 'person-plus'
    | 'person-check'
    | 'shield'
    | 'plus';
</script>

<svg aria-hidden="true" viewBox="0 0 24 24" class="toolbar-icon">
  {#if name === 'home'}
    <path
      d="M5.5 10.2V18a1 1 0 0 0 1 1H9v-5h6v5h2.5a1 1 0 0 0 1-1v-7.8L12 5.5 5.5 10.2Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  {:else if name === 'globe'}
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M4.5 12h15M12 3.5a14.5 14.5 0 0 1 0 17M12 3.5a14.5 14.5 0 0 0 0 17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  {:else if name === 'filter'}
    <path
      d="M5 7h14M8 12h8M10.5 17h3"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      fill="none"
    />
  {:else if name === 'sort'}
    <path d="M8 7v12M8 7l-3 3M8 7l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <path d="M16 17V5M16 17l-3-3M16 17l3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'clock'}
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M12 7.5V12l3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'people'}
    <circle cx="9" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M4.5 18.5c.8-2.4 2.4-3.8 4.5-3.8s3.7 1.4 4.5 3.8"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <circle cx="16.5" cy="10.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6" />
    <path
      d="M14.5 18.5c.5-1.6 1.5-2.5 3-2.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  {:else if name === 'person-plus'}
    <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M4.5 17.5c.8-2.2 2.3-3.5 4.5-3.5s3.7 1.3 4.5 3.5M17.5 8.5v5M15 11h5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  {:else if name === 'person-check'}
    <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M4.5 17.5c.8-2.2 2.3-3.5 4.5-3.5s3.7 1.3 4.5 3.5M16.5 11.5l1.5 1.5 3-3"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'shield'}
    <path
      d="M12 4.5 6.5 7v5.2c0 3.1 2.3 5.9 5.5 7.3 3.2-1.4 5.5-4.2 5.5-7.3V7L12 4.5Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  {:else if name === 'plus'}
    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else}
    <path d="M5 17l4-6 3.5 4L16 9l3 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <path d="M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {/if}
</svg>

<style>
  .toolbar-icon {
    width: 18px;
    height: 18px;
    display: block;
  }
</style>
