# Social Production — Governance Rules

---

## Contents

1. Core Principles
2. Channels and Communities
3. The Required Votes Formula
4. Demand and Opposition Signals
5. Phase Transitions
6. Proposal Criteria
7. Project Types
8. Event Types
9. Phase 2+ Extensions (Acquisition and Asset System)
10. Asset System (Phase 2+ Details)
11. Software Projects
12. Links
13. Platform Projects
14. Board Members
15. Phase 1 Scope
16. Quick Reference

---

## 1. Core Principles

**All votes across the platform require 66% approval of votes cast to pass.** This applies to every vote without exception — plan approvals, phase transitions, reversions, edit approvals, pull request approvals, and board member standing votes. The approval rate never changes. What varies is how many votes must be cast before a result is valid — the quorum.

**No phase transition is automatic.** Meeting a demand signal threshold or having a plan approved unlocks the ability to hold a transition vote. It does not trigger one. Members decide when the project is ready to move forward.

**The creator of a project or event has no elevated role or authority** once it is created, except in personal service projects and private events which are creator-controlled by design. The one limited exception is software projects, where the creator of an accepted plan initially holds pull request merge capability — a scoped technical role, not a governance privilege.

**Demand and opposition signals are always visible** throughout the entire lifecycle of every project and event. They do not automatically lock or reverse anything, but growing opposition provides the democratic weight for members to initiate a reversion vote if they choose.

**Production on this platform is for use, not exchange.** Projects here produce goods and services for collective use and consumption, not for sale. Productive projects produce outputs to be used or consumed at some point after production — physical goods, software, infrastructure. Service projects coordinate activity that is consumed at the moment it is delivered — meals served, haircuts given, deliveries made, software maintained. These are distinct and complementary forms of collective production. A farm producing vegetables is a productive project. A kitchen service using those vegetables to serve meals is a separate collective service project. Each is its own project; one does not contain the other.

---

## 2. Channels and Communities

Channels and communities are **discovery and tagging mechanisms only**. They are not governing bodies and hold no authority over projects or events.

**Tagging rules:**
- Every project and public event must be tagged to at least one channel
- Communities may be additionally tagged but cannot be the only tag
- A project tagged only to a community is not valid
- Private events are the only exception — they may exist within private communities or directly between users with no channel tag required
- Projects and events may be tagged to any number of channels and communities

---

## 3. The Required Votes Formula

This platform uses a mathematically principled formula to determine how many votes must be cast before a result is valid — the quorum. The formula is based on statistical sampling theory: how many people need to vote for the result to represent the group's view with reasonable confidence?

The core insight is that you do not need to scale linearly with population. A properly sized sample gives reliable results at any scale. At small sizes, nearly everyone needs to vote. At very large sizes, a few hundred to a few thousand votes is statistically sufficient. The percentage of the group required drops as size grows, but the absolute count keeps rising, ensuring legitimacy scales appropriately.

### The Formula

```
Step 1 — Find E (margin of error) based on current group size N:

  If N < 100:
    E = 0.10 − (0.03 × (N − 1) / 99)
    [E decreases smoothly from 10% at N=1 toward 7% at N=100]

  If 100 ≤ N < 500:
    E = 0.07 − (0.02 × (N − 100) / 400)
    [E decreases smoothly from 7% at N=100 toward 5% at N=500]

  If N ≥ 500:
    E = max(2%, 5% − 3% × log₁₀(N / 500) / log₁₀(2000))
    [E decreases logarithmically from 5% at N=500 toward 2% at N=1,000,000]

Step 2 — Calculate base sample size:
  n₀ = 0.9604 / E²

Step 3 — Adjust for actual group size:
  cochran(N) = ceil( n₀ / (1 + (n₀ − 1) / N) )

Step 4 — Apply small-group floor:
  required = min( ceil(0.75 × N), cochran(N) )
```

The small-group floor (Step 4) ensures that for groups under roughly 50 members the required votes do not exceed 75% of the group. Above roughly 50, the Cochran formula naturally produces a lower number and takes over.

**N is defined as:**
- Weekly unique active users within the project or event membership — for all non-platform votes
- Weekly unique active platform users — for all platform votes

**Weekly unique active users** means users who performed at least one meaningful action (voted, contributed, posted, commented) within the current week, counted once regardless of how many days they were active. A user active four days counts as one.

### Reference Table — Non-Platform (Weekly Unique Active Project or Event Members)

