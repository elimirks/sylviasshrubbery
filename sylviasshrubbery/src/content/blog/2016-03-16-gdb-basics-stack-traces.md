---
title: "GDB Basics: Stack Traces"
description: "GDB Basics: Stack Traces"
pubDate: "Mar 16 2016"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

C beginners are often very lost when their program crashes from a segmentation fault or similar issues. Most of them know about GDB but are pretty intimidated by it.

Here is a super simple example about how to find a stack trace from a program crash.

```c
#include <stdio.h>

void bar(int *var) {
	printf("%d\n", var[100000]);
}

void foo(int *var) {
	bar(var);
}

int main() {
	int *a;
	foo(a);
	return 0;
}
```

Of course, this will result in the console simply printing "Segmentation Fault" which doesn't help very much, especially in more complex programs.

Using GDB, you just have to remember 2 commands to get a stack trace: "run" and "backtrace".

To compile, use the "-g" flag with gcc to include debugging symbols for gdb:

```sh
gcc -g main.c
```

To run this in gdb, run:

```sh
gdb a.out
```

Now all you have to do is type "run" into the gdb console. It will show you the line where it crashed, but to show the stack trace you must run the "backtrace" command:

```
(gdb) run
Starting program: /home/elijah/code/c/a.out

Program received signal SIGSEGV, Segmentation fault.
0x000000000040051c in bar (var=0x0) at main.c:4
4               printf("%d\n", var[100000]);
(gdb) backtrace
#0  0x000000000040051c in bar (var=0x0) at main.c:4
#1  0x0000000000400549 in foo (var=0x0) at main.c:8
#2  0x000000000040055f in main () at main.c:13
(gdb) quit
```

GDB has a lot of other great features like [breakpoints](https://sourceware.org/gdb/onlinedocs/gdb/Breakpoints.html) and memory analysis. If you are comfortable with assembly, you can even run commands while your program is running!
