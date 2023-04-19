
export const WILDCARD = "*";
export const DELIMITER = ".";
const SYM_PREFIX = "dot-notation"; // + Math.trunc(Math.random() * 9999_9999);
export const SYM_DIRECT_GET = Symbol.for(SYM_PREFIX + ".direct_get");
export const SYM_DIRECT_SET = Symbol.for(SYM_PREFIX + ".direct_set");
/**
 * @enum {Symbol}
 */
export const Symbols = {
  directlyGet: SYM_DIRECT_GET,
  directlySet: SYM_DIRECT_SET,
};