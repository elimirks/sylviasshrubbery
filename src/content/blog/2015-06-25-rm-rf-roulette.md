---
title: rm -rf roulette
description: rm -rf roulette
pubDate: "Jun 25 2015"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

{{< load-photoswipe >}}

So at work, I recently migrated over from my Linux box to an OS X box, and the old box will soon be formatted... so I decided to have a bit of fun with it!

I present you with rm_rf_roulette.sh!!

```bash
#!/bin/bash
directories="boot/* bin/* etc/* lib/* opt/* root/* run/* srv/* sys/* usr/* var/*"
files=($(ls --color=never -d $directories | egrep -v "(:$|^$)"))
fileToDelete="${files[RANDOM % ${#files[@]}]}"
echo "Deleting $fileToDelete"
rm -rf $fileToDelete
```

I plan to run this in a loop until it no longer has the capability of running :)

UPDATE:

Before:

{{< figure src="/images/misc/rmrf_before.png" >}}

After:

{{< figure src="/images/misc/rmrf_after.png" >}}

I would say this is a success.
