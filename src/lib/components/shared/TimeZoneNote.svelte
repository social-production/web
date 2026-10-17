<script lang="ts">
  import { getDisplayTimezone } from '$lib/stores/timezoneStore';
  import { formatLocalTimezoneAbbreviation } from '$lib/utils/time';

  /** Says which zone time fields use (the Display timezone from Settings). */
  const zone = getDisplayTimezone();
  const abbreviation = formatLocalTimezoneAbbreviation(new Date(), zone);
</script>

<p class="time-zone-note">
  Times are in {abbreviation ? `${abbreviation} (${zone})` : zone}. Change it in
  <a href="/settings">Settings</a>.
</p>

<style>
  .time-zone-note {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.4;
  }
</style>
