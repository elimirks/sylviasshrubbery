---
title: Dabbling around with Haskell
description: Dabbling around with Haskell
pubDate: "Oct 17 2015"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

So last night I went to a Haskell workshop.

One of the examples my professor gave was the factorial function:

```haskell
factorial :: (Num a, Eq a) => a -> a
factorial 0 = 1
factorial n = n * factorial(n-1)
```

The first line is the function signature, the second line is the base case, and the third line is the recursive step of the function. One thing I really like about Haskell so far is how clean recursive functions are.

Today I started dabbling a bit more with Haskell and created a recursive function to calculate pi using the Gregory–Leibniz formula:

```haskell
pie :: (Integral a, Fractional b) => a -> b
pie 0 = 0
pie n = sign * 4 / (2 * (fromIntegral n) - 1) + pie(n-1)
  where sign = if even n then -1 else 1
```

I had to name it "pie" because "pi" was a reserved keyword. The "fromIntegral n" is there to allow an integer to be part of a fractional calculation. This is necessary because Haskell is über strict with types.

Here it is in action:

```
*Main> pie 1000
3.140592653839794
*Main> pie 10000
3.1414926535900345
*Main> pie 100000
3.1415826535897198
```
