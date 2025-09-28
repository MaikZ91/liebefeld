// Shim to satisfy TypeScript when Supabase edge runtime types reference
// `npm:openai@^4.52.5` in Deno. This avoids build-time type resolution errors
// in the local Vite/TS pipeline. It does not affect runtime behavior.

declare module 'npm:openai@^4.52.5' {
  const OpenAI: any;
  export default OpenAI;
}

declare module 'npm:openai' {
  const OpenAI: any;
  export default OpenAI;
}
