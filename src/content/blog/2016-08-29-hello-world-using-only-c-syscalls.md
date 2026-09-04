---
title: Hello World, using only C syscalls
description: Hello World, using only C syscalls
pubDate: "Aug 29 2016"
heroImage: "../../assets/programmer-cat.jpg"
---

I'm currently working on implementing system calls in BlarbVM (see my previous post on it), so I am trying to get comfortable using only syscalls.

In Linux, you can change the heap size through brk (syscall #12). To write a string to standard output, you must provide a pointer to a location on the heap.

The following code:

1. Get's the end of the heap address

2. Increments the end of the heap address by 6 bytes

3. Set's the value of those 6 bytes to a null terminated "hello\n" string

4. Runs a syscall on the desired heap position to print "hello\n"

```c
#include <syscall.h>

// http://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/
int main(int argc, char **argv) {
	long brkPoint;

	// Get the brk size
	if ((brkPoint = syscall(12)) == -1) {
		perror("syscall");
		return 1;
	}
	// Increase heap size
	if ((brkPoint = syscall(12, brkPoint + 6)) == -1) {
		perror("syscall");
		return 1;
	}
	// Add the string "hello\n" to the heap
	*((char*)(brkPoint - 6)) = 'h';
	*((char*)(brkPoint - 5)) = 'e';
	*((char*)(brkPoint - 4)) = 'l';
	*((char*)(brkPoint - 3)) = 'l';
	*((char*)(brkPoint - 2)) = 'o';
	*((char*)(brkPoint - 1)) = '\n';
	*((char*)(brkPoint)) = '\0';

	// Write the address 4 bytes before the end of the brk point (end of heap)
	if (syscall(1, 1, (char*)(brkPoint - 6), 6) == -1) {
		perror("syscall");
		return 1;
	}

	return 0;
}
```
