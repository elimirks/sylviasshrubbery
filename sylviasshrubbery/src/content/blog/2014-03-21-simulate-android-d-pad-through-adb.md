---
title: Simulate Android D-pad through ADB
description: Simulate Android D-pad through ADB
pubDate: "Mar 21 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

Recently, I had to deal with testing D-pad functionality in my app. Unfortunately, my device doesn't have a D-pad.

So I rigged up this little script to simulate a dpad from the console of my desktop.

```sh
#!/bin/sh

# Key codes may be found at: https://groups.google.com/forum/#!topic/tasker/LJhmfxT2mj8%5B1-25-false%5D

SHELL_COMMAND="adb shell"

function send_keyevent {
	$SHELL_COMMAND input keyevent $1 &
}
function read_and_send_text_input {
	echo -n "Line: "
	read line
	$SHELL_COMMAND input text `echo $line | sed -e 's/ /%s/g'` &
}

while read -sN1 key; do
	# Catch multi-char special key sequences
	read -sN1 -t 0.0001 k1
	read -sN1 -t 0.0001 k2
	read -sN1 -t 0.0001 k3
	key+=${k1}${k2}${k3}

	case "$key" in
		# Up send_keyevent 
		$'\e[A'|$'\e0A') send_keyevent 19 ;;
		# Down
		$'\e[B'|$'\e0B') send_keyevent 20 ;;
		# Right
		$'\e[C'|$'\e0C') send_keyevent 22 ;;
		# Left
		$'\e[D'|$'\e0D') send_keyevent 21 ;;
		# Home
		$'\e[1~'|$'\e0H'|$'\e[H') send_keyevent 3 ;;
		# Insert
		$'\e[2~'|$'\e0I'|$'\e[I') read_and_send_text_input ;;
		# Enter or space
		$'') send_keyevent 23 ;;
	esac
done
```



It is an interactive script with no command line arguments.

Usage:

Insert: Begin text insert mode.

Arrows: D-pad

Enter/Space: D-pad middle button



Enjoy.
