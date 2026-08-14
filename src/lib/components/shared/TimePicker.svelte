<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import FeedToolbarIcon from '$lib/components/shared/FeedToolbarIcon.svelte';

  export let value = '';
  export let required = false;
  export let disabled = false;
  export let name: string | undefined = undefined;

  let inputEl: HTMLInputElement | null = null;
  let rootEl: HTMLDivElement | null = null;
  let open = false;

  $: uses12h = prefers12HourClock();
  $: parsed = parseTimeValue(value);
  $: hour24 = parsed.hour;
  $: minute = parsed.minute;
  $: meridiem = hour24 >= 12 ? 'pm' : 'am';
  $: hour12 = ((hour24 + 11) % 12) + 1;

  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  function prefers12HourClock() {
    if (typeof Intl === 'undefined') return false;
    const cycle = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h12' || cycle === 'h11';
  }

  function parseTimeValue(raw: string) {
    const match = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
    if (!match) return { hour: 9, minute: 0 };
    return {
      hour: Math.min(23, Math.max(0, Number(match[1]))),
      minute: Math.min(59, Math.max(0, Number(match[2])))
    };
  }

  function formatTime(hour: number, minuteValue: number) {
    return `${String(hour).padStart(2, '0')}:${String(minuteValue).padStart(2, '0')}`;
  }

  function commit(nextHour: number, nextMinute: number) {
    value = formatTime(nextHour, nextMinute);
  }

  function tryShowPicker() {
    const el = inputEl;
    if (!el || typeof el.showPicker !== 'function' || disabled) return false;
    try {
      el.showPicker();
      return true;
    } catch {
      return false;
    }
  }

  function handlePointerDown() {
    tryShowPicker();
  }

  function handleFocus() {
    tryShowPicker();
  }

  function togglePopover() {
    if (disabled) return;
    if (tryShowPicker()) return;
    open = !open;
  }

  function selectHour(nextHour: number) {
    commit(nextHour, minute);
  }

  function selectHour12(nextHour12: number) {
    const base = nextHour12 % 12;
    commit(meridiem === 'pm' ? base + 12 : base, minute);
  }

  function selectMinute(nextMinute: number) {
    commit(hour24, nextMinute);
  }

  function selectMeridiem(next: 'am' | 'pm') {
    if (next === meridiem) return;
    const nextHour = next === 'pm' ? (hour24 % 12) + 12 : hour24 % 12;
    commit(nextHour, minute);
  }

  function onDocumentPointerDown(event: PointerEvent) {
    if (!open || !rootEl) return;
    if (event.target instanceof Node && rootEl.contains(event.target)) return;
    open = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') open = false;
  }

  onMount(() => {
    document.addEventListener('pointerdown', onDocumentPointerDown);
    document.addEventListener('keydown', onKeydown);
  });

  onDestroy(() => {
    if (typeof document === 'undefined') return;
    document.removeEventListener('pointerdown', onDocumentPointerDown);
    document.removeEventListener('keydown', onKeydown);
  });
</script>

<div bind:this={rootEl} class="time-picker">
  <input
    bind:this={inputEl}
    bind:value
    {name}
    {required}
    {disabled}
    type="time"
    on:pointerdown={handlePointerDown}
    on:focus={handleFocus}
  />
  <button
    aria-expanded={open}
    aria-label="Open clock"
    class="clock-button"
    disabled={disabled}
    type="button"
    on:click={togglePopover}
  >
    <FeedToolbarIcon name="clock" />
  </button>
  {#if open}
    <div class="clock-popover" role="dialog" aria-label="Choose a time">
      <div class="clock-columns" class:with-meridiem={uses12h}>
        <div class="clock-column">
          <span>Hour</span>
          <div class="clock-scroll">
            {#if uses12h}
              {#each hours12 as hour}
                <button
                  class:active={hour === hour12}
                  type="button"
                  on:click={() => selectHour12(hour)}
                >
                  {hour}
                </button>
              {/each}
            {:else}
              {#each hours24 as hour}
                <button
                  class:active={hour === hour24}
                  type="button"
                  on:click={() => selectHour(hour)}
                >
                  {String(hour).padStart(2, '0')}
                </button>
              {/each}
            {/if}
          </div>
        </div>
        <div class="clock-column">
          <span>Min</span>
          <div class="clock-scroll">
            {#each minutes as minuteValue}
              <button
                class:active={minuteValue === minute || (minute > minuteValue && minute < minuteValue + 5)}
                type="button"
                on:click={() => selectMinute(minuteValue)}
              >
                {String(minuteValue).padStart(2, '0')}
              </button>
            {/each}
          </div>
        </div>
        {#if uses12h}
          <div class="clock-column meridiem">
            <span> </span>
            <div class="clock-scroll">
              <button class:active={meridiem === 'am'} type="button" on:click={() => selectMeridiem('am')}>
                AM
              </button>
              <button class:active={meridiem === 'pm'} type="button" on:click={() => selectMeridiem('pm')}>
                PM
              </button>
            </div>
          </div>
        {/if}
      </div>
      <button class="done" type="button" on:click={() => (open = false)}>Done</button>
    </div>
  {/if}
</div>

<style>
  .time-picker {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
  }

  input {
    width: 100%;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
  }

  .clock-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    cursor: pointer;
  }

  .clock-popover {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    display: grid;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    box-shadow: 0 10px 30px color-mix(in srgb, #000 18%, transparent);
  }

  .clock-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .clock-columns.with-meridiem {
    grid-template-columns: 1fr 1fr auto;
  }

  .clock-column {
    display: grid;
    gap: 4px;
  }

  .clock-column span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  .clock-scroll {
    display: grid;
    gap: 2px;
    max-height: 168px;
    overflow: auto;
  }

  .clock-scroll button,
  .done {
    min-height: 32px;
    padding: 4px 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-main);
    font: inherit;
    cursor: pointer;
  }

  .clock-scroll button.active {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    font-weight: 700;
  }

  .done {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    font-weight: 700;
  }
</style>
