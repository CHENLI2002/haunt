// AUTO-GENERATED PLACEHOLDER — do not rely on this shape.
//
// Replace by running:  pnpm db:types
// (supabase gen types typescript --local > packages/types/src/database.types.ts)
//
// Until the real types are generated from the live schema, this minimal stand-in
// keeps the workspace typechecking. Hand-written domain types live in ./domain.ts.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      }
    >;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
