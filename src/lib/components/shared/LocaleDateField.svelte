<script lang="ts">
  import { displayTimezone } from '$lib/stores/timezoneStore';

  export let value = '';
  export let mode: 'date' | 'datetime' = 'date';
  export let min: string | undefined = undefined;
  export let max: string | undefined = undefined;

  $: activeTimezone =
    $displayTimezone?.trim() ||
    (typeof Intl === 'undefined' ? '' : Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  $: dayFirst = activeTimezone.startsWith('Australia/');

  function splitValue(raw: string) {
    const [datePart = '', timePart = ''] = raw.split('T');
    const [year = '', month = '', day = ''] = datePart.split('-');
    return {
      year,
      month,
      day,
      time: timePart.slice(0, 5)
    };
  }

  function commit(next: { year: string; month: string; day: string; time: string }) {
    if (!next.year || !next.month || !next.day) {
      value = '';
      return;
    }
    const date = `${next.year.padStart(4, '0')}-${next.month.padStart(2, '0')}-${next.day.padStart(2, '0')}`;
    value = mode === 'datetime' ? `${date}T${next.time || '00:00'}` : date;
  }

  function updatePart(part: 'year' | 'month' | 'day' | 'time', raw: string) {
    const next = splitValue(value);
    next[part] = raw.replace(/[^\d:]/g, '').slice(0, part === 'year' ? 4 : part === 'time' ? 5 : 2);
    commit(next);
  }
</script>

{#if dayFirst}
  {@const parts = splitValue(value)}
  <span class="locale-date">
    <input
      aria-label="Day"
      inputmode="numeric"
      maxlength="2"
      placeholder="DD"
      value={parts.day}
      on:input={(event) => updatePart('day', event.currentTarget.value)}
    />
    <span aria-hidden="true">/</span>
    <input
      aria-label="Month"
      inputmode="numeric"
      maxlength="2"
      placeholder="MM"
      value={parts.month}
      on:input={(event) => updatePart('month', event.currentTarget.value)}
    />
    <span aria-hidden="true">/</span>
    <input
      aria-label="Year"
      inputmode="numeric"
      maxlength="4"
      placeholder="YYYY"
      value={parts.year}
      on:input={(event) => updatePart('year', event.currentTarget.value)}
    />
    {#if mode === 'datetime'}
      <input
        aria-label="Time"
        inputmode="numeric"
        maxlength="5"
        placeholder="HH:MM"
        value={parts.time}
        on:input={(event) => updatePart('time', event.currentTarget.value)}
      />
    {/if}
  </span>
{:else if mode === 'datetime'}
  <input {max} {min} type="datetime-local" bind:value />
{:else}
  <input {max} {min} type="date" bind:value />
{/if}

<style>
  .locale-date {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .locale-date input {
    width: 3.2em;
    min-width: 0;
  }

  .locale-date input[aria-label='Year'] {
    width: 4.6em;
  }

  .locale-date input[aria-label='Time'] {
    width: 5.2em;
  }
</style>
