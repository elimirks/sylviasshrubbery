---
title: "b64: B Compiler for x86_64 Linux"
description: "b64: B Compiler for x86_64 Linux"
pubDate: "Feb 06 2022"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

# Why?!

In third year of uni, we were hosting a coding competition - "DeerHunt". The idea behind the competition was that students would write code in 15 different languages to solve coding katas. We split the languages into 3 different worlds:

1. Fresh world: Rust, Elm, Scala, Lua, and Clojure
2. Corrupt world: Piet, Brainfuck, Befunge, Whitespace, and [Blarb](/blog/blarbvmblarblang/)
3. Retro world: Nasm, Cobol, Fortran, Algol, and **B**

B was designed and implemented by [Dennis Ritchie and Ken Thompson](https://www.bell-labs.com/usr/dmr/www/bref.html), the creators of C and UNIX. It's an untyped language, where (originally) everything was a 36 bit word, which was the word size of the [Honeywell 6000 series](https://en.wikipedia.org/wiki/Honeywell_6000_series) mainframes.

When looking for a B compiler that would run on Linux, I found that the only options available weren't that great. The error messages were bad and the compilers ran slowly. I've been wanting to implement a B compiler ever since!

I wanted to write the compiler in Rust with 0 dependencies, but ended up using one: [jemalloc](https://www.bsdcan.org/2006/papers/jemalloc.pdf). It was designed to run fast for general use cases in multithreaded programs, and only took a couple lines to replace the default allocator:

```rust
#[global_allocator]
static ALLOC: jemallocator::Jemalloc = jemallocator::Jemalloc;
```

It doubled the speed of the compiler so I thought it was worth sacrificing a bit of the "0 dependency" goal.

[Here is the GitHub Repo](https://github.com/elimirks/b64)

# A lot has changed since 1969

Since B ran on mainframes and predated UNIX, there were a few parts of the compiler I had to change a bit to feel right on 64-bit Linux.

## 1. Everything is a 64 bit word (quad), not a 36 bit word

Since B originally ran on a 36 bit machine, that was a natural word size choice for the language. But these days we're mostly running 64 bit machines!

## 2. The only builtin function is `syscall`

Linux has a uniform interface to talk to the kernel: syscalls. So instead of baking in the entire standard library into the language like the original B, I made the only intrinsic function `syscall`, from which you can do everything from writing to the console to opening a network connection.

For example, here is a function which will print a single character to the console, using `syscall` from a B function:

```c
putchar(c) {
    return(syscall(1, 1, &c, 1));
}
```

The `write` syscall (1) expects a pointer to a string, then a length. So passing it `&c` with length `1` will print a single character to file descriptor `1`, aka STDOUT.

## 3. String terminator

A funny thing about B is that there are a few things that are _very_ similar to C, such as the string terminators. They used the EOT character `0x04` for string termination instead of the NULL character `0x00`. It really doesn't matter what string terminator is used, but for compatibility with C I compiled strings to end with the NULL character instead.

## 4. CLI arguments

Finally, B didn't pass in `argc` and `argv` to the `main` function. Since that's how args get passed in on Linux, I supported it. When an executable starts running on Linux, `argc` is the first quad on the [stack](https://en.wikipedia.org/wiki/Call_stack), and the `argv` pointer is the second quad on the stack. So to pass in these values to the `main` function, I just had to do this in the program `_start`:

```asm
_start:
    movq (%rsp),%rdi  # pass `argc` as the first parameter
    leaq 8(%rsp),%rsi # pass `argv` as the second parameter
    call main
    ...
```

# B vs C

There are a few other big differences from C, that they _must_ have realized were mistakes :)

## 1. Vector sizing

When creating a new vector (called "array" in C), the number provided is the _max index_, not the size.

```c
vec_size1[0]; /* One element at [0] */
vec_size2[1]; /* Two elements at [0] and [1] */
```

## 2. Variable declarations

There are three types of variable declarations: external variables, auto variables, and function parameters.

Function parameters are the exact same as in C. However, if you don't pass in all the required variables to a function, some of them will be uninitialized.

External variables are what they called global variables. You define them by writing an identifier followed by an optional initializer. To access external variables from a function, you must use the `extrn` keyword (missing an e! This was changed in C to `extern`).

```c
the_answer 42;
what_am_i;           /* Uninitialized variable */
primes[] 2, 3, 5, 7; /* Initialized vector of size 4 */

tomato() (
    extrn what_am_i; /* Necessary to access the external var */
}
```

The second way to create variables is inside a function with the `auto` keyword:

```c
potato() {
    auto x 3, y; /* Create x initialized to 3, and y uninitialized */
}
```

## 3. Wide chars

Since B only has a single type, they decided to pack characters into a single word. So unlike C, a single B char could contain up to 4 ASCII values:

```c
'a'    /* Padding with 3 null bytes by the compiler */
'abcd'
```

Since I wrote b64 for 64 bit machines, I extend the wide chars to support up to 8 characters.

## 4. No logical operators

There were no logical operators for `&&` and `||` in B. Instead, you would have to use the bitwise `&` and `|` operators. So in C if you wanted to check that two values are non-zero, you could write `1 && 2`. But in B you only have the `&` operator, for which `1 & 2 == 0`! So to check for non-zero values, you have to compare with 0 explicitly: `(2 != 0) & (1 != 0)`.

There is actually no x86 instruction for the logical operators, only bitwise `&` and `|`. When using the `&&` operator in a conditional, it's common to actually split it into multiple `jmp` instructions for each value between logical operators. So if the first value is `false` for `&&`, it will jump instead of evaluating the rest of the expression. Similar for `||`. This technique lends itself well to [short circuit evaluation](https://en.wikipedia.org/wiki/Short-circuit_evaluation).

## 5. Assignment operator combos

The order of the assignment operator combos is considered one of the biggest mistakes in B. Most modern languages have `+=`, `*=`, etc to apply some operator and then assign a value. In B, the order was reversed: `=+`, `=*`, ...

This leads to some whitespace dependence to avoid ambiguity. Specifically, `a =*b` is the same as `a =* b`, but is different than `a = *b`. Similarly with `=-`.

# How simple compilers work

Compilers are often broken up into a few stages: lexing, parsing, type checker, and code generation. More advanced compilers like GCC or LLVM have more stages, so this is more an explanation of simple compilers such as b64.

The lexing stage is what turns strings into "tokens". For example, it will turn an a string such as `"pickle"` into a single enum value. Similarly, it will also turn symbols like `(`, `=+`, and `while` into single values. The purpose of lexing / tokenization is to make parsing the actual program easier, without having to deal with string manipulation everywhere.

The parsing stage turns the "tokens" into a tree. For example, `1 + 2 * 3` will tokenize into `[Int(1), Plus, Int(2), Asterisk, Int(3)]`. The parser will then convert that flat array into something like:

```
Add(
  left: Int(1),
  right: Multiply(
    left: Int(2),
    right: Int(3),
  ),
)
```

This is called the "abstract syntax tree", which is an easier form to work with than a flat array during type checker and code generation.

The point of a type checker is to stop you from accidentally doing things like `1 + "banana"`. Since B doesn't have types, I didn't have to include a type checker stage.

Finally, the code generation is what turns the AST into machine code or assembly (which mostly correspond 1:1). Since assembly is entirely flat and doesn't have a concept of control statements or expressions, the majority of code generation is figuring out how to flatten high level structures like `1 + 2 * 3` or a while loop into a list of simple assembly statements.

# b64 Lexer

## Interface

The lexer API I wrote for B has 3 public functions:

```rust
pub fn parse_tok(c: &mut ParseContext, expected: Token) -> Result<(), CompErr>
pub fn pop_tok(c: &mut ParseContext) -> Result<(Pos, Token), CompErr>
pub fn push_tok(c: &mut ParseContext, tok: (Pos, Token))
```

I made the interface feel like a stack, so you can pop and push tokens from the file your parsing. Initially I supported another `peek_tok` function, but the ownership system in Rust made the code really gnarly, so I decided to limit it to this stack-like interface. One technique I heard from someone is to use an arena allocator that has the same lifetime as the `ParseContext`. That way, you can easily share references to tokens across multiple parts of the program, as long as the parse context stays in scope.

## SIMD

I wanted to try out using [SIMD](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data) (Single Instruction Multiple Data) to speed up lexing. The basic idea behind SIMD is that you can run a single assembly instruction to compute a result on contiguous values. For example for skipping past whitespace, you can compare up to 32 bytes at a time looking for whitespace characters, instead of iterating through every single byte.

For parsing whitespace, I would iterate through 128 bit chunk of data at a time. I tried 256 bit chunks as well, but it wasn't as performant:

```rust
#[cfg(all(target_arch = "x86_64", target_feature = "avx2"))]
#[allow(overflowing_literals)]
unsafe fn simd_consume_ws(c: &mut ParseContext) {
    let space_vec = _mm_set1_epi8(' ' as i8);
    // Hack to reduce number of ops to find newlines & tabs
    let tab_nl_vec = _mm_set1_epi8(0b11111000);
    let tab_nl_stat_vec = _mm_set1_epi8(0b00001111);

    while c.offset + 16 < c.content.len() {
        let values = _mm_loadu_si128(
            c.content.get_unchecked(c.offset) as *const u8 as *const _);

        // Values will be 255 if they're whitespace
        // andnot(a, b) does ((NOT a) AND b)
        let result = _mm_andnot_si128(
            _mm_cmpeq_epi8(values, space_vec),
            // In this case, gt is the same as neq
            _mm_cmpgt_epi8(
                _mm_and_si128(values, tab_nl_vec),
                tab_nl_stat_vec
            )
        );

        // Compute bitmask of which values are 255
        // Mask is zeros going from from right to left
        let mask = _mm_movemask_epi8(result) as u32;

        if mask == 0 {
            c.offset += 16;
        } else {
            let lsb = lsb_number(mask);

            c.offset += lsb as usize;

            if !consume_comment(c) {
                return;
            }
        }
    }
    // If we're near the end of the file, fallback to classic mode
    non_simd_consume_ws(c);
}

unsafe fn non_simd_consume_ws(c: &mut ParseContext) {
    while c.offset < c.content.len() {
        match *c.content.get_unchecked(c.offset) as char {
            ' ' | '\n' | '\t'  => c.offset += 1,
            '/' => if !consume_comment(c) {
                break
            },
            _ => break,
        }
    }
}
```

I wrote some similar code to search for the end of identifiers and the end of comments. In the end, it only improved the compiler performance by about 1%... but it was fun to mess around with!

## b64 Parser

I wanted the parser to be fast with good error messages, so I hand rolled a [recursive descent parser](https://en.wikipedia.org/wiki/Recursive_descent_parser) instead of using a parser generator or parser combinators. It's definitely more work than other techniques, but makes it easy to understand what the parser is doing. I found that by hand rolling the parser, I was able to optimize much better, and have better error messages without sacrificing performance.

### Pinpointed error messages

The positions of all the tokens, expressions, and statements are retained throughout the entire compilation process, so you'll always see pinpointed error messages like this:

```
Compile error: rintf not in scope
In file: /home/elijah/code/b64/examples/args.b
6 |    rintf("argc:    %d*n", argc);
       ^
```

### Performance point 1: Avoid unnecessary work

I didn't do a lot of nitty gritty optimization in the compiler, but I tried to write everything with the mindset of avoid extra work. For example, instead of backtracking for ambiguous expressions or statements, I would lookahead a token to decide a parse path first.

Other parsers I've written depended heavily on backtracking, which is by definition wasting work!

### Performance point 2: Make it easily parallelizable

I wrote the parser in such a way that it could easily be parallelized across threads. The approach I took was to first parse everything in parallel, aggregate the top level statements, then pass the result to the code gen.

I used the thread pool approach. When the compiler starts, it will create a thread poll sized depending on how many virtual CPUs you have. The threads will then wait for the parse stack to change, and pop off file paths that need parsing. Whenever you `#import` a new file, it will be added to a parse stack and trigger a condvar, waking up any sleeping threads. The idle threads will pull file paths off the parse stack one by one until it's empty. Once all threads are idle and the parse stack is empty, the threads will shut down, and the aggregate root statements are passed to code gen.

This approach works pretty well, but has a one main problem: If there aren't a lot of files to parse, most of the threads will be sitting idle. If I were to write this again, I would probably try to lift the thread pool to a higher level, so that idle threads could start working on codegen.

### Performance point 3: Try to hit the CPU cache

Stealing some ideas from the data oriented designed people, I parsed the root level statement into multiple arrays of statements, instead of a single array with mixed types. I don't remember what the performance improvement was in doing this, but it was something high like 5% faster:

```rust
pub strings: Vec<(usize, Vec<Vec<char>>)>,
pub functions: Vec<RSFunction>,
pub variables: Vec<RSVariable>,
pub defines: Vec<RSDefine>,
```

From what I understand, there are two reasons why it's faster than using a single array:

1. There are more CPU cache hits

During code gen, I needed to iterate over each type of root level statement at a time. Static strings needed to be written to the readonly segment, global variables needed to be written to the RO segment, and functions needed to be iterated over for the function codegen. So by using multiple arrays, I could iterate over only the data I _need to_ for each part of the code gen.

2. No branching

CPUs use [branch prediction](https://en.wikipedia.org/wiki/Branch_predictor) to preemptively start computing the value of a certain branch before the condition is actually evaluated. If the branch predictor guesses incorrectly, it's an expensive operation to "undo" the operations on the incorrectly guessed branch. By storing arrays homogeneously, there is no need for branching, so there will never by branch mispredictions.

From what I've read, this is especially important for "tight loops" that perform only a small number of instructions on each piece of data.

For example, if we want to perform some operation on even numbers in an array, we need to have an `if` statement that will _always_ branch mispredict and waste work!

```c
int numbers[] = {1, 2, 3, 4, 5, 6};
for (int i = 0; i < 6; i++) {
    if (numbers[i] % 2 == 0) { // Branches, so will branch mispredict!
        numbers[i] *= 2;
    } else {
        numbers[i] += 1;
    }
}
```

A more performant choice is to use two separate loops over only the odd numbers, then only the even numbers:

```c
int numbers[] = {1, 2, 3, 4, 5, 6};
for (int i = 0; i < 6; i += 2) {
    numbers[i] += 1;
}
for (int i = 1; i < 6; i += 2) {
    numbers[i] *= 2;
}
```

## b64 Code generation

For simplicity, I decided to compile into GNU Assembler style assembly instead of directly into machine code. At some point in the future maybe I'll go staright into machine code, but assembly is much easier to debug!

Instead of compiling each file into an object file, the code gen will compile _everything_ into a single assembly file, so no linking is necessary. The compiler is fast enough that this approach won't be a problem unless you were compiling hundreds of millions of lines of B code, at which point I would more concerned about your wellbeing rather than waiting for the compiler.

The main structure of the generated assembly is split into three segments: data segment, read only data, and text / code segment.

The data segment is where the external variables are stored.

```c
the_answer 42;
```

Will compile into:

```asm
.data
the_answer:
    .quad 42
```

The read only data is used for string constants. Storing them in the readonly segment prevents strange behavior like `"hello"[3] = 6`.

Finally, the text segment is where all the fun happens. The entry point will simple load `argv` and `argc`, then call `main`. The return value of `main` will be used as the exit code of the program:

```asm
.text
.global _start
_start:
    movq (%rsp),%rdi
    leaq 8(%rsp),%rsi
    call main
    movq %rax,%rdi
    movq $60,%rax
    syscall
... compiled B functions go here
```

As mentioned earlier, there are no control structures in assembly. So an `if` statement needs to unroll into a series of simple statements:

```asm
    # if
    movq -8(%rbp),%rax
    cmpq $0,%rax
    jne .IF_END_11_1
    # Expression statement
    movq $48,%rdi
    call _putchar_single
    # return
    movq $0,%rax
    leave
    ret
    .IF_END_11_1:
```

The code gen stage will compile directly into x86 assembly, which I think was a mistake. Doing so made it necessary for me to worry about register allocation and control structure flattening all in the same place, which I suppose is a fast but more complex approach. It also means that changing the backend to compile into ARM would require rewriting most of the code gen.

If I were to write it again, I would probably use an architecture agnostic intermediate representation. That way, I could "make up" as many registers as I want, like how LLVM IR is designed.

## Final performance

To test compiler performance, I ran `perf` 100 times over about 1,780,001 lines of code. It compiled in 0.96 seconds, so nearly 2 million LOC per second!

```
 Performance counter stats for './target/release/b64 -s benchtest/all_garbage.b' (100 runs):

          3,950.35 msec task-clock:u              #    4.121 CPUs utilized            ( +-  0.23% )
                 0      context-switches:u        #    0.000 /sec
                 0      cpu-migrations:u          #    0.000 /sec
           167,657      page-faults:u             #   41.888 K/sec                    ( +-  0.08% )
    11,841,748,821      cycles:u                  #    2.959 GHz                      ( +-  0.04% )  (83.38%)
       512,011,063      stalled-cycles-frontend:u #    4.33% frontend cycles idle     ( +-  0.20% )  (82.94%)
     2,308,791,518      stalled-cycles-backend:u  #   19.50% backend cycles idle      ( +-  0.10% )  (83.55%)
    16,283,375,938      instructions:u            #    1.38  insn per cycle
                                                  #    0.14  stalled cycles per insn  ( +-  0.03% )  (84.58%)
     2,629,991,056      branches:u                #  657.086 M/sec                    ( +-  0.02% )  (83.66%)
        31,912,504      branch-misses:u           #    1.22% of all branches          ( +-  0.12% )  (81.93%)

           0.95852 +- 0.00261 seconds time elapsed  ( +-  0.27% )
```

## Example links

If you want to take a look at some example of B code, take a look at the stdlib or examples directory:

- [stdlib](https://github.com/elimirks/b64/tree/main/assets)
- [examples](https://github.com/elimirks/b64/tree/main/examples)
