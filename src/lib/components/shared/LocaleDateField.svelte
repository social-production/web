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
  $: readout = formatReadout(value, mode);

  function formatReadout(raw: string, kind: 'date' | 'datetime') {
    if (!raw) {
      return kind === 'datetime' ? 'DD/MM/YYYY, HH:MM' : 'DD/MM/YYYY';
    }

    const [datePart = '', timePart = ''] = raw.split('T');
    const [year, month, day] = datePart.split('-').map((part) => Number(part));
    if (!year || !month || !day) {
      return kind === 'datetime' ? 'DD/MM/YYYY, HH:MM' : 'DD/MM/YYYY';
    }

    const [hour = 0, minute = 0] = timePart.split(':').map((part) => Number(part));
    const local = new Date(year, month - 1, day, hour, minute);
    const dateLabel = new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(local);

    if (kind !== 'datetime') {
      return dateLabel;
    }

    const timeLabel = new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(local);
    return `${dateLabel}, ${timeLabel}`;
  }
</script>

<span class="locale-date" class:day-first={dayFirst}>
  <input {max} {min} type={mode === 'datetime' ? 'datetime-local' : 'date'} bind:value />
  {#if dayFirst}
    <span class="locale-readout" class:placeholder={!value} aria-hidden="true">{readout}</span>
  {/if}
</span>

<style>
  .locale-date {
    position: relative;
    display: block;
    width: 100%;
    min-width: 0;
  }

  .locale-date input {
    width: 100%;
  }

  .day-first input::-webkit-datetime-edit,
  .day-first input::-webkit-datetime-edit-fields-wrapper,
  .day-first input::-webkit-datetime-edit-text,
  .day-first input::-webkit-datetime-edit-month-field,
  .day-first input::-webkit-datetime-edit-day-field,
  .day-first input::-webkit-datetime-edit-year-field,
  .day-first input::-webkit-datetime-edit-hour-field,
  .day-first input::-webkit-datetime-edit-minute-field,
  .day-first input::-webkit-datetime-edit-ampm-field {
    color: transparent;
    caret-color: transparent;
  }

  .locale-readout {
    position: absolute;
    top: 50%;
    left: 13px;
    right: 36px;
    overflow: hidden;
    color: var(--text-main);
    font: inherit;
    line-height: 1.2;
    pointer-events: none;
    text-overflow: ellipsis;
    transform: translateY(-50%);
    white-space: nowrap;
  }

  .locale-readout.placeholder {
    color: var(--text-soft);
  }
</style>
