# Tables braces security fork

Source: `braces@3.0.3`, https://github.com/micromatch/braces/tree/3.0.3.
The upstream MIT license and authorship are retained in LICENSE and package.json.
This private fork is identified as `@serverlesscreed/braces@3.0.3-tables.1`;
it is not an upstream release and is not published to npm.

Addresses CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm by bounding nesting to 128
in the parser (braces and parentheses) and each recursive AST walker (compile,
expand, stringify). Excessive nesting throws a controlled RangeError with code
ERR_BRACES_DEPTH before exhausting the JavaScript call stack. Direct AST inputs
are guarded as well as string patterns. Existing maxLength and rangeLimit checks
remain in place. Normal patterns retain upstream behavior.

The root npm override selects this fork for Tailwind, micromatch, fast-glob,
and chokidar. The fork's identity means npm audit cannot track future upstream
braces advisories for this copy: upstream advisories must also be reviewed here.
Do not treat a clean npm audit result as a security audit of this vendored source.
Replace the fork with a tested upstream fix when one becomes available.

Patch files: lib/depth.js, lib/parse.js, lib/compile.js, lib/expand.js, and
lib/stringify.js. Regression coverage lives in tests/bracesSecurity.test.ts.
