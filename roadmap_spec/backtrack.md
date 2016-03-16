## Backtrack

    !pattern  name ( input..... ) => { output ..... }

Backtrack is denoted with a `!` before your pattern definition. It means that your pattern, after it has been matched and transformed, does not progress the cursor.

The purpose of this is to allow you to match a second pattern against the output of your backtracked pattern. Because the cursor does not progress, the next compile cycle will begin before the first character of your output.

#### CAUTION
Because this inherently prohibits the cursors progression, be careful that you do not find yourself in an infinite loop of outputs which match other patterns that also backtrack. **This will overflow the call stack.**