| Weekly active members (N) | Required votes | % of members |
|---|---|---|
| 2 | 2 | 100% |
| 5 | 4 | 80% |
| 10 | 8 | 80% |
| 20 | 15 | 75% |
| 30 | 23 | 77% |
| 50 | 37 | 74% |
| 75 | 52 | 69% |
| 100 | 67 | 67% |
| 150 | 91 | 61% |
| 200 | 107 | 54% |
| 300 | 142 | 47% |
| 500 | 218 | 44% |
| 1,000 | 301 | 30% |
| 5,000 | 515 | 10% |
| 10,000 | 619 | 6.2% |
| 50,000 | 933 | 1.9% |
| 100,000 | 1,123 | 1.1% |
| 1,000,000 | ~2,400 | 0.24% |

### Reference Table — Platform (Weekly Unique Active Users)

| Weekly active users (N) | Required votes | % of users |
|---|---|---|
| 2 | 2 | 100% |
| 10 | 8 | 80% |
| 20 | 15 | 75% |
| 50 | 37 | 74% |
| 100 | 67 | 67% |
| 500 | 218 | 44% |
| 1,000 | 301 | 30% |
| 5,000 | 515 | 10% |
| 10,000 | 619 | 6.2% |
| 50,000 | 933 | 1.9% |
| 100,000 | 1,123 | 1.1% |
| 1,000,000 | ~2,400 | 0.24% |

Both tables use identical formula and structure. The only difference is what N represents.

### Why the Numbers Work This Way

At small scale (10 active members) nearly everyone voting makes sense — every voice is significant in a small collective. At medium scale a healthy engaged portion suffices. At large scale the required absolute vote count keeps growing, ensuring decisions affecting many people carry proportionally greater legitimacy. The percentage falls; the absolute count rises. This is the same principle used by reputable polling organisations worldwide.

---

## 4. Demand and Opposition Signals

Any signed-in user anywhere on the platform may signal either **demand** or **opposition** on any project or event at any point in its lifecycle.

**Demand** signals two things simultaneously:
- Support for the project or event existing and proceeding
- Desire for the output — the finished product, service, or event

**Opposition** signals disagreement with the project or event proceeding.

Signals are not votes. They carry no quorum requirement and do not directly trigger any action. They are always visible on the project or event page as live indicators of broader platform sentiment.

**The demand/opposition ratio:**
```
ratio = demand signals / (demand signals + opposition signals)
```

### Role of Signals in Proposal Advancement

**Non-platform projects and events:**
The ratio must be above 0.66 before a transition vote out of PROPOSAL can be initiated. No quorum on signals themselves — just the ratio. If opposition is high, members should return to discussion before advancing.

**Platform projects and events:**
Both conditions must be met before a transition vote out of PROPOSAL can be initiated:
1. Demand signal count meets the required votes formula (weekly active users as N)
2. Ratio is above 0.66

### Signals Throughout the Lifecycle

Demand and opposition signals remain open at every phase. Growing opposition during planning or activity does not automatically reverse anything, but gives the community the democratic weight to initiate a reversion vote. Members are expected to read the signals and respond.

---

## 5. Phase Transitions

Every phase transition requires a member vote. No transition is automatic.

**All transition votes and plan votes require:**
- Quorum: required votes formula on weekly active project/event members (non-platform) or weekly active platform users (platform)
- Approval: 66% of votes cast

**Plan approval and phase advancement are separate actions.**
A plan vote approves a plan in principle. Multiple plans may be voted on simultaneously; users may approve more than one. When members judge the project is ready to advance, a separate transition vote selects the highest-approved plan above quorum and advances the phase. All other plans are preserved in history.

**Project type is selected during plan creation.** When drafting a plan, the member selects the project sub-type. Different members may propose different sub-types in competing plans. The winning plan determines the type.

**All edits** to a project or event — including title, description, updates, or any other field — require a vote using the required votes formula and 66% approval. There are no unilateral edits by any member including the creator, except in personal service projects and private events.

**Phase reversion** uses the same quorum and 66% approval as any other transition.

---

## 6. Proposal Criteria

During PROPOSAL, members may create and vote on proposal criteria — specific conditions they want planning to address.

- Criteria are voted on and ranked by importance
- Criteria above 50% importance carry forward into planning phases
- Carried criteria are visible to all members during planning as guidance
- Criteria inform plans but do not override plan votes

---

## 7. Project Types

### Productive Projects

A productive project produces outputs to be used or consumed after production — physical goods, built infrastructure, original software. The output exists independently of the act of producing it.

**Sub-types (selected during plan creation):**
- **Regular** — unspecified productive project
- **Software** — produces open source software; see Section 11

**Phases:**
```
PROPOSAL → PRODUCTION_PLAN → DISTRIBUTION_PLAN → ACTIVITY → CLOSE/CONVERT
```
*Reversion available at any phase. Phase 2+ may insert acquisition between planning and activity; see Section 9.*

---

