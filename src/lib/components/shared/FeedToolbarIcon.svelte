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
    | 'plus'
    | 'map-pin'
    | 'locate'
    | 'wifi'
    | 'map'
    | 'list'
    | 'expand'
    | 'compress'
    | 'clock-slash'
    | 'user'
    | 'bell'
    | 'message'
    | 'more'
    | 'calendar'
    | 'calendar-x'
    | 'calendar-range'
    | 'search'
    | 'link';
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
  {:else if name === 'map-pin'}
    <path
      d="M12 21s6.5-5.1 6.5-10a6.5 6.5 0 1 0-13 0c0 4.9 6.5 10 6.5 10Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="11" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8" />
  {:else if name === 'locate'}
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'wifi'}
    <path
      d="M5 9.5a11 11 0 0 1 14 0M8 13a6.5 6.5 0 0 1 8 0M10.5 16.5a2.5 2.5 0 0 1 3 0"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <circle cx="12" cy="19" r="1.2" fill="currentColor" />
  {:else if name === 'map'}
    <path
      d="M5 6.5 9 4.5l5 2.5 5-2.5v13l-5 2.5-5-2.5-4 2V6.5Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <path d="M9 4.5v13M14 7v13" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none" />
  {:else if name === 'list'}
    <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'expand'}
    <path
      d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'compress'}
    <path
      d="M9 9 5 5M5 5v3M5 5h3M15 9l4-4M19 5v3M19 5h-3M9 15l-4 4M5 19v-3M5 19h3M15 15l4 4M19 19v-3M19 19h-3"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  {:else if name === 'clock-slash'}
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M12 7.5V12l3 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <path d="M5 5l14 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'user'}
    <circle cx="12" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path
      d="M5.5 19.5c.9-2.8 2.8-4.5 6.5-4.5s5.6 1.7 6.5 4.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  {:else if name === 'bell'}
    <path
      d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  {:else if name === 'message'}
    <path
      d="M4 4h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  {:else if name === 'more'}
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" />
  {:else if name === 'calendar'}
    <rect x="5" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M5 10h14M8 4v3M16 4v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'calendar-x'}
    <rect x="5" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M5 10h14M8 4v3M16 4v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <path d="M9 14l6 6M15 14l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'calendar-range'}
    <rect x="5" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" />
    <path d="M5 10h14M8 4v3M16 4v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
    <path d="M8 14h8M8 17h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
  {:else if name === 'search'}
    <path
      d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.8 2.2-4.2-4.2"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="2"
    />
  {:else if name === 'link'}
    <path
      d="M9.5 14.5 8 16a3.5 3.5 0 0 1-5-5l2.5-2.5a3.5 3.5 0 0 1 5 0M14.5 9.5 16 8a3.5 3.5 0 0 1 5 5l-2.5 2.5a3.5 3.5 0 0 1-5 0M9 15l6-6"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
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
