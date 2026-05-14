/// <reference types="vite/client" />

// Vite's `?url` suffix returns a string. The default Vite client types cover
// `.svg`, `.png`, etc., but not `.woff` — declare it here for our font imports.
declare module '*.woff?url' {
  const src: string
  export default src
}

declare module '*.woff2?url' {
  const src: string
  export default src
}
