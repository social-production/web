<!-- Lock + "Private" for items only invited people or members can see. -->
<span class="private-mark" title="Private: only invited people and members see this">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14">
    <path
      d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    />
  </svg>
  <span>Private</span>
</span>

<style>
  .private-mark {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 4px;
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    margin-right: 6px;
  }
</style>
