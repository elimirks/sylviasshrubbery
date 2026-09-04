---
title: How to change login shell without chsh permissions
description: How to change login shell without chsh permissions
pubDate: "Feb 05 2016"
heroImage: "../../assets/programmer-cat.jpg"
---

On the University of Toronto servers and Linux lab computers, the default shell is tcsh, and we don't have chsh access _shakes fist_.

If you are in a similar circumstance, plop this in ~/.cshrc:

```csh
# Run zsh only if we are in an interactive shell
if ( $?prompt && -f /bin/zsh ) then
        exec /bin/zsh
# Run bash if we are in an interactive shell and if zsh isn't found
else if ( $?prompt && -f /bin/bash ) then
        exec /bin/bash
endif
```

If you just run `exec /bin/bash` (without checking for the interactive shell), it will break non-interactive shells like scp and the GNOME startup scripts. If you just use bash you can ignore the first conditional. The reason why I have bash as a backup is because the lab computers have zsh installed, but the servers only have bash.

Bai :)

P.S. A little known fact about the UofT computing services is that you can SSH into lab computers directly. For instance, dh2026pc02.utm.utoronto.ca connects to "PC #02" in DH2026.
