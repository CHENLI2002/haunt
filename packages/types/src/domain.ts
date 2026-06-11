// Domain types — the venue-first model.
// Authoritative schema: docs/venue-first-tech-plan.md §3
// Invariants: .claude/skills/data-model. DO NOT collapse this into an event-centric shape,
// and do NOT denormalize the venue/performance split away.

export type UUID = string;
export type ISODateTime = string;

export type FollowTarget = "venue" | "artist";
export type EventSource = "manual" | "ig" | "backfill";
export type EventStatus = "scheduled" | "cancelled" | "past";

/** Fan. Backed by Supabase Auth (auth.users); this is the public profile row. */
export interface Profile {
  id: UUID;
  displayName: string | null;
  createdAt: ISODateTime;
}

/** Root entity. A place people haunt. */
export interface Venue {
  id: UUID;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  vibeDesc: string | null;
  heroMedia: string | null;
  igAccountId: string | null;
  igHandle: string | null;
  claimedBy: UUID | null;
  createdAt: ISODateTime;
}

/** Root entity. An act. */
export interface Artist {
  id: UUID;
  slug: string;
  name: string;
  bio: string | null;
  heroMedia: string | null;
  claimedBy: UUID | null;
  createdAt: ISODateTime;
}

/** A show at a venue. */
export interface Event {
  id: UUID;
  venueId: UUID;
  startsAt: ISODateTime;
  title: string | null;
  status: EventStatus;
  source: EventSource;
  createdAt: ISODateTime;
}

/** M:N artist × event — "artist X plays at venue Y on date Z". The differentiator. */
export interface Performance {
  id: UUID;
  eventId: UUID;
  artistId: UUID;
  billingOrder: number | null;
  setlist: unknown | null;
  createdAt: ISODateTime;
}

/** Polymorphic follow — follow-venue is first-class, same table as follow-artist. */
export interface Follow {
  id: UUID;
  userId: UUID;
  targetType: FollowTarget;
  targetId: UUID;
  createdAt: ISODateTime;
}

/** v2 — a one-line live note (≤140), not a rating. */
export interface LiveNote {
  id: UUID;
  userId: UUID;
  eventId: UUID;
  venueId: UUID;
  body: string;
  createdAt: ISODateTime;
}
