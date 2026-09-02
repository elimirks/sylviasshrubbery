---
title: LÖVE Platform Animations
description: LÖVE Platform Animations
pubDate: "Apr 16 2018"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

My introduction to programming was game development. I started with ActionScript 2 (R.I.P. Macromedia Flash), then moved on to C++ with [SFML](https://www.sfml-dev.org/) (to this day, it's my go-to C++ multimedia framework). I also dabbled a bit with [LÖVE](https://love2d.org), a Lua game framework.

I'm currently staying in Vienna, working remotely from the [Metalab](https://metalab.at/) pretty much every day. Many people were working on side projects, which made me want to work on a new small side project. I wanted to see how well I could animate a sprite set using LÖVE. I found [this sprite set](https://opengameart.org/content/ninja-animated), which seemed nice, so I decided to animate it over the weekend.

Using the AABB hit test algorithm, the character movement works such that even if it has "infinite" velocity, it won't be able to travel through walls. Depending on the horizontal and vertical velocity of the character, he will run, roll, slide, crawl, or wall-jump.

You can find the source code [here](https://github.com/elimirks/miscprojects/tree/master/loveanimations). Since it was a weekend project, the code is pretty messy with lots of fun magic numbers. To run it, install [LÖVE](https://love2d.org) and run `love .` in the project directory. The controls are simply the arrow keys. Press down to duck or roll (depending on the player momentum).

Below is a video of the basic mechanices.

<video height="794" width="630" controls src="/video/loveanimations.mp4"></video>
