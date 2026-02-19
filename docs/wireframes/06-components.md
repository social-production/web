# Wireframe: Reusable Components

Shared components used across multiple pages in the Social Production app.

---

## Feed Post

A card displayed in the feed list. Provides a summary view of a Thread or Project.

```
+----------------------+-----------------------+
| Vote Button (flex 1) | Post Details (flex 3) |
+----------------------+-----------------------+
```

### Vote Button

- Upvote arrow (top)
- Vote count (middle)
- Downvote arrow (bottom)
- Vertical layout, centered

### Post Details

```
+-------------------------------------------------+
| Type | Status | Tags                            |
+-------------------------------------------------+
| Title                                           |
| Text                                            |
| Media                                           |
+-------------------------------------------------+
| User | Time Ago | Comment Count | Members Count |
+-------------------------------------------------+
```

| Element        | Type        | Notes                                              |
| -------------- | ----------- | -------------------------------------------------- |
| Type           | Badge       | "Thread" or "Project"                              |
| Status         | Badge       | "Open", "In Progress", "Completed", etc.           |
| Tags           | Pill list   | Clickable tag labels                                |
| Title          | Link/Text   | Bold, links to the full post page                  |
| Text           | Text        | Truncated body preview (2-3 lines max)             |
| Media          | Thumbnail   | Preview of attached media, if any                  |
| User           | User link   | Avatar circle + username                           |
| Time Ago       | Text        | Relative timestamp                                  |
| Comment Count  | Icon + Text | Comment bubble icon with count                     |
| Members Count  | Icon + Text | People icon with count (Projects only)             |

---

## Event

An event card used in the Activities sidebar and on Project post pages.

```
+-----------------------------------------------+
| Title                                         |
| Description                                   |
| Date and Time                                 |
| Location                                      |
+-----------------------------------------------+
| Going Count | RSVP Status (only if logged in) |
+-----------------------------------------------+
```

| Element      | Type     | Notes                                                |
| ------------ | -------- | ---------------------------------------------------- |
| Title        | Text     | Event name, bold                                     |
| Description  | Text     | Short description, 1-2 lines                         |
| Date & Time  | Text     | Formatted date and time                              |
| Location     | Text     | Physical location or "Online"                        |
| Going Count  | Text     | Number of confirmed attendees                        |
| RSVP Status  | Dropdown | Going / Maybe / Not Going (logged-in only)           |

---

## Platform Activity

A stat line used in the Activities sidebar.

```
+-------+---------+------+
| Title | Spacing | Count|
+-------+---------+------+
```

| Element | Type | Notes                                     |
| ------- | ---- | ----------------------------------------- |
| Title   | Text | Stat label (e.g., "Active Users")         |
| Count   | Text | Numeric value, right-aligned              |

Displayed as a horizontal row with the label left-aligned and count right-aligned, connected by flexible spacing.

---

## Collective Fund

A fundraising section used in the Activities sidebar.

```
+--------+
| Header |
| Pitch  |
| Funds  |
+--------+
```

| Element | Type      | Notes                                    |
| ------- | --------- | ---------------------------------------- |
| Header  | Text      | Section title for the fund campaign      |
| Pitch   | Text      | Brief fundraising description            |
| Funds   | List      | List of individual Fund items            |

### Fund

```
+------------------------+
| Title | Percent Funded |
+------------------------+
| Progress Bar           |
| Amount Raised          |
| Contribute Button      |  <-- only if logged in
+------------------------+
```

| Element            | Type         | Notes                                   |
| ------------------ | ------------ | --------------------------------------- |
| Title              | Text         | Fund/campaign name                      |
| Percent Funded     | Text         | Percentage (e.g., "60%"), right-aligned |
| Progress Bar       | Progress bar | Visual fill representing percent funded |
| Amount Raised      | Text         | Dollar amount raised so far             |
| Contribute Button  | Button       | Opens contribution flow (logged-in)     |

---

## Nested Comment

A recursive comment component used on Post pages.

```
+-----------------------------------------------------------------+
| User | Time Ago | Expand/Collapse Button                        |
+-----------------------------------------------------------------+
| Text                                                            |
+-----------------------------------------------------------------+
| Vote Count Button | Reply Button (if logged in) | Replies Count |
+-----------------------------------------------------------------+
| Nested Comments                                                 |
+-----------------------------------------------------------------+
```

| Element                 | Type        | Notes                                          |
| ----------------------- | ----------- | ---------------------------------------------- |
| User                    | User link   | Avatar + username                              |
| Time Ago                | Text        | Relative timestamp                              |
| Expand/Collapse Button  | Toggle      | Collapses/expands the comment body and replies |
| Text                    | Rich text   | Comment content                                 |
| Vote Count Button       | Icon + Text | Upvote/downvote with count                     |
| Reply Button            | Button      | Opens inline reply form (logged-in only)       |
| Replies Count           | Text        | "N replies" label                               |
| Nested Comments         | Recursive   | Child comments, visually indented               |

### Nesting Behavior

- Each nesting level adds a left border/margin to indicate depth.
- Deeply nested threads can be collapsed to reduce visual complexity.
- The Expand/Collapse button toggles visibility of body text and all child comments.

---

## Comment Form

The comment input area shown on Post pages.

```
+-----------------+
| Leave a comment |
| Input           |
| Comment Button  |  <-- right aligned
+-----------------+
```

| Element        | Type     | Notes                              |
| -------------- | -------- | ---------------------------------- |
| Label          | Text     | "Leave a comment" heading          |
| Input          | Textarea | Multi-line text input field         |
| Comment Button | Button   | Submits the comment, right-aligned |

Only visible when logged in.
