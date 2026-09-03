---
title: Monty Programming Language
description: Monty Programming Language
pubDate: "Jul 23 2021"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

# Origins

You know what the world needs? Another programming language! Not really, but anyways, it's a fun time designing them.

After messing around with parser combinators in Haskell, a friend and I had the itch to design a language. In uni we tossed around the idea of a nondeterministic esoteric language, so we started thinking about how it would work.

Something we came up with is, every branch would _possibly_ not do what you expected it to. So for example, the following branch statement may only evaluate correctly 99% of the time:

```python
if True:
    print("Obviously true, you nitwit")
else
    print("How could this possibly happen!?")
```

After talking about the scope of things you could actually do with this approach of programming, we realized it's a truly awful idea, even from an esoteric perspective. If you wanted to simulate deterministic behaviour, all you would have to do is make it _extremely_ unlikely to evaluate incorrectly. Think "dozens of identical nested conditionals".

What a bummer! But at this point we held a simultaneous epiphany, Haskell is a pain in the spleen to learn, but everyone knows Python these days... _what if we mix them?_

During a few months of quarantine, we went manic on creating the [Monty](https://montylang.github.io/docs/docs/) programming language. Honestly, we probably put as much time into it as our actual jobs for 3 months straight.

Guess the language:

```python
def add1(x):
  return x + 1
```

Python right? Yeah, but also Monty.

Guess the language:

```python
add1 = def (x):
  return x + 1
```

Python right? Yeah, wait... no! What on Earth is that function assignment? In pure functional languages, functions are "first class citizens", so they are types of values. In Monty, the two above definitions for `add1` are semantically identical. Everyone and their dog has dozens of lambdas. So we also shortened the syntax for it. A natural simplification of `def` is to drop the leading keyword, and return the first expression.

```python
add1 = (x): x + 1      # Monty
add1 = lambda x: x + 1 # Python
```

Leaning in the more Haskell direction, we also wanted currying support. It may seem a bit odd to Python aficionados, but not to our Haskell friends:

```python
def add(a, b):
  return a + b

add1 = (x): add(1, x)
# or with sugar syntax
add1 = add(1)
```

We tried to be Pythonic syntactically, and Haskell semantically:

```python
class Maybe:
  Just(value)
  None

instance Maybe of Functor:
  def map(Just(value), f):
    return Just(f(value))

  def map(_, _):
    return None
```

Check out the [docs](https://montylang.github.io/docs/docs/) if you want to see more snippets like this, explained in proper detail.

We also wrote a JSON parser in Monty which I find "proves" this language actually works: [JSON parser](https://github.com/montylang/monty/blob/master/samples/json.my)

# Syntactic & Semantic Parsers

At first we wrote a single parser. It was purely syntactic, so it didn't determine things like operator ordering, or know how to simplify the representation of an `unwrap` (for the Haskellers, `unwrap` is equivalent to `do` notation) statement in our Abstract Syntax Tree (AST).

Instead, we had all that stuff evaluated at runtime, which is a treacherous waste of resources. Once the language was in a working state, we had to fix our mess. As a layer between parsing and running, we added a "semantic parser". It's job is basically to convert the syntax-parser level AST into an AST more suitable for runtime. For example, `unwrap` expands into a tree of `bind` function calls.

# Type Inferrence

Some of the most voodoo code I've ever worked on is in our type inferrence. I can still hardly believe that it works so seamlessly. Staying in line with the Pythonic way of doing things, you don't ever tell the interpreter what _types_ things are, with the exception of typeclasses (denoted with the `type` keyword).

There is a type for Applicative, with an associated `wrap` function, akin to the `pure` function in Haskell. Now, what happens when you evaluate the following code?

```python
wrap(42).map((x): x + 1)
```

It maps the given function over 42, of course!... right? But wait, we don't actually know which implementing Functor instance to use `map` with. List type? Maybe type? Parser type? We haven't the foggiest idea!

So, if we can't figure out the type yet, how could we expect the interpreter to? Via laziness! Given that expression, we don't actually evaluate it until it's used in a context where a type can be inferred.

For example, the following code _will_ be able to evaluate, since the contextually implied type is a list:

```python
wrap(42).map((x): x + 1).concat([3])
```

Something that helps a great deal with type inferrence is a special `self` keyword in type function declarations:

```python
type Functor:
  def map(self, function)
```

In this definition, the interpreter knows that the first argument to `map` _must_ be a functor instance.

```python
type Equal:
  def equals(self, self)
```

In this definition, the interpreter knows that _both_ arguments must be of the same type. So this is an entry point for inferrence. The following will correctly infer that `wrap(42)` must be a list:

```python
equals([42], wrap(42))
```

Some fun type signatures, may they serve as implementation hints:

```python
zipArgsToValues :: [Arg] -> [Value] -> Either String [(Id, Value)]
evaluateTf :: DefSignature -> HM.HashMap Id FunctionImpl -> [Value] -> Scoper Value
runFun :: Value -> [Value] -> Scoper Value
```

# Evaluations

Initially, all expressions were evaluated in a huge `eval` function. It was a nice long list of unwieldy pattern matches. The first refactor was just pulling out the pattern match bodies into separate functions. But they were still there, silently haunting the codebase.

Through some actual, real life dark arts (aka existential quantification), we split the pattern match into modular evaluatable pieces. For example, the condition evaluatable (for if statements) lives with its AST definition:

```python
data RCondition = RCondition
  { rConditionPos :: SourcePos,
    rConditionIf :: CondBlock ET,
    rConditionElifs :: [CondBlock ET],
    rConditionElseBody :: [ET]
  }

instance Evaluatable RCondition where
  getPos RCondition {rConditionPos} = rConditionPos
  evaluate RCondition {rConditionIf, rConditionElifs, rConditionElseBody} =
    evalCondition rConditionIf rConditionElifs rConditionElseBody
```

This makes it much easier to add and remove syntax.

# Runner

With these pieces in place, how does a program actually run? Via a special value called `__main__`. It's required to be an instance of an IO monad, and is the main entry point to the program. Much like `if __name__ == "__main__"` in Python.

```python
__main__ = unwrap:
  print("What's your name? ")
  name <- input()
  print("Hello, " + name + "!\n")
```

The runner will evaluate the main IO monad, which in turn can have calls to anywhere else in the program.

## Interop

We wanted to have most things defined in Monty, but some things were just too slow. One of the main culprits was lists. Not much exciting to say here, except that "yay we have Haskell interoperability if need be".

## Unit is just an empty tuple

As a complete aside, unit `()` is just a tuple with no elements. My mind melted a little bit when I realized that.

# MyLib

Like any quasi-legitimate language, Monty has a standard library with loads of useful functions, types, and class definitions:

```python
# Finds the length of a foldable
def len(someFoldable):
  return someFoldable.foldl(0, (acc, _): acc + 1)

# Checks everything in a given foldable satisfy the predicate
def all(foldable, predicate):
  return foldable.foldl(True, (acc, it): acc and predicate(it))

# Flattens a nested Monad
def flatten(m):
  return m.bind(id)
```

By the power of category theory, these functions work on anything in the specified type class. Since `Maybe`, `List`, and `BTree` are all foldable, you can call `len` and `all` on them. If you implement your own Foldable instance, you get some free functions!

# The Future

Monty is currently super slow. At some point we'd like to use a bytecode so it will be easier to do things like tail call optimization. Our approach is to slowly simplify the runtime AST until it's at a point where we can represent it as a lower level bytecode. At that point, it will be much much much much much easier to add an optional optimization layer - after all, the runner won't actually care if the bytecode is optimized or not, so during debug runs you can opt out of optimization.
