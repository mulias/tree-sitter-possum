/**
 * @file A tiny text parsing language
 * @author Elias Mulhall <eli.mulhall@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "possum",

  extras: $ => [/\s/, $.comment],

  conflicts: $ => [
    [$.spread_op, $.object_spread],
    [$.range_op, $.lower_bounded_range_op],
  ],

  rules: {
    source_file: $ => repeat($.top_level),

    top_level: $ => seq($.expression, $.expression_sep),

    comment: $ => token(prec(-1, /#[^\n]*/)),

    expression_sep: $ => choice(";", "\n", "\0"),

    expression: $ => expressionHelp($, $.operand, $.expression),

    value: $ => expressionHelp($, alias($.operand, $.value_operand), $.value),

    spread_op: $ => "...",
    negate_op: $ => "-",
    range_op: $ => prec.dynamic(10, ".."),
    lower_bounded_range_op: $ => "..",
    upper_bounded_range_op: $ => "..",
    or_op: $ => "|",
    take_right_op: $ => ">",
    take_left_op: $ => "<",
    merge_op: $ => "+",
    backtrack_op: $ => "!",
    destructure_op: $ => "->",
    return_op: $ => "$",
    subtract_op: $ => "-",
    sequence_op: $ => "&",
    assign_op: $ => "=",
    conditional_then_op: $ => "?",
    conditional_else_op: $ => ":",

    operand: $ => choice(
      $.boolean,
      $.null,
      $.string,
      $.number,
      $.parser_variable,
      $.value_variable,
      $.underscore_variable,
      $.array,
      $.object,
    ),

    boolean: $ => choice("true", "false"),

    null: $ => "null",

    string: $ => choice(
      seq(
        '"',
        repeat(choice(
          alias($.double_string_fragment, $.string_fragment),
          $.interpolation,
          $.escape_char,
          $.escape_unicode,
        )),
        '"',
      ),
      seq(
        "'",
        repeat(choice(
          alias($.single_string_fragment, $.string_fragment),
          $.interpolation,
          $.escape_char,
          $.escape_unicode,
        )),
        "'",
      ),
      seq("`", repeat(token.immediate(prec(0, /[^\n`]/))), "`"),
    ),

    double_string_fragment: $ => token.immediate(prec(0, /[^\n\\"%]+/)),

    single_string_fragment: $ => token.immediate(prec(0, /[^\n\\'%]+/)),

    interpolation: $ => seq(token.immediate("%("), $.expression, ")"),

    escape_char: $ => token.immediate(prec(1, /\\[\\"\'ntbrafv0%]/)),

    escape_unicode: $ => token.immediate(/\\u[0-9a-fA-F]{6}/),

    number: $ => token(/(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/),

    parser_variable: $ => token(seq(
      optional("@"),
      optional(repeat("_")),
      /[a-z][a-zA-Z0-9_]*/,
    )),

    value_variable: $ => token(seq(
      optional("@"),
      optional(repeat("_")),
      /[A-Z][a-zA-Z0-9_]*/,
    )),

    underscore_variable: $ => token(repeat1("_")),

    array: $ => choice(
      seq('[', commaSep($.value), ']'),
    ),

    object: $ => seq(
      '{',
      commaSep(choice(
        $.object_pair,
        $.object_spread,
      )),
      '}',
    ),

    object_pair: $ => seq(
      field('key', $.value),
      ':',
      field('value', $.value),
    ),

    object_spread: $ => prec.dynamic(10, seq("...", $.expression)),

    conditional: $ => seq(
      $.conditional_then_op,
      $.expression,
      $.conditional_else_op,
    ),

    call_or_define_function: $ => seq(
      "(",
      commaSep($.expression),
      ")",
    ),
  }
});

function expressionHelp($, operand_rule, exp_rule) {
  return choice(
    operand_rule,
    seq("(", exp_rule, ")"),
    prec(11, postfix(exp_rule, $.call_or_define_function)),
    prec(10, prefix($.spread_op, exp_rule)),
    prec(9, prefix($.return_op, $.value)),
    prec(8, prefix($.negate_op, exp_rule)),
    prec(7, prefix($.upper_bounded_range_op, exp_rule)),
    prec(6, postfix(exp_rule, $.lower_bounded_range_op)),
    prec.left(5, infix(exp_rule, $.range_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.or_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.take_right_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.take_left_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.merge_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.backtrack_op, exp_rule)),
    prec.left(4, infix(exp_rule, $.destructure_op, $.value)),
    prec.left(4, infix(exp_rule, $.return_op, $.value)),
    prec.left(4, infix(exp_rule, $.subtract_op, exp_rule)),
    prec.left(3, infix(exp_rule, $.sequence_op, exp_rule)),
    prec.right(2, infix(exp_rule, $.conditional, exp_rule)),
    prec.right(1, infix(exp_rule, $.assign_op, exp_rule)),
  );
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 * @param {Rule} rule
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 * @param {Rule} rule
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function surround(rule, skip) {
  return seq(skip, rule, skip);
}

function prefix(op, right) {
  return seq(field("prefix_op", op), field("right", right));
}

function infix(left, op, right) {
  return seq(field("left", left), field("infix_op", op), field("right", right));
}

function postfix(left, op) {
  return seq(field("left", left), field("postfix_op", op));
}
