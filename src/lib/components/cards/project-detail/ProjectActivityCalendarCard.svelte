<script lang="ts">
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import type { ProjectActivityItem } from '$lib/types/detail';

  type CalendarInteractionAnchor = {
    clientX: number;
    clientY: number;
  };

  export let activities: ProjectActivityItem[] = [];
  export let plannedDayIsos: string[] = [];
  export let selectedDayIso = '';
  export let selectedActivityId = '';
  export let canCreate = false;
  export let createActive = false;
  export let createLabel = '';
  export let createSubtitle = '';
  export let createAriaLabel = 'Add activity';
  export let daySelect: (isoDay: string, anchor?: CalendarInteractionAnchor) => void = () => {};
  export let activitySelect: (activityId: string, anchor?: CalendarInteractionAnchor) => void = () => {};
  export let createAction: (anchor?: CalendarInteractionAnchor) => void | Promise<void> = () => {};

  type DayCell = {
    isoDay: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isPlanned: boolean;
    items: Array<{
      id: string;
      title: string;
      statusTone: 'red' | 'yellow' | 'green';
      startTimeLabel: string;
      endTimeLabel: string;
      topPercent: number;
      heightPercent: number;
      leftPercent: number;
      widthPercent: number;
      showTitle: boolean;
    }>;
  };

  const minutesPerDay = 24 * 60;
  let calendarDays: DayCell[] = [];
  let hoveredDayIso = '';
  let hoveredActivityId = '';
  let visibleMonthLabel = '';
  let visibleMonthStart = defaultVisibleMonthStart(activities, selectedDayIso, plannedDayIsos);
  let lastSelectedDayIso = selectedDayIso;
  let lastCalendarSignature = `${activities.map((activity) => activity.id).join('|')}::${plannedDayIsos.join('|')}`;

  function isoDayValue(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatTimeLabel(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function dateFromValue(value: string) {
    if (!value) {
      return null;
    }

    const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (parts) {
      return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function monthStartFor(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function defaultVisibleMonthStart(
    sourceActivities: ProjectActivityItem[],
    selectedDayValue: string,
    plannedDayValues: string[]
  ) {
    const selectedDate = dateFromValue(selectedDayValue);
    if (selectedDate) {
      return monthStartFor(selectedDate);
    }

    const firstPlannedDay = plannedDayValues
      .map((isoDay) => dateFromValue(isoDay))
      .filter((date): date is Date => !!date)
      .sort((left, right) => left.getTime() - right.getTime())[0];

    if (firstPlannedDay) {
      return monthStartFor(firstPlannedDay);
    }

    const now = Date.now();
    const upcomingActivity = sourceActivities
      .map((activity) => new Date(activity.startAt))
      .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
      .sort((left, right) => left.getTime() - right.getTime())[0];

    const firstActivity = sourceActivities
      .map((activity) => new Date(activity.startAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => left.getTime() - right.getTime())[0];

    return monthStartFor(upcomingActivity ?? firstActivity ?? new Date());
  }

  function shiftVisibleMonth(offset: number) {
    const nextMonth = new Date(visibleMonthStart);
    nextMonth.setMonth(nextMonth.getMonth() + offset);
    visibleMonthStart = monthStartFor(nextMonth);
  }

  function overlaps(
    left: { startMinutes: number; endMinutes: number },
    right: { startMinutes: number; endMinutes: number }
  ) {
    return left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes;
  }

  function dayRange(isoDay: string) {
    const start = new Date(`${isoDay}T00:00:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  function dayItems(isoDay: string, sourceActivities: ProjectActivityItem[]) {
    const { start: dayStart, end: dayEnd } = dayRange(isoDay);
    const ranged = sourceActivities
      .filter(
        (activity) =>
          new Date(activity.startAt).getTime() < dayEnd.getTime() &&
          new Date(activity.endAt).getTime() > dayStart.getTime()
      )
      .map((activity) => {
        const start = new Date(activity.startAt);
        const end = new Date(activity.endAt);
        const segmentStart = start.getTime() < dayStart.getTime() ? dayStart : start;
        const segmentEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;
        const startMinutes = (segmentStart.getTime() - dayStart.getTime()) / (60 * 1000);
        const endMinutes = Math.max(
          (segmentEnd.getTime() - dayStart.getTime()) / (60 * 1000),
          startMinutes + 30
        );

        return {
          id: activity.id,
          title: activity.title,
          statusTone: activity.statusTone,
          startTimeLabel: formatTimeLabel(segmentStart),
          endTimeLabel: formatTimeLabel(segmentEnd),
          startMinutes,
          endMinutes,
          col: 0,
          overlapCount: 1
        };
      })
      .sort((left, right) => left.startMinutes - right.startMinutes);

    const colEnds: number[] = [];
    for (const item of ranged) {
      let assigned = false;
      for (let col = 0; col < colEnds.length; col += 1) {
        if (colEnds[col] <= item.startMinutes) {
          item.col = col;
          colEnds[col] = item.endMinutes;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        item.col = colEnds.length;
        colEnds.push(item.endMinutes);
      }
    }

    for (const item of ranged) {
      item.overlapCount = Math.max(1, ranged.filter((other) => overlaps(item, other)).length);
    }

    return ranged.map((item) => ({
      id: item.id,
      title: item.title,
      statusTone: item.statusTone,
      startTimeLabel: item.startTimeLabel,
      endTimeLabel: item.endTimeLabel,
      topPercent: (item.startMinutes / minutesPerDay) * 100,
      heightPercent: ((item.endMinutes - item.startMinutes) / minutesPerDay) * 100,
      leftPercent: (item.col / item.overlapCount) * 100,
      widthPercent: 100 / item.overlapCount,
      showTitle: item.overlapCount === 1 && item.endMinutes - item.startMinutes >= 180
    }));
  }

  function buildCalendarDays(
    sourceActivities: ProjectActivityItem[],
    anchor: Date,
    plannedDaySet: Set<string>
  ): DayCell[] {
    const start = new Date(anchor);
    const offset = (anchor.getDay() + 6) % 7;
    start.setDate(anchor.getDate() - offset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const isoDay = isoDayValue(date);

      return {
        isoDay,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === anchor.getMonth(),
        isPlanned: plannedDaySet.has(isoDay),
        items: dayItems(isoDay, sourceActivities)
      };
    });
  }

  $: if (selectedDayIso !== lastSelectedDayIso) {
    const selectedDate = dateFromValue(selectedDayIso);
    if (selectedDate) {
      visibleMonthStart = monthStartFor(selectedDate);
    }
    lastSelectedDayIso = selectedDayIso;
  }

  $: {
    const nextCalendarSignature = `${activities.map((activity) => activity.id).join('|')}::${plannedDayIsos.join('|')}`;
    if (!selectedDayIso && nextCalendarSignature !== lastCalendarSignature) {
      visibleMonthStart = defaultVisibleMonthStart(activities, selectedDayIso, plannedDayIsos);
      lastCalendarSignature = nextCalendarSignature;
    }
  }

  $: visibleMonthLabel = visibleMonthStart.toLocaleDateString([], {
    month: 'long',
    year: 'numeric'
  });

  $: plannedDaySet = new Set(plannedDayIsos);
  $: calendarDays = buildCalendarDays(activities, visibleMonthStart, plannedDaySet);

  function elementAnchor(element: HTMLElement): CalendarInteractionAnchor {
    const rect = element.getBoundingClientRect();

    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    };
  }

  function eventAnchor(event: MouseEvent, element: HTMLElement): CalendarInteractionAnchor {
    if (event.clientX || event.clientY) {
      return {
        clientX: event.clientX,
        clientY: event.clientY
      };
    }

    return elementAnchor(element);
  }

  function isPastDay(isoDay: string) {
    const date = dateFromValue(isoDay);

    if (!date) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date.getTime() < today.getTime();
  }

  function isSelectableDay(isoDay: string) {
    if (isPastDay(isoDay)) {
      return false;
    }

    return plannedDayIsos.length === 0 || plannedDaySet.has(isoDay);
  }

  function handleDaySelect(isoDay: string, anchor: CalendarInteractionAnchor) {
    if (!isSelectableDay(isoDay)) {
      return;
    }

    daySelect(isoDay, anchor);
  }
</script>

<div class="calendar-shell surface-card">
  <div class="calendar-toolbar">
    <button class="month-button" type="button" on:click={() => shiftVisibleMonth(-1)}>
      Prev
    </button>
    <strong class="month-label">{visibleMonthLabel}</strong>
    <button class="month-button" type="button" on:click={() => shiftVisibleMonth(1)}>
      Next
    </button>
  </div>

  <div class="calendar-grid calendar-header-row">
    <span>Mon</span>
    <span>Tue</span>
    <span>Wed</span>
    <span>Thu</span>
    <span>Fri</span>
    <span>Sat</span>
    <span>Sun</span>
  </div>
  <div class="calendar-grid">
    {#each calendarDays as day (day.isoDay)}
      <div
        class:muted-day={!day.isCurrentMonth}
        class:past-day={isPastDay(day.isoDay)}
        class:planned-day={day.isPlanned}
        class:unplanned-day={plannedDayIsos.length > 0 && !day.isPlanned}
        class:hovered-day={hoveredDayIso === day.isoDay}
        class:selected-day={selectedDayIso.startsWith(day.isoDay)}
        class="calendar-cell"
        role="button"
        tabindex={isSelectableDay(day.isoDay) ? 0 : -1}
        aria-disabled={!isSelectableDay(day.isoDay)}
        on:mouseenter={() => (hoveredDayIso = day.isoDay)}
        on:mouseleave={() => (hoveredDayIso = '')}
        on:focus={() => (hoveredDayIso = day.isoDay)}
        on:blur={() => (hoveredDayIso = '')}
        on:touchstart={() => (hoveredDayIso = day.isoDay)}
        on:click={(event) =>
          handleDaySelect(day.isoDay, eventAnchor(event, event.currentTarget as HTMLElement))}
        on:keydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleDaySelect(day.isoDay, elementAnchor(event.currentTarget as HTMLElement));
          }
        }}
      >
        <span class="calendar-day-number">{day.dayNumber}</span>
        {#if day.isPlanned}
          <span class="planned-indicator" aria-hidden="true"></span>
        {/if}
        <div class="timeline-track">
          {#each day.items as item}
            <button
              class={`timeline-item tone-${item.statusTone}`}
              class:hovered-activity={hoveredActivityId === item.id}
              class:selected-activity={selectedActivityId === item.id}
              style={`top:${item.topPercent}%;height:${item.heightPercent}%;left:${item.leftPercent}%;width:${item.widthPercent}%;`}
              type="button"
              on:mouseenter={() => (hoveredActivityId = item.id)}
              on:mouseleave={() => (hoveredActivityId = '')}
              on:focus={() => (hoveredActivityId = item.id)}
              on:blur={() => (hoveredActivityId = '')}
              on:click|stopPropagation={(event) =>
                activitySelect(item.id, eventAnchor(event, event.currentTarget as HTMLElement))}
            >
              <span class="band-label band-start">{item.startTimeLabel}</span>
              {#if item.showTitle}
                <span class="band-title">{item.title}</span>
              {/if}
              <span class="band-label band-end">{item.endTimeLabel}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if canCreate}
  <div class="create-row">
    {#if createLabel || createSubtitle}
      <div class="create-row-copy">
        {#if createLabel}
          <strong>{createLabel}</strong>
        {/if}
        {#if createSubtitle}
          <span>{createSubtitle}</span>
        {/if}
      </div>
    {/if}
    <RoundPlusButton
      action={(event) => createAction(event ? eventAnchor(event, event.currentTarget as HTMLElement) : undefined)}
      active={createActive}
      ariaLabel={createAriaLabel}
    />
  </div>
{/if}

<style>
  .calendar-shell {
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 8px;
    overflow-x: auto;
  }

  .create-row,
  .create-row-copy {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .create-row {
    justify-content: space-between;
  }

  .create-row-copy {
    flex-wrap: wrap;
  }

  .create-row-copy strong {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
  }

  .create-row-copy span {
    color: var(--text-soft);
    font-size: 12px;
  }

  .calendar-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .month-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  }

  .month-button:hover,
  .month-button:focus-visible {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: var(--brand-soft);
    color: var(--brand-strong);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .month-label {
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    text-align: center;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
  }

  .calendar-header-row {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .calendar-cell {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    aspect-ratio: 1;
    min-height: 0;
    padding: 0;
    display: block;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  }

  .calendar-cell:hover,
  .calendar-cell:focus-visible,
  .calendar-cell:active,
  .hovered-day {
    border-color: color-mix(in srgb, var(--brand) 42%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 34%, var(--panel));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 24%, transparent);
  }

  .selected-day {
    border-color: var(--brand);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 35%, transparent);
  }

  .planned-day {
    border-color: color-mix(in srgb, var(--brand) 34%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 16%, var(--panel));
  }

  .unplanned-day {
    cursor: default;
    opacity: 0.62;
  }

  .muted-day {
    opacity: 0.45;
  }

  .past-day {
    cursor: default;
    opacity: 0.32;
  }

  .past-day:hover,
  .past-day:focus-visible,
  .past-day:active {
    border-color: var(--panel-border);
    background: var(--panel);
    box-shadow: none;
  }

  .calendar-day-number {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 1;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 82%, transparent);
  }

  .planned-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--brand);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--panel) 88%, transparent);
  }

  .timeline-track {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    min-height: 100%;
    margin-top: 0;
  }

  .timeline-item {
    position: absolute;
    box-sizing: border-box;
    padding: 0;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, black 12%, transparent);
    overflow: visible;
    text-overflow: ellipsis;
    font-size: 10px;
    line-height: 1.1;
    cursor: pointer;
    text-align: left;
    display: block;
    white-space: nowrap;
    min-height: 10px;
    transition: border-color 0.12s ease, box-shadow 0.12s ease, transform 0.12s ease;
  }

  .calendar-cell:hover .timeline-item,
  .hovered-day .timeline-item {
    border-color: color-mix(in srgb, var(--brand) 38%, var(--panel-border));
  }

  .timeline-item:hover,
  .timeline-item:focus-visible,
  .hovered-activity,
  .selected-activity {
    border-color: color-mix(in srgb, var(--brand) 60%, var(--panel-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 28%, transparent);
    transform: scale(1.01);
    z-index: 2;
  }

  .band-label,
  .band-title {
    position: absolute;
    z-index: 1;
    color: inherit;
    font-size: 9px;
    pointer-events: none;
  }

  .band-label {
    font-weight: 700;
    line-height: 1;
    padding: 2px 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-strong) 88%, transparent);
  }

  .band-start {
    top: 0;
    left: 0;
    transform: translateY(calc(-100% - 1px));
  }

  .band-end {
    right: 0;
    bottom: 0;
    text-align: right;
    transform: translateY(calc(100% + 1px));
  }

  .band-title {
    left: 4px;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .tone-red {
    background: color-mix(in srgb, var(--tablet-community-bg) 28%, var(--panel));
    color: var(--text-main);
  }

  .tone-yellow {
    background: color-mix(in srgb, var(--status-yellow) 34%, var(--panel));
    color: var(--text-main);
  }

  .tone-green {
    background: color-mix(in srgb, var(--brand-soft) 88%, var(--panel));
    color: var(--text-main);
  }

  .create-row {
    display: flex;
    justify-content: center;
    margin-top: 2px;
  }

  @media (max-width: 760px) {
    .calendar-grid {
      grid-template-columns: repeat(7, minmax(0, 1fr));
      min-width: 0;
    }
  }
</style>