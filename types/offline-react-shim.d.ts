// OFFLINE-ONLY shim, used solely by tsconfig.offline.json when @types/react is NOT installed (see scripts/typecheck.mjs).
// The normal tsconfig.json never includes this file, so it cannot shadow the real React types.
// Packages that ship their own types (react-icons) are deliberately NOT shimmed.
declare module 'react' {
  export type ReactNode = any;
  export type FormEvent<T = any> = any;
  export type ChangeEvent<T = any> = any;
  export type CSSProperties = Record<string, string | number>;
  export interface SVGAttributes<T> { [attr: string]: any }
  export namespace JSX { interface Element {} }
  export const StrictMode: any;
  export function useState<T>(v: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
  export function useEffect(f: () => void | (() => void), d?: any[]): void;
  export function useRef<T = any>(v?: T | null): { current: T };
  export function useMemo<T>(f: () => T, d: any[]): T;
  export function useCallback<T extends (...a: any[]) => any>(f: T, d: any[]): T;
  export function useId(): string;
  const React: any;
  export default React;
}
declare module 'react/jsx-runtime' { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare module 'react-dom/client' { export function createRoot(el: Element): { render(n: any): void }; }
declare namespace JSX { interface IntrinsicElements { [tag: string]: any } interface IntrinsicAttributes { key?: any } interface Element {} }
