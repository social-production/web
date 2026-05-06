# Product Model

## Purpose

This document defines the product model the web frontend must express.

It should stay aligned with the mock app and the planning docs, but it should describe the model in frontend terms so the SvelteKit implementation stays coherent.

## Core Content Families

### Projects

Projects are the main structured work surface.

They exist to organize activity for production or service work.

Project types in the current model:

- Production: collective manufacture, growing, building
- Service: skills, labor, care, maintenance, mutual aid, land asset management, storage management, and other non-production work organized through full projects

Projects are where long-running organization happens. They are not lightweight social posts.

### Threads

Threads are lighter discussion surfaces.

They are used for open discussion, coordination, and tagged conversation, but they are not full project governance surfaces.

### Standalone Events

Standalone events are one-off social or organizational gatherings.

They are distinct from project activity.

Examples:

- classes
- meetups
- protests
- celebrations
- social gatherings

Standalone events can be public and tagged to channels or communities, or private between users.

### Posts

Posts are native personal-feed content.

They are user-first, follow-based content rather than topic-first content.

Posts primarily live in Personal and flow through follower relationships.

### Communities

Communities are social coordination spaces for groups with shared identity, place, or affiliation.

They are not separate asset-holding units and they do not replace project governance.

Communities can be open or private. Private communities may require invite access, but they still do not become the only access path to project visibility or project organization.

### Channels

Channels are topic-based public discovery surfaces.

They gather tagged projects, threads, and standalone events.

Channels are always public.

### Notifications

Notifications are the unified inbox for project, governance, and logistics updates.

They are distinct from direct messages.

### Messages

Messages are private direct or group conversations.

They stay separate from channels, communities, and project discussion.

### Profiles

Profiles show a person’s identity, activity, following/follower relationships, project roles, and channel/community links.

### Search

Search is a cross-entity discovery surface for projects, threads, events, channels, communities, and people.

## Project-Internal Activity

Project activity means internal work-linked coordination inside a project.

Examples:

- work sessions
- planning meetings
- check-ins
- review points
- other scheduled project coordination

Project activity is not a standalone event.

## Relationship Rules

- projects can link to projects
- projects must always tag at least one channel
- projects may also tag communities, but communities can only add context and cannot be the only tag on a project
- threads tag channels and communities
- standalone events tag channels and communities, or remain private between users
- posts live on personal feeds and travel through follow relationships
- channels and communities help discovery and context, but do not own projects

## Roles

### Project Managers

Users become project managers by creating a project or through project governance.

### Moderators

Moderators operate on channels and communities.

### Board Members

Board members are the moderators of the Platform channel and also the legal board layer for the nonprofit organization.

## Visible Confidence Rule

Project managers, moderators, and board members all depend on a visible positive ratio to remain in position.

The current placeholder threshold is 70 percent, but that should still be treated as adjustable product policy rather than hard-coded final doctrine.

The frontend should show that the ratio exists and matters.

## Platform Naming Rule

Use Platform for the public governance surface and board context.

Do not call ordinary project managers of land asset management or storage management service projects platform managers.

They are project managers of service projects.

## Asset Model For Frontend Planning

The first web frontend should be designed so legal asset-holding and community funding modules can be turned on later without requiring a major frontend rewrite.

They should be off by default until the organization is ready, and the rest of the platform should function cleanly when they are disabled.

Still, the frontend docs should preserve the later-phase model:

- land assets are tied to land asset management service projects
- other assets are linked to a land asset or to a storage management service project
- storage management service projects are themselves tied to land assets which are tied to land management service projects
- ownership remains collective even when service projects manage custody or access

This matters for naming and later extensibility even if the first web prototype does not fully ship these flows.