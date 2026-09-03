---
title: How to bake Pi with one cup of Java
description: How to bake Pi with one cup of Java
pubDate: "Dec 03 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

So I just watched a video on the [calculation of Pi](https://www.youtube.com/watch?v=yJ-HwrOpIps), and was intrigued to write my own little Pi calculator:

```java
public class pi {
	public static void main(String[] args) {
		if (args.length == 0) {
			System.out.println("Usage: pi <long series_length>");
			return;
		}

		long series_length = Long.parseLong(args[0], 10);
		double pi = 0.0;

		for (long i = 0; i < series_length; i++) {
			pi += (i % 2 == 0 ? 1 : -1) / (double)(i*2 + 1);
			System.out.println(String.valueOf(pi * 4));
		}
	}
}
```

In action:

```text
% java pi 1000000 # The bigger the number, the more accurate
... (A whole bunch of intermediate steps)
3.1415916535897743
```

Personally, this clarified my understanding of how Pi is calculated more than just seeing it in that video or in a book.

Update:

I punched in the maximum value of iterations (9223372036854775807) and wasn't really sure how long it would take to compute... I timed 10000 iterations at about 0.6 seconds, so according to my calculations, it will take 1.7 MILLION years to compute pi through that many iterations!

My mind has just been blown through a new perspective of what a massive number 9223372036854775807 really is.