**PROPOSAL**
- Tagged to at least one channel
- Any signed-in user may signal demand (including desire for the output) or opposition
- Proposal criteria created and voted on; above 50% importance carry into planning
- Ratio must exceed 0.66 before transition vote can be initiated
- Transition vote: required formula on weekly active project membership, 66%

**PRODUCTION_PLAN**
- Members draft production plans; any member may submit one
- Member selects project sub-type when drafting
- Plans including in-house means of production enter PENDING state before becoming voteable — see Section 10
- Plan votes: required formula on membership, 66%; users may approve multiple plans
- Transition vote selects highest-approved plan, advances to DISTRIBUTION_PLAN

**DISTRIBUTION_PLAN**
- Members draft and vote on distribution plans specifying how outputs are made available
- Distribution plan must specify:
  - Which outputs are distributed directly to users who signalled demand, and in what proportion
  - The distribution mechanism for direct allocation (default: lottery among all who signalled demand — preferred over first-signal order, which unfairly favours those who monitor new projects constantly)
- For software sub-type: distribution is always open source AGPL v3 — no custom distribution plan required; this is applied as the default
- Same voting process as production plan

**Phase 2+ extension:** acquisition and asset workflows are documented in Section 9.

**ACTIVITY**
- Members carry out the approved work
- Scope locked to approved plans; changes require reversion
- For software sub-type: pull requests raised and voted on within activity; see Section 11

**Closure**
When members judge the project complete or no longer viable, a closure vote is held:
- Required formula on membership, 66%
- On passing, members choose:
  - **Close** — project archived permanently
  - **Convert** — project transforms into a new project type; see Section 12 (Links) for conversion rules

---

### Collective Service Projects

A collective service project coordinates activity that is consumed at the moment it is delivered. The service runs continuously and does not produce a discrete output that outlasts the act of delivering it. A kitchen service, a hairdressing collective, a software maintenance team — these are services.

**Sub-types (selected during plan creation):**
- **Regular** — unspecified collective service
- **Software** — maintains and develops open source software on an ongoing basis; see Section 11
- **Asset Management** — Phase 2+ subtype; see Section 9

**Phases:**
```
PROPOSAL → ORGANISATION_PLAN → ACCESS_PLAN → ACTIVITY → CLOSE/CONVERT
                                                               ↑
                                                  (reversion for plan changes)
```
*Phase 2+ may insert acquisition between ACCESS_PLAN and ACTIVITY; see Section 9.*

---

**PROPOSAL**
- Same as productive projects: channel tag required, demand/opposition signals (including desire to use the service), criteria voting, ratio above 0.66 required

**ORGANISATION_PLAN**
- Member selects sub-type when drafting plan
- Plans including in-house means of production enter PENDING before becoming voteable
- Plan votes and transition vote: required formula on membership, 66%
- Transition advances to ACCESS_PLAN

**ACCESS_PLAN**
- Specifies who can access the service and how
- For software sub-type: access is always open source AGPL v3; no custom access plan required
- Same voting process; transition advances to ACTIVITY in Phase 1

**Phase 2+ extension:** asset-management access rules and acquisition are documented in Section 9.

**ACTIVITY**
- Service runs continuously; project stays in ACTIVITY until closed or reverted
- Plan changes require reversion; service may continue operating during reversion at members' discretion

**Service Requests (non-software)**
For regular collective services, requests are coordination and booking — not governance votes.

- A user, project, or other service submits a request specifying what they need and when
- Members see the request and volunteer to fulfil it if they are available and willing
- If enough members volunteer to meet the request's stated requirements, the activity is scheduled and carried out
- No quorum vote required — this is self-organisation, not governance

**Pull Requests (software sub-type)**
Software service projects handle code changes through the pull request process; see Section 11.

**Changing Plans During Activity**
- To revise the organisation plan: revert to ORGANISATION_PLAN (required formula, 66%), re-run both plan phases
- To revise only the access plan: revert to ACCESS_PLAN, re-vote, transition back to ACTIVITY
- Phase 2+ projects may re-enter acquisition under the rules in Section 9

**Closure**
- Required formula on membership, 66%
- Members choose Close or Convert on passing

---

### Asset Movement And Handoffs

Phase 2+ only. Asset movement and handoff workflows are defined in Section 9 and Section 10.

---

### Personal Service Projects

A single user providing a service. Creator has full and sole authority. **Cannot be tagged to the platform channel.**

**Phases:** `ACTIVITY → CLOSED`

- Must be tagged to at least one channel for discoverability
- No proposal stage; creator begins in ACTIVITY
- All decisions including closure rest with the creator; no vote required
- No sub-types

---

## 8. Event Types

### Public Events

**Phases:** `PROPOSAL → EVENT_PLAN → CLOSED`

