# Page dependency trees

Local Svelte imports only (no `$lib/services`, utils, or node_modules). Capped at important UI files.

## Home (`/`)

```
src/routes/+page.svelte
└── PublicFeed.svelte
    ├── PublicFeedCard.svelte
    │   ├── ProjectCard.svelte
    │   │   ├── FeedSurface.svelte
    │   │   ├── SurfaceTypeLabel.svelte → SurfaceIcon.svelte
    │   │   ├── TagList.svelte → ScopeChip.svelte → SurfaceIcon.svelte
    │   │   ├── ContentMetaRow.svelte → GroupsIcon, FeedToolbarIcon
    │   │   ├── CountPill.svelte
    │   │   ├── VoteStrip.svelte
    │   │   └── ReportControl.svelte
    │   ├── ThreadCard.svelte (same shared card stack)
    │   ├── EventCard.svelte
    │   ├── HelpRequestCard.svelte
    │   └── ProjectActivityCard.svelte
    ├── IconMenuButton.svelte → SurfaceIcon.svelte
    ├── FeedToolbarIcon.svelte
    ├── RadiusCombobox.svelte
    └── InfiniteFeedSentinel.svelte
```

## Personal (`/personal`)

```
src/routes/personal/+page.svelte
└── PersonalFeed.svelte
    ├── PersonalFeedCard.svelte
    │   ├── PersonalPostCard.svelte
    │   │   ├── FeedSurface.svelte
    │   │   ├── SurfaceTypeLabel.svelte
    │   │   ├── TagList.svelte
    │   │   └── ContentMetaRow.svelte
    │   ├── PersonalActivityCard.svelte
    │   ├── PersonalHelpRequestCard.svelte
    │   └── PersonalCommentActivityCard.svelte
    ├── IconMenuButton.svelte
    ├── FeedToolbarIcon.svelte
    └── InfiniteFeedSentinel.svelte
```

## Settings (`/settings`)

```
src/routes/settings/+page.svelte
└── SettingsPage.svelte
    ├── AvatarBadge.svelte
    ├── SearchableSelect.svelte
    └── LocationPicker.svelte
    (toggle UI: inline `<button class="toggle">` — styles in SettingsPage `<style>`)
```

## Messages (`/messages`)

```
src/routes/messages/+page.svelte
└── MessagesPage.svelte
    ├── PageHeader.svelte
    ├── AvatarBadge.svelte
    ├── CountBadge.svelte
    ├── RoundPlusButton.svelte
    └── LiveChatPanel.svelte
        ├── ReportComposerModal.svelte
        └── ReportMenu.svelte
```

## Shell wrapper (all pages)

```
src/routes/+layout.svelte
└── AppShell.svelte
    ├── LeftRailPanel.svelte
    ├── RightRailPanel.svelte
    ├── MobileBottomNav.svelte → CountBadge, FeedToolbarIcon
    ├── MobileMoreSheet.svelte
    ├── CreateFab.svelte → CreateMenuIcon.svelte
    ├── SearchSuggestionsList.svelte
    ├── CountBadge.svelte
    ├── FeedToolbarIcon.svelte
    ├── GroupsIcon.svelte
    └── AuthActionNotice.svelte
```
