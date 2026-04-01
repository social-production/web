# Social Production Web Plan

Audience: AI agents and implementation tooling.

Human readers should start with [README.md](README.md).

## Repo Role

This repo is an older React prototype and reference workspace.

It is not the lead product implementation track.

## Source Of Truth

When this repo conflicts with current planning, prefer:

- [planning/README.md](https://github.com/social-production/planning/blob/main/README.md)
- [planning/CONTRIBUTOR_GUIDE.md](https://github.com/social-production/planning/blob/main/CONTRIBUTOR_GUIDE.md)
- [planning/APPLICATION/README.md](https://github.com/social-production/planning/blob/main/APPLICATION/README.md)
- [planning/ARCHITECTURE/TECH_ARCHITECTURE.md](https://github.com/social-production/planning/blob/main/ARCHITECTURE/TECH_ARCHITECTURE.md)
- [app/README.md](https://github.com/social-production/app/blob/main/README.md)

## Agent Guidance

- Treat this repo as reference material, not as the active product track.
- Do not revive old backend assumptions from earlier prototype plans without checking the planning repo first.
- Do not treat older web-only flows as evidence of current phase scope.
- Prefer extracting useful ideas into the planning repo or Flutter app rather than expanding this prototype by default.

## Useful Areas

- [docs/wireframes](docs/wireframes): older screen references
- [src](src): mock-data implementation and copy ideas
- [src/components](src/components): reusable prototype components and interaction ideas

## Avoid These Assumptions

- do not assume a PostgreSQL plus REST backend path is current
- do not assume this repo is the main mobile or desktop path
- do not assume older session notes represent the current workspace structure

## Commands

- `npm install`
- `npm run dev`

```ascii
+-----------------+
| Post Wrapper    |
+-----------------+
| Comment Form    |
+-----------------+
| Comment Count   |
+-----------------+
| Nested Comments |
+-----------------+
```

###### Post Wrapper

```ascii
+--------------------------------------+
| Vote Button (flex 1) | Post (flex 3) |
+--------------------------------------+
| Members (flex 1) | Events (flex 1)   | <--- (if post is a project)
+--------------------------------------+
| Post Actions (aligned right)         | <--- (if logged in, post is a project, and you are a moderator)
+--------------------------------------+
| Post Update Button                   | <--- (if logged in, post is a project, and you are a moderator)
+--------------------------------------+
| Post Updates                         |
+--------------------------------------+
```

####### Post

```ascii
+--------------------------------------+
| Type and Status | Tags               | <--- (left aligned)
+--------------------------------------+
| Title                                |
+--------------------------------------+
| Posted By | Time Ago | Comment Count | <--- (left aligned)
+--------------------------------------+
| Media                                |
| Text                                 |
+--------------------------------------+
```

####### Members

```ascii
+---------------------------+
| Header with Members Count |
| Members                   |
| Join Project Button       | <--- (if logged in)
+---------------------------+
```

####### Events

```ascii
+--------------------------+
| Header with Events Count |
| Events                   |
| Schedule Event Button    | <--- (if logged in)
+--------------------------+
```

######## Event

````ascii
+-----------------------------------------------+
| Title                                         |
| Description                                   |
| Date and Time                                 |
| Location                                      |
+-----------------------------------------------+
| Going Count | RSVP Status (only if logged in) |
+-----------------------------------------------+
```

####### Post Actions

```ascii
+-------------+
| Edit Button |
+-------------+
```

####### Post Updates

```ascii
+---------------------------+
| Header with Updates Count |
| Updates                   |
+---------------------------+
```

######## Update

```ascii
+-------------------+
| Status | Time Ago |
| text              |
| Posted By User    |
+-------------------+
```

###### Comment Form

```ascii
+-----------------+
| Leave a comment |
| Input           |
| Comment Button  | <--- (right aligned)
+-----------------+
```

###### Nested Comment

```ascii
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
````

## Features

- Accounts
  - Log in from any network federated server (including the local one)
  - Sign up with the local network federated server
- Link to other network federated servers
  - Sync all channels, posts, tags, events, funds, and users with other network federated servers
- Channels
  - Create
  - View all posts
  - Post in channel
- Tags
  - Create
  - View all posts
  - Post in channel
- Posts
  - Create a project
  - Create a thread
- Funds
  - Create
  - View all funds
- Events
  - Created through a project
  - RSVP to an event
  - View all events