- Demand and opposition signals open to any signed-in user throughout
- Proposal criteria voted on; above 50% importance carry into planning
- Ratio must exceed 0.66 before transition vote from PROPOSAL
- All votes: required formula on event membership, 66%
- CLOSED is terminal

### Private Events

**Phases:** `EVENT_PLAN → CLOSED`

- May exist within private communities or directly between users; no channel tag required
- Creator may grant selected members edit abilities
- All decisions rest with the creator

---

## 9. Phase 2+ Extensions: Acquisition

*Not available in Phase 1. Introduced in a subsequent release.*

The acquisition phase applies to Productive and Collective Service projects — including platform-tagged — when approved plans require means of production not already available within collectively owned assets. It sits between the final planning phase and ACTIVITY.

When drafting a plan that includes means of production to be purchased, the plan creator must assign each purchase row to a destination bundle. A bundle simply means a group of purchase rows sharing the same destination asset management service choice.

Each bundle must do one of two things:
- link to an existing asset management service that would take the purchased inventory
- define a new asset management service to be created later, including its name, description, location, and tags

If a bundle points to an existing asset management service, the plan enters **PENDING** until that service confirms both:
- whether any in-house means of production tied to the plan can be used
- whether the service is willing and able to absorb the new purchased inventory

If a bundle points to a new asset management service, no intake approval is required for that bundle before the plan becomes voteable.

### Collective Fund

A single collective fund is created per approved plan. It is itemised with each required means of production, its associated cost, and the purchase link specified in the plan. The fund is transparent and publicly visible. Users contribute collectively until the total is met.

### Existing Assets

Means of production sourceable from collectively owned assets are listed separately. Formal requests go to the relevant asset management service during the plan's **PENDING** stage. By the time acquisition is reached, in-house availability is already known and any remaining rows are genuine purchase targets.

### Board Member Execution

When the fund is fully met, acquisition moves into an execution stage. Board members are notified and obligated to execute purchases on behalf of the collective. The board holds no independent funds and takes no autonomous financial decisions.

Board members provide:
- Purchase ID or evidence of purchase for each item
- Preliminary entry of each purchased asset into the platform asset database with a pending status and assigned asset ID
- Assignment of each pending asset to the existing asset management service chosen in the plan, or to the new asset management service draft that will be created on confirmation
- Their username, publicly visible on the record

Pending asset entries created during execution are visible only inside acquisition until confirmation succeeds.

### Confirmation Vote

- Non-platform: required formula on weekly active project membership, 66%
- Platform: required formula on weekly active users, 66%
- If approved: the execution is accepted as matching the acquisition plan, pending asset entries become live, and each asset is entered into the chosen asset management service inventory. If a new asset management service was specified in the plan, it is created at this point and the plan creator becomes its first member.
- If rejected: execution is flagged, board member standing is affected, pending asset entries do not become live, and acquisition remains open for re-execution

### Reversion and Previously Acquired Assets

If a project reverts from ACTIVITY and revised plans alter what is needed, acquisition is re-entered when advancing again. Previously purchased assets remain in collective ownership and stay in the inventory of their assigned asset management service, where they can be routed into later project use.

---

## 10. Phase 2+ Extensions: Asset System

*Asset holding and management not available in Phase 1. Introduced alongside acquisition. Schema should accommodate assets from Phase 1 with null values.*

### Asset Hierarchy

```
Land Asset
└── Asset Management Collective Service (mandatory, exactly one active service)

Non-Land Asset
└── Asset Management Collective Service (mandatory, exactly one active service)
```

Land assets and non-land assets remain distinct categories. Every asset must have exactly one active asset management collective service. Non-land assets no longer require a parent land asset in the data model, though they may still have a recorded physical location on land or at another service-managed site.

### Land Assets

A land asset is a collectively held parcel of land — the foundational unit of the asset system. Land assets may never be transferred to individual users as private property under any distribution plan.

### Non-Land Assets

Any collectively owned means of production other than land — tools, machinery, vehicles, equipment, materials, software infrastructure, and so on. Entered into the database on acquisition or donation. Each has its own asset page.

### Asset Pages

Every asset has a permanent public asset page:

- **Current location** — which land asset, service location, or other recorded place it currently resides at
- **Current custodian** — which project, service, or individual currently holds it
- **Status** — available / in use by project / borrowed by individual / overdue / damaged / destroyed
- **Full provenance history** — every transfer, borrowing, project use, and status change since entering the collective, in chronological order
- **Home location or home service** — where it normally returns when not in use, when applicable

Assets are never removed from the database. Damage, destruction, loss, or non-return is recorded alongside the responsible party. The record is permanent.

### Inventory Tab

Asset management collective service projects have an **Inventory** tab containing a complete itemised list of assets under their management:

