// The slide object model is the canonical contract from @gyaan/dsl. The renderer
// no longer vendors its own copy; it re-exports the DSL types here so the public
// `@gyaan/renderer/types` surface stays intact.
export * from '@gyaan/dsl';
export * from './effects';
