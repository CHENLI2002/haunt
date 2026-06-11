// Lets `tsc --noEmit` resolve side-effect CSS imports (e.g. `import "./globals.css"`).
// At runtime Next handles CSS via its bundler; this is purely for type-checking.
declare module "*.css";
