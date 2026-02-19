# 🌱 Social Production

A community platform for organising collective projects, pooling resources, and building things together — neighbourhood by neighbourhood.

Think Reddit meets a cooperative organiser: people post project ideas, recruit members, schedule meetups, and collectively fund shared goals.

---

## What is this?

Social Production is built around the idea that communities can produce things together — gardens, tool libraries, murals, classes, housing campaigns — when they have the right tools to coordinate.

The platform lets users:

- **Post projects** with status tracking (Proposed → Active → Completed)
- **Post threads** for discussion and debate
- **Join projects** and collaborate with members
- **Schedule meetups** — in-person or online
- **Collectively fundraise** toward shared goals
- **Subscribe to channels** organised by topic or geography (e.g. Brooklyn, Food & Agriculture, Housing)
- **Follow updates** as projects evolve

---

## Features

### Accounts
- Log in from any network federated server (including the local one)
- Sign up with the local network federated server

### Federation
- Link to other network federated servers
- Sync all channels, posts, tags, events, funds, and users with other network federated servers

### Channels
- Create channels
- View all posts in a channel
- Post in a channel

### Tags
- Create tags
- View all posts by tag
- Tag posts in channels

### Posts
- Create a project
- Create a thread

### Funds
- Create a fund
- View all funds

### Events
- Create events through a project
- RSVP to an event
- View all events

---

## Wireframes

Design specifications and visual wireframes for every screen in the app.

| Document | Description |
|---|---|
| [Overview & Index](docs/wireframes/00-index.md) | Document map, auth state summary, layout system |
| [Shared Layout](docs/wireframes/01-layout.md) | Top Bar, Content Wrapper, Global Actions |
| [Front Page — Logged Out](docs/wireframes/02-front-page-logged-out.md) | Public landing page with feeds and activities |
| [Front Page — Logged In](docs/wireframes/03-front-page-logged-in.md) | Authenticated dashboard with personal feeds and actions |
| [Post Page — Thread](docs/wireframes/04-post-page-thread.md) | Thread detail view with nested comments |
| [Post Page — Project](docs/wireframes/05-post-page-project.md) | Project detail with members, events, and updates |
| [Reusable Components](docs/wireframes/06-components.md) | Feed Post, Event, Comment, Fund specs |

---

## Current State (Frontend)

The frontend is fully built as a working prototype with mock data. All pages are navigable and interactive.

| Page | Description |
|---|---|
| `/` | Main feed — filter, sort, vote on posts |
| `/post/:id` | Full post view with comments, meetups, funding widget, updates feed |
| `/create` | Create a thread or project (with meetup scheduling + funding form) |
| `/edit-project/:id` | Edit an existing project |
| `/channel/:name` | Channel page with filtered feed |
| `/create-channel` | Create a new community channel |
| `/user/:username` | User profile with threads, projects, comments tabs |
| `/auth` | Login / signup forms |

**No backend yet** — all data is mock data in `src/data.js`. Backend integration (PostgreSQL + Docker) is in active development.

---

## Tech Stack

**Frontend (current)**
- **React 18** with hooks
- **Vite** for dev server and bundling
- **React Router v6** for client-side routing
- All styling is inline CSS (no CSS framework)
- **PWA support** via `vite-plugin-pwa` — installable on iOS and Android from the browser

**Backend (in development)**
- **PostgreSQL** — direct, no third-party wrappers
- **Docker** — containerized for easy self-hosting
- **REST API** — connecting frontend to persistent data

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/YMSVZ/social_production.git
cd social_production

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── App.jsx              # Main feed page
├── PostPage.jsx         # Individual post / project view
├── CreatePage.jsx       # Create thread or project
├── EditProjectPage.jsx  # Edit an existing project
├── ChannelPage.jsx      # Channel feed
├── CreateChannelPage.jsx# Create a new channel
├── UserProfile.jsx      # User profile page
├── AuthPage.jsx         # Login / signup
├── FundingForm.jsx      # Reusable collective funding form
├── MeetupForm.jsx       # Reusable meetup scheduling form
├── data.js              # Mock data (threads, comments, channels)
└── main.jsx             # Router setup
```

---

## Architecture & Hosting Philosophy

Social Production is designed to be **self-hosted and community-owned** — no dependency on any third-party service or corporation.

- **Self-hostable:** The backend is a Docker container. Any community can run their own instance on their own server with a single command.
- **No lock-in:** Direct PostgreSQL — no proprietary wrappers, no vendor dependency.
- **Federated (long-term goal):** Communities run local nodes (e.g. a Brooklyn node, a London node) that connect to the wider network. Users have a home node but can interact across the whole platform — post to any channel, join any project, move between nodes if they relocate. Local roots, global network.
- **Open source (AGPL-3.0):** The code is public and forkable. Corporations cannot take it, close it, and profit from it.

---

## Roadmap

### 🔧 Backend & Core Features
- [ ] **PostgreSQL backend** — auth, database, REST API
- [ ] **User authentication** — login, sessions, protected routes
- [ ] **Persistent posts & comments** — stored in database
- [ ] **Real funding** — payment processing for collective contributions
- [ ] **Notifications** — updates, mentions, meetup reminders
- [ ] **Search** — full-text search across posts and channels
- [ ] **Local feed** — location-based filtering

### 🌐 Federation
- [ ] **Self-hosting guide** — Docker deployment documentation
- [ ] **Multi-node support** — communities can run their own local instance
- [ ] **Cross-node interaction** — users on different nodes can interact, post to shared channels, join projects across nodes
- [ ] **Account portability** — move your account between nodes without losing history

### 📱 Mobile
- [ ] **Mobile layout** — responsive design pass
- [ ] **PWA support** — installable on iOS and Android directly from the browser (no App Store needed)
- [ ] **Capacitor app** — wrap the web app for App Store & Google Play release (initial native app)
- [ ] **React Native app** — fully native iOS/Android rebuild for a polished, high-performance mobile experience (long-term)

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b your-feature-name`
3. Make your changes and commit: `git commit -m "Add: description of change"`
4. Push to your fork: `git push origin your-feature-name`
5. Open a Pull Request — describe what you changed and why

Please keep PRs focused on a single feature or fix. If you're planning something large, open an issue first to discuss.

---

## License

[AGPL-3.0](LICENSE) — GNU Affero General Public License v3.0

This means anyone can use, modify, and distribute this code — but if you run a modified version as a web service, you **must** make your source code publicly available. This prevents corporations from taking the code, closing it up, and profiting from it without giving back to the community.
