---
title: Dabbling Around with Scala
description: Dabbling Around with Scala
pubDate: "Nov 20 2015"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

Scala is a legendary language that allows both OO and functional programming. On top of that, it is compatible with Java and compiles to JVM bytecode. Hence, in theory, it could be used anywhere Java is used _cough cough_ Android _cough cough_.

For a while, I have been meaning to try out Scala - and today I bit the bullet.

Closures are awesome. Here is a simple example which multiplies a list by 2 and prints the result:

```scala
List(1, 2, 3).map(_ * 2).foreach(println)
```

Of course, this is a very trivial example of how closures can be used, but I find the syntax pretty cool nonetheless :D

Here are some other features that I really like about Scala:

```scala
// Implicit types
var i = 0 // (Also notice no semicolons!)

// Immutable values are first class citizens - and in fact, encouraged
val s = ""
// s = "foob" will error out, since 's' was declared immutable by 'val'

// Closures / Anonymous / Lambda functions have intuitive syntax
val addOne = (i: Int) => i + 1
addOne(1) // returns 2

// Named parameters - One thing I really like about Objective-C!
def concatStrings(first: String, second: String) = first + second
// returns "Ohai"
concatStrings("O", "hai")

// Also return "Ohai"
concatStrings(first = "O", second = "hai")

// When you specify parameter names, order doesn't matter
concatStrings(second = "hai", first = "O")
```

Just for kicks, I decided to build a simple regex matching program with character matching, "multiple", and "or" functionality.

```scala
object RegexMatcher {
        def main(args: Array[String]) {
                assert(true == matchesRegex("1", "1"))
                assert(true == matchesRegex("1*001*", "111001111111"))
                assert(false == matchesRegex("1*001*", "11101111111"))
                assert(true == matchesRegex("1*0*1*", "11101111111"))
                assert(true == matchesRegex("1*0*1*", "11100001111111"))
                assert(false == matchesRegex("1*0*1*", "11100001101111"))
                assert(true == matchesRegex("1*0*1*", ""))
                assert(true == matchesRegex("a|b|c", "a"))
                assert(true == matchesRegex("a|b|c", "b"))
                assert(true == matchesRegex("a|b|c", "c"))
                assert(false == matchesRegex("a|b|c", "d"))
        }

        def matchesRegex(regex: String, s: String): Boolean =
                // The end of the regex has been reached
                if (regex.length == 0)
                        // The string should be empty
                        s.length == 0
                // Zero or more of the 0th regex character
                else if (regex.length > 1 && regex.charAt(1) == '*')
                        matchesRegex(regex substring 2, s) || (
                                (regex.charAt(0) == s.charAt(0) &&
                                        matchesRegex(regex, s substring 1)
                                )
                        )
                // Or operator
                else if (regex.length > 1 && regex.charAt(1) == '|')
                        // The first character onwards
                        matchesRegex(regex.substring(0, 1) + regex.substring(3), s) ||
                                // The second character onwards
                                matchesRegex(regex substring 2, s)
                // Standard character matching
                else
                        regex.charAt(0) == s.charAt(0) &&
                                matchesRegex(regex substring 1, s substring 1)
}
```
