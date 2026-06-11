// Design tokens — single source of truth, shared by web + mobile (design-system skill §1).
//
// ⚠️ Brand palette / typography / logo are TBD. The values below are NEUTRAL
// placeholders — do NOT treat these colors as the brand. Replace once the visual
// spec lands, then update the design-system skill.
//
// Layering: primitive (raw scales) → semantic (named roles) → components consume semantic.

export const primitive = {
  gray: {
    0: "#ffffff",
    50: "#f7f7f8",
    100: "#ececee",
    300: "#c7c7cc",
    500: "#8e8e93",
    700: "#48484a",
    900: "#1c1c1e",
    1000: "#000000",
  },
  // PLACEHOLDER accent — not the brand color.
  accent: "#5b5bd6",
} as const;

export const semantic = {
  bg: { surface: primitive.gray[0], muted: primitive.gray[50] },
  text: { default: primitive.gray[900], muted: primitive.gray[500] },
  border: primitive.gray[100],
  accent: primitive.accent,
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;
export const radius = { sm: 4, md: 8, lg: 16, full: 9999 } as const;
