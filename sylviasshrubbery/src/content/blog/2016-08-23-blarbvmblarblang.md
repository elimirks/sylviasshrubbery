---
title: BlarbVM/BlarbLang
description: BlarbVM/BlarbLang
pubDate: "Aug 23 2016"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

[Esoteric programming](https://en.wikipedia.org/wiki/Esoteric_programming_language) languages are awesome. So I decided to create one, which I call [BlarbLang](https://github.com/elimirks/BlarbVM/).

The goal of this language is to be the simplest possible systems programming language. It uses a stack for parameters, and every function must destruct its own stack frame, and push a return value, manually. The language "doesn't care" about performance, only simplicity. It currently supports only 5 operations:

- a b ~ Store the value of a in register b

- a $ Push register a onto the stack

- b a ! NANDS index a with index b and stores the result in index b

- a ^ pop 'a' elements

- a ? if index a is true (non-zero), execute the rest of the line

In one of my CS lectures (CSC258) I remembered learning that every gate can be created using NAND gates, so that is the only type of logical operation in the language! Using the above 5 operations, tons of different operations can be created, including adders, shifters, comparison operators, and more. [https://github.com/elimirks/BlarbVM/blob/master/lib.blarb](https://github.com/elimirks/BlarbVM/blob/master/lib.blarb)

There are 8 registers available for users. The 0th register is the line pointer, registers 1-3 are temporary registers (for swapping and stuff), and the 4-7 registers are "long term" registers, meant to be used outside of the standard library (by the user).

Labels allow creation of functions. For instance, the following code creates a function called "nandi" which NANDs two immediate stack values:

    ; NANDs the two immediate values
    #nandi
    	4 3 !         ; Nand it up
    	2 1 ~ 2 ^ 1 $ ; Get rid of extra argument
    	2 0 ~ 1 ^     ; return the result

In the future, I want to add one more operation: the system call operation. Currently, the language can only modify data within the VM. That is, on the stack and in registers. However, using system calls, users will be able to allocate heap memory and perform useful tasks such as reading from STDIN and writing to STDOUT.