- Asset name, description, current status and custodian
- Borrowing or access policy: **individual borrowing permitted**, **project use only**, or land/site access rules where relevant
- Full usage history

**Setting borrowing or access policy** for each asset is decided by member vote: required formula on asset management service membership, 66%. Can be changed by vote at any time.

### Project Use of Assets

When a project plan requires use of an in-house asset, the plan enters **PENDING** state rather than going immediately to vote. This happens at the plan creation stage.

- The system automatically sends a request to the relevant asset management service, including the timeframe specified by the plan creator
- If the plan also includes purchase rows assigned to an existing asset management service, that same service must confirm that it can absorb the new inventory as well
- Asset management service members vote on whether the asset is available for that timeframe and whether the existing service can take the new inventory: required formula on service membership, 66%
- If approved: the request is confirmed and the plan becomes voteable
- If declined: the plan creator may edit their plan freely while it stays in **PENDING**, whether by changing the destination service, changing the in-house asset dependency, removing the requirement, or opting to purchase instead

This ensures that by the time a plan goes to vote, all in-house asset availability is already confirmed. The acquisition list at that point reflects only what genuinely needs to be purchased.

### Individual Borrowing

When a non-land asset is marked as available for individual borrowing, any user may request to borrow it — no vote required.

- User submits a borrowing request: asset, purpose, intended return date
- Request appears in the relevant asset management service's requests tab
- Members coordinate pickup and transfer with the borrowing user
- Borrowing recorded on the asset page: user, date borrowed, expected return

**Overdue and damaged assets:** If an asset is not returned, the asset management service continues to communicate with the borrower. The asset remains in the database with status overdue and the borrower as current custodian. If damaged or destroyed during use — whether by an individual borrower or a project — this is recorded on the asset page alongside the responsible party. No automated penalty exists. Accountability is through transparent permanent record-keeping. Some borrowed things are not returned or are damaged; this is the nature of collective ownership and library-style systems.

### Acquisition Inventory Tab

When a project completes an acquisition phase, its acquisition record remains visible as a permanent itemised list on the project page. Each resulting asset links to the full asset page, and the live inventory entry itself belongs to the chosen asset management service rather than becoming a separate custody pool on the project.

---

## 11. Software Projects

Software is a sub-type available to both Productive and Collective Service projects. All standard governance rules apply with the additions below.

### The Distinction

- **Productive software project** — builds original software (a new application, tool, or platform feature). Produces a discrete output.
- **Collective service software project** — maintains, improves, and develops existing software on an ongoing basis (bug fixes, improvements, ongoing development). The service is continuous.

### Licence

All software produced or maintained on this platform uses the **GNU Affero General Public License v3 (AGPL v3)**. Reasons:

- Forces all derivative works to remain open source
- Closes the service loophole present in standard GPL — running modified software as a network service requires publishing those modifications
- Prevents corporate capture: no party can take platform-produced software, modify it, and run it as a closed proprietary product
- Ensures all software produced here remains permanently in the commons

### Repository

When drafting a software project plan, the member must attach a link to a public GitHub repository containing the codebase under AGPL v3. This repository is attached to the plan.

- If the plan is not approved, the member may delete the repository
- If the plan is approved, the repository becomes the project's official codebase
- The plan creator initially holds **pull request merge capability** for this repository

All data — repository URLs, pull request IDs, approval votes, merge IDs, confirmation votes — is stored in a structured format designed for future bot compatibility. The platform does not rely on a bot now, but the data is recorded so automation can take over cleanly when ready. A future goal is migration to a self-hosted peer-to-peer git system (such as Gitea/Forgejo, or eventually a decentralised protocol like Radicle) that cannot be removed under external pressure, with a bot that automatically tracks approvals and executes pull requests without human intervention. The data structures built now are designed with this in mind.

### Pull Request Merge Capability

Merge capability is a scoped technical role — the ability to merge approved pull requests into the official repository. It is not a governance privilege.

- The creator of the accepted plan initially holds merge capability
- Members may grant merge capability to additional members or reassign it by vote: required formula on weekly active project membership, 66%
- Merge capability carries no additional voting weight or authority

### Pull Request Flow

During ACTIVITY, any member may raise a pull request:

1. Member creates a pull request in the project's GitHub (or equivalent) repository
2. Member submits the pull request ID to the project
3. Members vote to approve: required formula on weekly active project membership, 66%
4. If approved: members holding merge capability are expected to execute the merge
5. Executing member records the merge ID in the platform
6. Members vote to confirm the merge occurred: required formula on weekly active project membership, 66%
7. If confirmed: pull request closed and permanently recorded in project history with the merge ID

All steps are stored and linked to the pull request ID for future bot compatibility.

### Fallback: Repository Replacement

If an approved pull request is not executed by any member holding merge capability — due to inactivity, disagreement, or any other reason — the community is not blocked. Any member may:

