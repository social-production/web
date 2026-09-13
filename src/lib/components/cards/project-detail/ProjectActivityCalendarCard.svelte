<script lang="ts">
  import RoundPlusButton from '$lib/components/shared/RoundPlusButton.svelte';
  import type { ProjectActivityItem } from '$lib/types/detail';
  import { formatIsoDayLabel, isoDayFromValue } from '$lib/utils/calendarDay';

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
  export let createButtonLabel = 'Add activity';
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
      statusTone: 'red' | 'yellow' | 'green' | 'muted';
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
    return isoDayFromValue(date);
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

        const ended =
          activity.rolesLocked === true || new Date(activity.endAt).getTime() <= Date.now();

        return {
          id: activity.id,
          title: activity.title,
          statusTone: (ended ? 'muted' : activity.statusTone) as DayCell['items'][number]['statusTone'],
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
  $: todayIso = isoDayFromValue(new Date());
  $: agendaDayIso =
    isoDayFromValue(selectedDayIso) ||
    (calendarDays.some((day) => day.isoDay === todayIso) ? todayIso : '') ||
    calendarDays.find((day) => day.items.length > 0)?.isoDay ||
    '';
  $: agendaDay = calendarDays.find((day) => day.isoDay === agendaDayIso) ?? null;
  $: agendaItems = agendaDay?.items ?? [];
  $: agendaLabel = agendaDayIso ? formatIsoDayLabel(agendaDayIso) : '';

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

  function isViewableDay(isoDay: string) {
    return plannedDayIsos.length === 0 || plannedDaySet.has(isoDay);
  }

  function isSelectableDay(isoDay: string) {
    return isViewableDay(isoDay);
  }

  function handleDaySelect(isoDay: string, anchor: CalendarInteractionAnchor) {
    if (!isViewableDay(isoDay)) {
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
    {#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as weekday}
      <span>
        <span class="weekday-full">{weekday}</span>
        <span class="weekday-short">{weekday.slice(0, 1)}</span>
      </span>
    {/each}
  </div>
  <div class="calendar-grid">
    {#each calendarDays as day (day.isoDay)}
      <div
        class:muted-day={!day.isCurrentMonth}
        class:past-day={isPastDay(day.isoDay)}
        class:planned-day={day.isPlanned}
        class:unplanned-day={plannedDayIsos.length > 0 && !day.isPlanned}
        class:hovered-day={hoveredDayIso === day.isoDay}
        class:selected-day={agendaDayIso === day.isoDay}
        class:today-day={todayIso === day.isoDay}
        class="calendar-cell"
        role="button"
        tabindex={isSelectableDay(day.isoDay) ? 0 : -1}
        aria-disabled={!isSelectableDay(day.isoDay)}
        aria-label={`${day.dayNumber}${day.items.length ? `, ${day.items.length} ${day.items.length === 1 ? 'activity' : 'activities'}` : ''}`}
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
        {#if day.isPlanned && day.items.length === 0}
          <span class="planned-indicator" aria-hidden="true"></span>
        {/if}
        <div class="activity-dots" aria-hidden="true">
          {#each day.items.slice(0, 3) as item (item.id)}
            <span class={`activity-dot tone-${item.statusTone}`}></span>
          {/each}
        </div>
        <div class="timeline-track">
          {#each day.items as item}
            <button
              class={`timeline-item tone-${item.statusTone}`}
              class:hovered-activity={hoveredActivityId === item.id}
              class:selected-activity={selectedActivityId === item.id}
              style={`top:${item.topPercent}%;height:${item.heightPercent}%;left:${item.leftPercent}%;width:${item.widthPercent}%;`}
              type="button"
              aria-label={`${item.title}, ${item.startTimeLabel} to ${item.endTimeLabel}`}
              on:mouseenter={() => (hoveredActivityId = item.id)}
              on:mouseleave={() => (hoveredActivityId = '')}
              on:focus={() => (hoveredActivityId = item.id)}
              on:blur={() => (hoveredActivityId = '')}
              on:click|stopPropagation={(event) =>
                activitySelect(item.id, eventAnchor(event, event.currentTarget as HTMLElement))}
            ></button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if agendaDayIso}
    <div class="day-agenda">
      <div class="agenda-head">
        <strong>{agendaLabel}</strong>
        <span>{agendaItems.length} {agendaItems.length === 1 ? 'activity' : 'activities'}</span>
      </div>
      {#if agendaItems.length === 0}
        <p class="agenda-empty">No activities.</p>
      {:else}
        <div class="agenda-list">
          {#each agendaItems as item (item.id)}
            <button
              class={`agenda-row tone-${item.statusTone}`}
              class:selected-activity={selectedActivityId === item.id}
              type="button"
              on:click={(event) =>
                activitySelect(item.id, eventAnchor(event, event.currentTarget as HTMLElement))}
            >
              <span class="agenda-time">{item.startTimeLabel}–{item.endTimeLabel}</span>
              <span class="agenda-title">{item.title}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

{#if canCreate}
  <div class="create-row">
    <RoundPlusButton
      action={(event) => createAction(event ? eventAnchor(event, event.currentTarget as HTMLElement) : undefined)}
      active={createActive}
      label={createButtonLabel}
      ariaLabel={createAriaLabel}
      participationAction="propose-activity"
    />
  </div>
{/if}

<style>
  .calendar-shell {
    container-type: inline-size;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    display: grid;
    gap: 10px;
    min-width: 0;
    overflow-x: clip;
  }

  .create-row {
    display: flex;
    justify-content: center;
    margin-top: 2px;
  }

  .calendar-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
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
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 4px;
    min-width: 0;
  }

  .calendar-header-row {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    text-align: center;
  }

  .weekday-short {
    display: none;
  }

  .calendar-cell {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    min-width: 0;
    min-height: 96px;
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

  .today-day .calendar-day-number {
    background: var(--brand);
    color: var(--page-bg);
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
    opacity: 0.7;
  }

  .calendar-day-number {
    position: relative;
    z-index: 1;
    display: inline-block;
    margin: 6px 0 0 6px;
    color: var(--text-main);
    font-size: 13px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 999px;
    line-height: 1.3;
  }

  .planned-indicator {
    position: absolute;
    top: 10px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--brand);
  }

  .activity-dots {
    display: none;
    position: absolute;
    left: 6px;
    right: 6px;
    bottom: 6px;
    gap: 3px;
    justify-content: center;
  }

  .activity-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
  }

  .timeline-track {
    position: absolute;
    inset: 22px 3px 4px;
    display: block;
  }

  .timeline-item {
    position: absolute;
    box-sizing: border-box;
    padding: 0;
    border-radius: 3px;
    border: 0;
    min-height: 8px;
    cursor: pointer;
  }

  .timeline-item:hover,
  .timeline-item:focus-visible,
  .hovered-activity,
  .selected-activity {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 40%, transparent);
    z-index: 2;
  }

  .tone-red,
  .activity-dot.tone-red {
    background: color-mix(in srgb, var(--tablet-community-bg) 70%, var(--panel));
  }

  .tone-yellow,
  .activity-dot.tone-yellow {
    background: color-mix(in srgb, var(--status-yellow) 70%, var(--panel));
  }

  .tone-green,
  .activity-dot.tone-green {
    background: color-mix(in srgb, var(--brand) 55%, var(--panel));
  }

  .tone-muted,
  .activity-dot.tone-muted {
    background: color-mix(in srgb, var(--text-soft) 35%, var(--panel));
  }

  .day-agenda {
    display: grid;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--panel-border);
  }

  .agenda-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .agenda-head strong {
    color: var(--text-main);
    font-size: 13px;
  }

  .agenda-empty {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .agenda-list {
    display: grid;
    gap: 6px;
  }

  .agenda-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: 8px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .agenda-row.selected-activity,
  .agenda-row:hover,
  .agenda-row:focus-visible {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 40%, var(--panel));
  }

  .agenda-time {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .agenda-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 700;
  }

  @container (max-width: 560px) {
    .weekday-full {
      display: none;
    }

    .weekday-short {
      display: inline;
    }

    .calendar-cell {
      min-height: 52px;
    }

    .calendar-day-number {
      font-size: 14px;
      margin: 4px auto 0;
      display: block;
      text-align: center;
    }

    .timeline-track {
      display: none;
    }

    .activity-dots {
      display: flex;
    }
  }

  @media (max-width: 760px) {
    .weekday-full {
      display: none;
    }

    .weekday-short {
      display: inline;
    }

    .calendar-cell {
      min-height: 52px;
    }

    .calendar-day-number {
      font-size: 14px;
      margin: 4px auto 0;
      display: block;
      text-align: center;
    }

    .timeline-track {
      display: none;
    }

    .activity-dots {
      display: flex;
    }
  }
</style>