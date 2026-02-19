# Social Production

A federated system for localized production management

## Tech Stack

- Vite
- ReactJs
- TypeScript
- GRPC

## Server Communication

Uses GRPC to make calls to the backend.

## Layout

The layout uses a flex based layout.

```ascii
+--------------------------+
| Top Bar (flex 1)         |
+--------------------------+
| Content Wrapper (flex 3) |
+--------------------------+
```

### Top Bar

The top bar has a maximum height of 48 px.

```ascii
+---------------+-----------------------+-------------------------+
| Logo (flex 1) | Page Actions (flex 3) | Global Actions (flex 1) |
+---------------+-----------------------+-------------------------+
```

#### Global Actions

**Logged Out**:

```ascii
+---------------+----------------+
| Log in Button | Sign up Button |
+---------------+----------------+
```

**Logged In**:

```ascii
+--------------------+---------------------------+----------------+
| Alerts Icon Button | Notifications Icon Button | Log out Button |
+--------------------+---------------------------+----------------+
```

### Content Wrapper

```ascii
+-----------------+------------------+-----------------+
|Padding (flex 1) | Content (flex 3) | Padding (flex1) |
+-----------------+------------------+-----------------+
```

### Front Page

#### Page Actions

**Logged Out**:

```ascii
+---+
|   |
+---+
```

**Logged In**:

```ascii
+------------+
| Search Bar |
+------------+
```

#### Content

```ascii
+---------------+----------------+---------------------+
| Menu (flex 1) | Feeds (flex 3) | Activities (flex 1) |
+---------------+----------------+---------------------+
```

##### Menu

```ascii
+---------------------+
| Home Menu Item      |
| My Feed Menu Item   | <--- (only when logged in)
| Local Menu Item     |
+---------------------+
| Channels Header     |
+---------------------+
| Channels            |
+---------------------+
| Tags Header         |
+---------------------+
| Tags                |
+---------------------+
| New Channel Button  | <--- (only when logged in)
+---------------------+
```

#### Feeds

```ascii
+------------------------------------------+
| Feeds Tabs (flex 3) | Actions (flex 1)   |
+------------------------------------------+
| Filters (flex 3)    | Feed Count (flex 1)|
+------------------------------------------+
| Feed                                     |
+------------------------------------------+
```

##### Feed Tabs

```ascii
+----------------+------------------------------------+-----------------+
| Home Feed Item | My Feed Item (only when logged in) | Local Feed Item |
+----------------+------------------------------------+-----------------+
```

##### Actions

Only when logged in:

```ascii
+-------------------+--------------------+
| Add Thread Button | Add Project Button |
+-------------------+--------------------+
```

##### Filters

```ascii
+------------------+----------------+
| Filter Drop Down | Sort Drop Down |
+------------------+----------------+
```

#### Feed

```ascii
+------------+
| Feed Posts |
+------------+
```

##### Feed Post

```ascii
+----------------------+-----------------------+
| Vote Button (flex 1) | Post Details (flex 3) |
+----------------------+-----------------------+
```

###### Post Details

```ascii
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

#### Events

```ascii
+------------------------------+
| My Events Header             | <--- (only if logged in)
| My Events                    | <--- (only if logged in)
+------------------------------+
| Events Happening Soon Header |
| Events Happening Soon        |
+------------------------------+
| Platform Activity Header     |
| Platform Activities          |
+------------------------------+
| Collective Fund Header       |
| Collective Funds             |
+------------------------------+
```

##### Event

```ascii
+-----------------------------------------------+
| Title                                         |
| Description                                   |
| Date and Time                                 |
| Location                                      |
+-----------------------------------------------+
| Going Count | RSVP Status (only if logged in) |
+-----------------------------------------------+
```

##### Platform Activity

```ascii
+-------+---------+------+
| Title | Spacing | Count|
+-------+---------+------+
```

##### Collective Fund

```ascii
+--------+
| Header |
| Pitch  |
| Funds  |
+--------+
```

###### Fund

```ascii
+------------------------+
| Title | Percent Funded |
+------------------------+
| Progress Bar           |
| Amount Raised          |
| Contribute Button      | <--- (only if logged in)
+------------------------+
```

### Post Page

#### Page Actions

```ascii
+-------------+
| Back Button |
+-------------+
```

#### Content Wrapper

```ascii
+------------------+------------------+------------------+
| Padding (flex 1) | Content (flex 3) | Padding (flex 1) |
+------------------+------------------+------------------+
```

##### Content

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
