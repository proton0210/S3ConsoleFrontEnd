'use strict';

// Keep every recursive AST walker below the JS stack limit. The parser also
// applies this bound before constructing another nested brace or parenthesis.
module.exports = depth => {
  if (depth > 128) {
    const error = new RangeError('Brace pattern nesting exceeds the maximum depth of 128');
    error.code = 'ERR_BRACES_DEPTH';
    throw error;
  }
};
