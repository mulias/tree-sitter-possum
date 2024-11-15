(comment) @comment
(comment) @spell

(number) @number

(string) @string
(string [(escape_char) (escape_unicode)] @string.escape)

(interpolation
  "%(" @punctuation.special
  ")" @punctuation.special
) @embedded

[ ";" "," ] @punctuation.delimiter

(object_pair ":" @punctuation.delimiter)

[ "(" ")" "[" "]" "{" "}" ]  @punctuation.bracket

[(parser_variable) (boolean) (null)] @function
(value_variable) @variable
(underscore_variable) @variable.builtin

(value_operand [(number) (string)] @constant)
(value_operand [(boolean) (null)] @constant.builtin)

[
  (spread_op)
  (negate_op)
  (range_op)
  (lower_bounded_range_op)
  (upper_bounded_range_op)
  (or_op)
  (take_right_op)
  (take_left_op)
  (merge_op)
  (backtrack_op)
  (destructure_op)
  (return_op)
  (subtract_op)
  (sequence_op)
  (assign_op)
  (conditional_then_op)
  (conditional_else_op)
] @operator