1. Create a new repository containing: the AGPL v3 licence, the existing codebase, and the approved changes already applied
2. Submit the new repository URL to the project
3. Members vote to approve the new repository and designate its submitter as the new merge capability holder: required formula on weekly active project membership, 66%
4. If approved: new repository becomes the official codebase; previous repository recorded as legacy in project history; submitter holds merge capability

This is not a new project — it is a repository replacement within the same project. The AGPL v3 licence guarantees the legal right to do this. The platform formalises it as an explicit governance mechanism to ensure no individual can block progress by withholding merge execution.

This process is temporary by design. When a bot is introduced, it will execute approved pull requests automatically, making the merge capability role and the fallback process unnecessary.

### Platform Software Projects

For platform-tagged software projects, merge capability is held by board members rather than plan creators. The same pull request flow applies, with votes using the required formula on weekly active users and 66% approval.

---

## 12. Links

Every project has a **Links** tab showing its connections to other projects in the production network.

### Auto-Created Links

Links are created automatically when:

- **A project is converted** — the new project is permanently linked to its historical predecessor; this link cannot be removed

Phase 2+ also auto-creates links from approved in-house asset requests (Section 9).

### Manually Requested Links

Any project member may propose a manual link to another project. The link requires a vote from both projects:
- Required formula on each project's membership, 66% approval in both

### What the Links Tab Shows

