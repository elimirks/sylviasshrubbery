---
title: Coloured output for ADB logcat
description: Coloured output for ADB logcat
pubDate: "Apr 02 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

I always love nice colour coded debug messages, but all of the adb wrappers that currently exist seem to be far more complex than they really need to be.

So I rigged up this little bash script to neatly colour logcat.

```bash
#!/bin/bash

# Argument 1 is the optional log tag name.
# Always should ERRORS from the android runtime because that is where the
# exception message are generated from.
[ $1 ] && args+="$1:* AndroidRuntime:E *:S"

adb logcat $args | perl -pe '
s/^I.*$/\e[36m$&\e[0m/g;
s/^E.*$/\e[31m$&\e[0m/g;
s/^D.*$/\e[35m$&\e[0m/g;
s/^W.*$/\e[33m$&\e[0m/g;
s/^V.*$/\e[32m$&\e[0m/g;
'
```

As a bonus, you may specify your application tag name as the first argument to only show the output for messages with that tag. Note that it will also only show error-level messages from AndroidRuntime. (This is so that stack traces will be visible and such).
