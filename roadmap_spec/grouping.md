# Grouping Syntax for Patterns and expressions

** Derpricated in lieu of a new implementation. References this a bit. Must Edit to reflect changes **

> Proposed Syntax

    pattern ( $( hello $group:lit )(,)... ; ) => { do_something($("$group ")(,)... ) }
    hello joe, hello james, hello marry
    //compiles to do_something("joe","james","marry")

> Implementation

+ make  expression  persisted in Array.toRegExp()
+ make `pattern_group `a `_type` class
+ test for `pattern_group` in `makePattern`
    + add regex for pattern (sans` $ + () `) to `.patterns` array
    + save like `vartype`
    + save `.pattern_groups` to compiler as array
    + push to `.pattern_groups` the index of reg
+ in `Pattern`
    + check for length of `.pattern_groups`
    + if `length > 0`
        + match all `pattern_group` in `expression`
        + strip results of `$ + ()`
        + replace appearance of original capture in expression with stripped version
        + apply expressions toregex's at  indexes in `.pattern_groups`.

*It should work after this implementation*
