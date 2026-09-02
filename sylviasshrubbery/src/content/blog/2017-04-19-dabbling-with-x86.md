---
title: Dabbling around with x86
description: Dabbling around with x86
pubDate: "Apr 19 2017"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

I am going to work as an embedded software developer in May, so I thought I should feel cozy with x86. The only experience I have with x86 is in a dissassembler context... so be warned! This may be messy.

I wrote this little fellow which simply prints a given number in octal using recursion :] 


    
```asm
.text
.global _start # Loader

# entry point
_start:
    mov $127, %eax
    call shownum

    # exit
    movl $0,%ebx # first argument: exit code
    movl $1,%eax # system call number (sys_exit)
    int  $0x80   # trap

shownum: # eax is the input number
    push %eax
    mov $8, %ebx
    cmp %ebx, %eax

    # Base case: < 8, print the number
    jl shownumfin

    # Print the most significant first
    mov -0(%esp), %eax
    shr $3, %eax
    call shownum

    # Print the lowest triplet last
    mov -0(%esp), %eax
    and $7, %eax
    call shownum

    pop %eax
    ret
shownumfin:
    mov $1, %edx
    mov -0(%esp), %ecx
    add $nums, %ecx
    movl $1, %ebx
    movl $4, %eax
    int $0x80 # trap

    pop %eax
    ret

.data
nums:
    .ascii "01234567"
```




To all the potential employers out there, here is a bonus... fizz buzz :3

 

```asm
.text
.global _start # loader. They conventionally recognize _start as their

# entry point
_start:
    sub $12, %esp

    movl $0, 8(%esp) # 3 counter
    movl $0, 4(%esp) # 5 counter
    movl $0, 0(%esp) # Main counter
loop:   

# fizz?
    movl 8(%esp), %eax
    movl $3, %ebx
    cmp %eax, %ebx

    movl 8(%esp), %ebx
    jg fend

    call showfizz
    movl $0,%ebx
fend:
    inc %ebx
    movl %ebx, 8(%esp)

# buzz?
    movl 4(%esp), %eax
    movl $5, %ebx
    cmp %eax, %ebx

    movl 4(%esp), %ebx
    jg bend

    call showbuzz
    movl $0,%ebx
bend:
    inc %ebx
    movl %ebx, 4(%esp)

    # If the 5 or 3 counters are 1, it means we printed "Fizz" or "Buzz"
    # So we don't print the current number

    # 5 counter
    movl 4(%esp), %eax
    cmp $1, %eax
    je dontprintnum

    # 3 counter
    movl 8(%esp), %eax
    cmp $1, %eax
    je dontprintnum

    # Print the current number if the above two conditions failed
    mov -0(%esp),%eax
    call shownum
dontprintnum:

    call shownewl

    mov -0(%esp), %eax
    inc %eax
    mov %eax,-0(%esp)

    cmp $20, %eax
    jne loop


    add $12, %esp
    # exit
    movl $0,%ebx # first argument: exit code
    movl $1,%eax # system call number (sys_exit)
    int  $0x80   # trap

showfizz:
    movl $flen, %edx
    movl $fizz, %ecx

    movl $1, %ebx
    movl $4, %eax
    int $0x80 # trap
    ret
showbuzz:
    movl $blen, %edx
    movl $buzz, %ecx
    movl $1, %ebx
    movl $4, %eax
    int $0x80 # trap

    ret
shownewl:
    movl $nlen, %edx
    movl $newl, %ecx
    movl $1, %ebx
    movl $4, %eax
    int $0x80 # trap
    ret

# eax is the input number
# eax is the input number
shownum:
    push %ebp
    mov %esp, %ebp
    sub $4, %esp

    # Input number
    mov %eax, 0(%esp)

    cmp $10, %eax

    # Base case: < 10, print the number
    jl shownumfin

    # Print the most significant first
    mov $0, %edx
    mov 0(%esp), %eax
    mov $10, %ecx
    div %ecx
    # Store the remainder for later
    mov %edx, 0(%esp)

    call shownum

    # Continue and print least significant last
shownumfin:
    mov $1, %edx
    mov 0(%esp), %ecx
    add $nums, %ecx
    movl $1, %ebx
    movl $4, %eax
    int $0x80 # trap

    add $4, %esp
    pop %ebp
    ret

.data
nums:
    .ascii "0123456789"
fizz:
    .ascii "Fizz"
    flen = . - fizz
buzz:
    .ascii "Buzz"
    blen = . - buzz
newl:
    .ascii "\n"
    nlen = . - newl
```
