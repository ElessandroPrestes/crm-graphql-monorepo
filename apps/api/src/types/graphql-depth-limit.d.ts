declare module 'graphql-depth-limit' {
  import type { ValidationRule } from 'graphql';

  interface DepthLimitOptions {
    ignore?: string[];
  }

  export default function depthLimit(maxDepth: number, options?: DepthLimitOptions): ValidationRule;
}