On each project page, the Links tab shows:
- **Direct predecessors** — projects that supply inputs to this one (e.g. the farm that supplies produce to the kitchen)
- **Direct successors** — projects that use outputs from this one (e.g. the kitchen that uses the farm's produce)
- **Further connections** — links continue along the chain so a farm also shows the warehouse its produce passes through and the kitchen it ultimately supplies
- **Historical project** — for converted projects, the predecessor is permanently displayed

### Project Conversion

When a closure vote passes and members choose Convert:

- Members specify the new project type and sub-type
- The new project inherits all inventory from the closing project
- A permanent link is created between the closing project and the new one
- The new project begins in its appropriate first phase (PROPOSAL or, for personal service, ACTIVITY)

Common conversion paths:
- Productive → Collective Service (building a warehouse → operating an asset-management service for that site)
- Productive Software → Collective Service Software (building an application → maintaining and developing it)

### Platform-Wide Production Web

The links graph across all projects forms a network showing the full chain and web of collective production on the platform. For example:

```
Community farm (productive) → produces vegetables and meat
  → Asset-management service at warehouse records intake and custody
  → Community kitchen service (collective service) acquires from that asset-management service
  → Users consume meals at the kitchen (asset destroyed on consumption)
```

A platform-wide view traversing this graph is a planned future feature. The link data structure is built from Phase 1 to support it. Individual project link tabs are available from Phase 1.

---

## 13. Platform Projects

Any user may create a platform-tagged project or event. Board members have no gatekeeping role over creation or phase transitions. Their sole role is executing collectively approved decisions.

The platform channel covers **everything relating to the platform** — code, infrastructure, hardware, hosting, events, celebrations, and any other matter concerning the platform and its collective maintenance.

**Only Productive and Collective Service project types may carry the platform tag.** Personal service projects cannot.

**Distribution and access defaults:** Platform project outputs are the platform itself, freely available. No distribution or access plan phases are required; applied as implicit defaults. Platform software projects use AGPL v3.

Phase 2+ adds acquisition behavior for platform projects when plans require physical means of production (Section 9).

All platform votes use **weekly unique active platform users** as N.

**Proposal advancement for platform projects requires:**
1. Demand signal count meets required votes formula (weekly active users as N)
2. Ratio above 0.66

Both conditions must be met before a transition vote can be held.

---

### Platform Productive Projects

**Phases:**
```
PROPOSAL → PRODUCTION_PLAN → ACTIVITY → PENDING_EXECUTION → CLOSED
                                                        ↘ CLOSED (abandoned)
```

**PROPOSAL** — signal quorum and ratio > 0.66 required; transition vote: required formula, weekly active users, 66%

**PRODUCTION_PLAN** — plans voted independently; transition selects highest-approved plan; no distribution plan phase (defaults apply)

**Phase 2+ extension:** acquisition can be inserted between PRODUCTION_PLAN and ACTIVITY under Section 9 rules.

**ACTIVITY** — members carry out approved work; scope changes require reversion; software sub-type: pull requests here

**ACTIVITY → PENDING_EXECUTION** — initiated when work complete, with link to pull request or evidence; required formula, weekly active users, 66%; vote question: "Does this work faithfully deliver the approved plan?"

**ACTIVITY → CLOSED (abandonment)** — required formula, weekly active users, 66%

**PENDING_EXECUTION → CLOSED (completed)**
- Board member executes (merge, deployment, or other); provides Merge ID or evidence; username publicly recorded
- Confirmation vote: required formula, weekly active users, 66%
- If approved: CLOSED
- If rejected: execution flagged, board member standing affected, returns to PENDING_EXECUTION

**Phase Reversion** — required formula, weekly active users, 66%

---

### Platform Collective Service Projects

Ongoing platform maintenance — upkeep, bug fixing, continuous improvement, hosting, and any other continuing platform service.

**Phases:**
```
PROPOSAL → ORGANISATION_PLAN → ACTIVITY (with in-activity requests) → CLOSED
                                ↑ (reversion)
```

**PROPOSAL** — signal quorum and ratio > 0.66 required; transition vote: required formula, weekly active users, 66%

**ORGANISATION_PLAN** — plans voted independently; transition selects highest-approved plan; no access plan phase (defaults apply)

**Phase 2+ extension:** acquisition can be inserted before ACTIVITY under Section 9 rules.

**ACTIVITY** — service runs continuously; plan changes by reversion

**In-Activity Requests (platform collective service)**

Individual tasks — bug fixes, minor improvements, routine maintenance — are handled as requests within ACTIVITY. The project never leaves ACTIVITY for these.

1. Any member raises a request describing the work
2. Members vote to approve: required formula, weekly active users, 66%
3. If approved: a board member executes the work, provides Merge ID or evidence; username publicly recorded
4. Members vote to confirm execution: required formula, weekly active users, 66%
5. Request, vote record, execution record, and confirmation permanently logged in project history

If execution rejected in confirmation vote: flagged, board member standing affected, request returns to approved status awaiting re-execution.

**ACTIVITY → CLOSED** — required formula, weekly active users, 66%

**Phase Reversion** — required formula, weekly active users, 66%

---

### Platform Events

Covers anything relating to the platform — celebrations, gatherings, conferences, and any event under the platform channel.

**Phases:** `PROPOSAL → EVENT_PLAN → CLOSED`

- Signal quorum and ratio > 0.66 required before transition from PROPOSAL
- All votes: required formula, weekly active users, 66%

---

## 14. Board Members

Board members hold platform execution privileges: code merge access and financial execution on behalf of the collective. The board holds **no independent funds, no wages, and no autonomous authority of any kind**. They act solely as delegates of the platform's user base, executing only what has been collectively approved.

### Continuous Approval Standing

Board members are listed in the **Board Members tab** of the platform channel. Each board member's standing is publicly visible at all times:

```
username  YES: 412  NO: 89  Approval: 82%
```

Any signed-in user may cast a YES or NO vote on any board member at any time. Users may change their vote at any time. There is no periodic vote or removal process — approval standing is live and continuous.

**To remain a board member**, a member must maintain:
1. An approval rating of at least 66%
2. A total vote count (YES + NO) meeting the required votes formula based on weekly active users

If either condition falls below threshold, the board member is automatically removed from their position.

**Grace period:** If a sudden spike in weekly active users causes the quorum requirement to jump — raising the required vote count — a board member has a **2-week grace period** to accumulate sufficient votes before automatic removal triggers, provided their approval ratio remains above 66%.

**Vote clearing:** Votes from users who have been inactive for 100 or more consecutive days are cleared from a board member's standing count. This prevents long-departed users from permanently anchoring a board member's position without ongoing community support.

### Becoming a Board Member

Any user may publicly volunteer for a board member position. They appear in the Board Members tab under "Seeking Position." They become an active board member when:

1. Their total YES + NO votes meet the required votes formula (weekly active users)
2. Their approval rating exceeds 66%

Both conditions must be met simultaneously.

### Stepping Down

A board member may step down at any moment by their own decision.

### Execution and Accountability

When a board member's execution is rejected in a confirmation vote, this is recorded publicly on their board member page. The community may respond by shifting YES votes to NO. There is no separate formal removal process — the standing system handles accountability.

---

## 15. Phase 1 Scope

This section separates launch behavior from deferred mechanics so implementation can stay strict in Phase 1 while keeping the full governance model documented.

### Phase 1 Launch (Available Now)

- Productive projects (regular and software)
- Collective service projects (regular and software)
- Personal service projects
- Public and private events
- Full governance and voting system: demand/opposition signals, required-votes formula, phase transitions, plan voting, and criteria
- Platform projects and board member standing system
- Pull requests and merge capability for software projects
- Links tab for direct project links (data structure supports future wider traversal)
- Channels, communities, and tagging

### Deferred to Phase 2+

- Acquisition phase
- Asset system (land assets, non-land assets, asset pages, inventory tabs, provenance tracking)
- Individual borrowing system
- Project use asset requests and plan PENDING state tied to asset availability
- Asset-management collective service subtype
- Platform-wide production web visualisation (link graph already captured in Phase 1 data)

**Schema note:** Asset fields (land asset association, inventory, provenance) should exist in the database schema from Phase 1 with null values. Projects and assets should be structured so that acquisition records, inventory tabs, and asset pages can be added to existing entities without migration complexity.

---

## 16. Quick Reference

### Universal Rule
**66% approval of votes cast. Always. No exceptions.**

### Required Votes Formula

```
E(N):
  N < 100:        0.10 − (0.03 × (N − 1) / 99)
  100 ≤ N < 500:  0.07 − (0.02 × (N − 100) / 400)
  N ≥ 500:        max(0.02, 0.05 − 0.03 × log₁₀(N/500) / log₁₀(2000))

n₀ = 0.9604 / E²
cochran(N) = ceil( n₀ / (1 + (n₀ − 1) / N) )
required = min( ceil(0.75 × N), cochran(N) )

N = weekly active project/event members (non-platform)
N = weekly unique active users (platform)
```

### Project and Event Sub-Types

| Type | Sub-types |
|---|---|
| Productive | Regular, Software |
| Collective Service | Regular, Software (Phase 1), Asset Management (Phase 2+) |
| Personal Service | None (creator controlled) |
| Public Event | None |
| Private Event | None (creator controlled) |

### Demand and Opposition — Proposal Advancement

| Type | Condition to initiate transition vote |
|---|---|
| Non-platform projects and events | Ratio > 0.66 |
| Platform projects and events | Signal count meets required formula AND ratio > 0.66 |
| Personal service, private event | None |

### Phase Maps

```
Productive (regular):
PROPOSAL → PRODUCTION_PLAN → DISTRIBUTION_PLAN → ACTIVITY → CLOSE/CONVERT

Productive (software):
PROPOSAL → PRODUCTION_PLAN → ACTIVITY (pull requests) → CLOSE/CONVERT

Collective Service (regular):
PROPOSAL → ORGANISATION_PLAN → ACCESS_PLAN → ACTIVITY (service requests) → CLOSE/CONVERT

Collective Service (software):
PROPOSAL → ORGANISATION_PLAN → ACCESS_PLAN → ACTIVITY (pull requests) → CLOSE/CONVERT

Personal Service:
ACTIVITY → CLOSED (creator controlled)

Public Event:
PROPOSAL → EVENT_PLAN → CLOSED

Private Event:
EVENT_PLAN → CLOSED (creator controlled)

Platform Productive:
PROPOSAL → PRODUCTION_PLAN → ACTIVITY → PENDING_EXECUTION → CLOSED
                                                        ↘ CLOSED (abandoned)

Platform Collective Service:
PROPOSAL → ORGANISATION_PLAN → ACTIVITY (in-activity requests) → CLOSED
                                ↑ (reversion)

Platform Event:
PROPOSAL → EVENT_PLAN → CLOSED

Phase 2+ only: acquisition and asset workflows are defined in Section 9 and Section 10
```

### All Votes at a Glance

| Context | N (quorum denominator) | Approval |
|---|---|---|
| All non-platform project/event votes | Weekly active project/event members | 66% |
| All platform votes | Weekly active users | 66% |
| Pull request approval | Software project members | 66% |
| Pull request confirmation | Software project members | 66% |
| Repository replacement | Software project members | 66% |
| Merge capability assignment | Software project members | 66% |
| Manual link request | Both linked projects' members | 66% each |
| Board member standing | Weekly active users | 66% (continuous) |
| Personal service / private event | Creator only | — |

### Key Rules at a Glance

- 66% approval always
- No transition automatic — all require member votes
- Plan approval and phase advancement are separate votes
- Project sub-type selected during plan creation; winning plan determines type
- Demand signals also express desire for the finished product or service
- All edits (title, description, updates) require a vote — no unilateral changes except personal service and private events
- Productive projects produce outputs used/consumed later; collective services produce activity consumed immediately — these are distinct and each is its own project
- Distribution lottery preferred for direct allocation to demand-signallers
- All software projects use AGPL v3; pull request merge capability is a scoped technical role
- Repository replacement is an explicit right — no individual can block an approved pull request permanently
- Service requests for non-software collective services are coordination/booking, not governance votes
- Board member standing is continuous and live — no separate removal vote; automatic removal if approval or quorum falls below threshold
- Grace period of 2 weeks if weekly active user spike temporarily raises quorum requirement
- Votes from users inactive 100+ days are cleared from board member standing counts
- Links auto-created on project conversion in Phase 1
- Converted projects permanently link to their historical predecessor; inventory ports over
- Acquisition and asset system are Phase 2+; full detail in Section 9 and Section 10
