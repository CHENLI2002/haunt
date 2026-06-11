# mobile — Expo (React Native)

**v1, not v0.** The decision (plan §11-3) is to validate the follow primitive on Web/PWA first; the native app ships in v1. This directory is a **skeleton** so the monorepo wiring (shared `@haunt/*` packages, TS types) is in place.

Conventions: [mobile-app skill](../../.claude/skills/mobile-app/SKILL.md) — expo-router, Supabase anon key + RLS, Expo Notifications push fanout, shared design tokens.

> When starting v1 in earnest, consider re-initializing with `npx create-expo-app` to pin the exact Expo/React Native/React versions; the versions here are indicative.
