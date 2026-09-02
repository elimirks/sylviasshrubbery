---
title: Vocabulary.com - Shell script edition!
description: Vocabulary.com - Shell script edition!
pubDate: "Jan 04 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

I found that I often look words up on vocabulary.com. In my opinion, this is a process which could be greatly optimized.

So now I have this handy script for fetching word searches right from the comfort of my own terminal:


```bash
#!/bin/bash
curl -s "http://www.vocabulary.com/dictionary/autocomplete?search=$@" | perl -pe '
        s/<span[^>]*>([\w\s]*)<\/span>\s*<span[^>]*>([\w\s\p{P}]*)<\/span>/\n\e[36m\1:\t\e[0m \2\n/g;
        s/^\s+$//g; # Remove blank lines
' | perl -pe '
        # Remove all other junk.
        s/^<\/?(li)?(ol)?.*\n?//g;
'
```


Example use:


```    
vocabulary.sh <search term>
vocabulary.sh test
```

I just put this puppy in my ~/bin directory which is included in my execution path. No more worrying about going to the web browser for word lookups from my favorite dictionary! :)
