---
title: SIMPLIFY ALL THE FRACTIONS
description: SIMPLIFY ALL THE FRACTIONS
pubDate: "Dec 06 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

Simplify 120546/54201 into it's lowest terms. By using the normal "eyeball" method, this would basically impossible (or just very very painful) to calculate.

However! Using [Euclid's Algorithm](http://en.wikipedia.org/wiki/Greatest_common_divisor), it is actually very simple to figure out, even by hand.

I liked the algorithm, so I wrote this little program to calculate it.

```c    
#include <stdio.h>
#include <stdlib.h>

// Euclid's recursive formula
int euclid(int first, int second) {
	int remainder = first % second;
	printf("%d - %d * %d = %d\n", first, first / second, second, remainder);
	return remainder == 0 ? second : euclid(second, remainder);
}

int main(int argc, char** argv) {
	if (argc < 3) {
		printf("This program calculates the "
		       "greatest common divisor of two non-zero integers.\n"
		       "Usage: ./gcd <int> <int>\n");
		return 1;
	}
	int first = atoi(argv[1]);
	int second = atoi(argv[2]);
	printf("Calculations:\n");
	int gcd = euclid(first, second);
	printf("\ngcd(%d, %d) = %d\n", first, second, gcd);
	return 0;
}
```
    


In action:

```text
% ./gcd 120546 54201

Calculations:
120546 - 2 * 54201 = 12144
54201 - 4 * 12144 = 5625
12144 - 2 * 5625 = 894
5625 - 6 * 894 = 261
894 - 3 * 261 = 111
261 - 2 * 111 = 39
111 - 2 * 39 = 33
39 - 1 * 33 = 6
33 - 5 * 6 = 3
6 - 2 * 3 = 0

gcd(120546, 54201) = 3
```
    


Therefore the greatest common divisor is 3, so the simplified fraction is 40182/18067. As proven by Euclid, these are the lowest terms of the requested rational number. By hand, this would only take 10 simple calculations!


