/**
 * @file A tiny text parsing language
 * @author Elias Mulhall <eli.mulhall@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "possum",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
