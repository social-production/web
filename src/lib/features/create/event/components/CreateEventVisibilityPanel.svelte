<script lang="ts">
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import type { EventAudience, EventGovernance } from '$lib/types/feed';

  export let audience: EventAudience = 'public';
  export let governance: EventGovernance = 'collaborative';
  export let selectedGovernance: 'collaborative' | 'organizer_controlled' = 'organizer_controlled';
  export let mode: 'audience' | 'control' = 'audience';
  export let privateCommunityLabel: string | null = null;
  export let inviteeCount = 0;

  $: controlLocked = audience === 'public';
</script>

{#if mode === 'audience'}
  <CreatePanel title="Audience" description="Who can discover and access this event.">
    <label class="control-option">
      <input type="radio" name="event-audience" value="public" bind:group={audience} />
      <span>
        <strong>Public</strong>
        <span class="hint">Discoverable through channel/community tags. Always collaborative.</span>
      </span>
    </label>
    <label class="control-option">
      <input type="radio" name="event-audience" value="private_community" bind:group={audience} />
      <span>
        <strong>Private community</strong>
        <span class="hint">Only members of one private community can find it on feeds and the map.</span>
      </span>
    </label>
    <label class="control-option">
      <input type="radio" name="event-audience" value="invite_only" bind:group={audience} />
      <span>
        <strong>Invite only</strong>
        <span class="hint">Only invited people and organizers can find it, including on the map.</span>
      </span>
    </label>
  </CreatePanel>
{:else if controlLocked}
  <CreatePanel title="Control" description="Public events stay collaborative.">
    <p class="helper-text">
      Current mode: <strong>Collaborative</strong>. Members shape the plan through signals, values, and
      votes.
    </p>
  </CreatePanel>
{:else}
  <CreatePanel title="Control" description="How this private event is run.">
    <p class="helper-text">
      {#if audience === 'private_community' && privateCommunityLabel}
        Private community: <strong>{privateCommunityLabel}</strong>.
      {:else if audience === 'invite_only'}
        Invite-only ({inviteeCount} invited).
      {:else}
        Private audience selected.
      {/if}
    </p>
    <label class="control-option">
      <input
        type="radio"
        name="event-governance"
        value="collaborative"
        bind:group={selectedGovernance}
      />
      <span>
        <strong>Collaborative</strong>
        <span class="hint"
          >Same flow as public events: signals → values → plans → activity, just inside this private
          audience. Members can propose, vote, and sign up for roles.</span
        >
      </span>
    </label>
    <label class="control-option">
      <input
        type="radio"
        name="event-governance"
        value="organizer_controlled"
        bind:group={selectedGovernance}
      />
      <span>
        <strong>Organizer-controlled</strong>
        <span class="hint"
          >Skip signals, values, and proposal votes. Set the plan up front and start in Activity.
          Creators and co-organizers manage changes; members can still join and sign up for roles.</span
        >
      </span>
    </label>
    <p class="helper-text">
      Current selection: <strong>{governance === 'collaborative' ? 'Collaborative' : 'Organizer-controlled'}</strong>
    </p>
  </CreatePanel>
{/if}

<style>
  .helper-text {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }

  .control-option {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 10px;
    align-items: start;
    margin-top: 10px;
  }

  .hint {
    display: block;
    margin-top: 2px;
    color: var(--text-soft);
    font-size: 13px;
  }
</style>
