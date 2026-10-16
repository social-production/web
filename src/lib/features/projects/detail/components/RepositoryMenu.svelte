<script lang="ts">
  import PhaseMenu, { type PhaseMenuItem } from '$lib/components/shared/PhaseMenu.svelte';

  /** Repository ▾: the rarely used repository votes, kept behind one button like Phase ▾. */
  export let canReplace = false;
  export let canChangeMerge = false;
  export let onReplace: () => void = () => {};
  export let onChangeMerge: () => void = () => {};

  $: items = repositoryItems(canReplace, canChangeMerge);

  function repositoryItems(replace: boolean, merge: boolean): PhaseMenuItem[] {
    const list: PhaseMenuItem[] = [];
    if (replace) {
      list.push({
        id: 'replace-repository',
        glyph: '⇄',
        label: 'Replace repository',
        detail: 'Members vote to move the project to a different repository.',
        onSelect: () => onReplace(),
      });
    }
    if (merge) {
      list.push({
        id: 'merge-capability',
        glyph: '⑂',
        label: 'Grant or revoke merge capability',
        detail: 'Members vote on who can merge approved pull requests.',
        onSelect: () => onChangeMerge(),
      });
    }
    return list;
  }
</script>

<PhaseMenu
  {items}
  label="Repository"
  sheetTitle="Repository"
  participationAction="repository-menu"
  labelledById="repository-menu-title"
/>
