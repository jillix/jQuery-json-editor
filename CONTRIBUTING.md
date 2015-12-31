# Developer guidelines
- Function-scoped JavaScript variable declarations (variables declared with
  `var`) should always be put at the top of the block. They are visible in the
  entire function in which they are declared, but we are anticipating the `let`
  block-scoped variables which will be available in the future. When `let` will
  become available in the most used browser versions, it will be easier for us
  to just replace `var` with `let` because the variable declarations will
  already be put in the corresponding block.
- Function declarations, but not definitions, so declarations like `function
  f(...) { ... }`, should be put at the top of the block in which they are
  declared because they can be called (they are visible) also before their
  declaration in that block. (This is the new ES6 behavior. See
  [here](http://dev.venntro.com/2013/09/es6-part-2/),
  [here](https://bugzilla.mozilla.org/show_bug.cgi?id=585536) and
  [here](https://bugs.webkit.org/show_bug.cgi?id=27226).).
