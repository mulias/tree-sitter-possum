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
    source_file: $ => repeat($.statement),

    statement: $ => choice($.parser_def, $.value_def, $.main_parser),

    parser_def: $ => prec(20, seq(
      field("name", $.parser_variable),
      optional(field("params", alias($.parser_fn_args_or_params, $.parser_fn_params))),
      $.assign_op,
      field("body", $.expression),
      $.expression_sep,
    )),

    value_def: $ => prec(20, seq(
      field("name", $.value_variable),
      optional(field("params", alias($.value_fn_args_or_params, $.value_fn_params))),
      $.assign_op,
      field("body", $.value),
      $.expression_sep,
    )),

    main_parser: $ => seq($.expression, $.expression_sep),

    comment: $ => token(prec(-1, /#[^\n]*/)),

    expression_sep: $ => choice(";", "\n", "\0"),

    expression: $ => choice(
      $.operand,
      seq("(", $.expression, ")"),
      prec(12, postfix($.value_variable, alias($.value_fn_args_or_params, $.call_value_function))),
      prec(11, postfix($.expression, alias($.parser_fn_args_or_params, $.call_parser_function))),
      prec(10, prefix($.spread_op, $.expression)),
      prec(9, prefix($.return_op, $.value)),
      prec(8, prefix($.negate_op, $.expression)),
      prec(7, prefix($.upper_bounded_range_op, $.expression)),
      prec(6, postfix($.expression, $.lower_bounded_range_op)),
      prec.left(5, infix($.expression, $.range_op, $.expression)),
      prec.left(4, infix($.expression, $.or_op, $.expression)),
      prec.left(4, infix($.expression, $.take_right_op, $.expression)),
      prec.left(4, infix($.expression, $.take_left_op, $.expression)),
      prec.left(4, infix($.expression, $.merge_op, $.expression)),
      prec.left(4, infix($.expression, $.backtrack_op, $.expression)),
      prec.left(4, infix($.expression, $.destructure_op, $.value)),
      prec.left(4, infix($.expression, $.return_op, $.value)),
      prec.left(4, infix($.expression, $.subtract_op, $.expression)),
      prec.left(3, infix($.expression, $.sequence_op, $.expression)),
      prec.right(2, infix($.expression, $.conditional, $.expression)),
    ),

    value: $ => choice(
      $.value_operand,
      seq("(", $.value, ")"),
      prec(12, postfix($.value_variable, alias($.value_fn_args_or_params, $.call_value_function))),
      prec(11, postfix($.value, alias($.parser_fn_args_or_params, $.call_parser_function))),
      prec(10, prefix($.spread_op, $.value)),
      prec(9, prefix($.return_op, $.value)),
      prec(8, prefix($.negate_op, $.value)),
      prec(7, prefix($.upper_bounded_range_op, $.value)),
      prec(6, postfix($.value, $.lower_bounded_range_op)),
      prec.left(5, infix($.value, $.range_op, $.value)),
      prec.left(4, infix($.value, $.or_op, $.value)),
      prec.left(4, infix($.value, $.take_right_op, $.value)),
      prec.left(4, infix($.value, $.take_left_op, $.value)),
      prec.left(4, infix($.value, $.merge_op, $.value)),
      prec.left(4, infix($.value, $.backtrack_op, $.value)),
      prec.left(4, infix($.value, $.destructure_op, $.value)),
      prec.left(4, infix($.value, $.return_op, $.value)),
      prec.left(4, infix($.value, $.subtract_op, $.value)),
      prec.left(3, infix($.value, $.sequence_op, $.value)),
      prec.right(2, infix($.value, $.value_conditional, $.value)),
    ),

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

    value_operand: $ => choice(
      $.boolean,
      $.null,
      alias($.value_string, $.string),
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

    value_string: $ => choice(
      seq(
        '"',
        repeat(choice(
          alias($.double_string_fragment, $.string_fragment),
          alias($.value_interpolation, $.interpolation),
          $.escape_char,
          $.escape_unicode,
        )),
        '"',
      ),
      seq(
        "'",
        repeat(choice(
          alias($.single_string_fragment, $.string_fragment),
          alias($.value_interpolation, $.interpolation),
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

    value_interpolation: $ => seq(token.immediate("%("), $.value, ")"),

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
      seq('[', commaSep($.value), optional(","), ']'),
    ),

    object: $ => seq(
      '{',
      commaSep(choice(
        $.object_pair,
        $.object_spread,
      )),
      optional(","),
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

    value_conditional: $ => seq(
      $.conditional_then_op,
      $.value,
      $.conditional_else_op,
    ),

    parser_fn_args_or_params: $ => seq("(", commaSep($.expression), optional(","), ")"),

    value_fn_args_or_params: $ => seq("(", commaSep($.value), optional(","), ")"),
  }
});

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
