---
title: "GLSL Mandelbrot"
description: "GLSL Mandelbrot"
pubDate: "Oct 30 2021"
heroImage: "../../assets/green-mandelbrot.png"
---

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />

## Intro

![Full Mandelbrot Set](/images/glsl-mandelbrot/fullbrot.png)

While working on magicpixel, I wanted to try rendering the Mandelbrot Set. I guess as a $$(sideproject)^2$$. Magicpixel was already using OpenGL for rendering, so it was pretty simple to reuse all the boilerplate code. I pretty much just had to chop out a bunch of unnecessary code and change the fragment shader (more on that later). Here's the [Github repo](https://github.com/elimirks/miscprojects/tree/master/glsl_mandelbrot) for the full project source code.

The Mandelbrot Set is a fractal defined as the following:

For every point in complex form $$c = x + yi$$, $$z$$ does not diverge.

$$
\forall n \ge 0\\
z_0 = 0\\
z_{n+1} = z_n^2 + c\\
$$

## Mandelbrot Set Approximation

![Green Boi](/images/glsl-mandelbrot/green_boi.png)

To get an approximation, we could say $$z$$ does not diverge _to a high value of_ $$n$$, instead of "z does not diverge at all". The higher maximum value of $$n$$, the closer the approximation is to the exact set. However, using a higher number means it will be more computationally expensive. I learned about this technique in a Computational Physics course, but the version I wrote back then was rendering on a single CPU thread, so was too slow to interact with.

Here's a snipped to decide, approximately, if the point $$(x,y)$$ is in the Mandelbrot set, written in GLSL.

```c
bool in_set(float x, float y) {
    int max_iterations = 5000;

    vec2 c = vec2(x, y);
    vec2 z = vec2(0.0, 0.0);

    for (int i = 0; i < max_iterations; i++) {
        if (isinf(magnitude(z))) {
            return false;
        }

        z = product(z, z) + c;
    }

    return true;
}
```

But if we were to render this, we would only have a black and white photo. To make the image more interesting, let's think about how to color the image.

## Coloring

![Minibrot](/images/glsl-mandelbrot/minibrot.png)

The coloring technique I used is to keep track of how many iterations ran per pixel before it realized the pixel isn't in the set (`return false` of the above code). By comparing iteration to the max iterations, we have a percentage of how close to the set we were.

So instead of returning a boolean, we could return `vec3(0.0, 0.0, 0.0)` (black) if a pixel is in the set, or use a formula if it is not in the set:

```c
float percent = float(iterations) / float(max_iterations);
return percent * vec3(1.0, 0.0, 0.0);
```

This formula will paint pixels shades of red depending on how far away they are from being in the Mandelbrot set.

But something I noticed was that it wasn't spread nicely. The coloring was very focused near the edges of the rendering, but didn't transition nicely towards the edges. So to make it a bit nicer, I added an exponential decay:

```c
float v0 = float(iterations) / float(max_iterations);
// Decay so the color distribution isn't so close to the edge
float v = pow(1.0 - v0, 30.0);
```

To make it more interesting, we could also cycle through a color palette. I chose red->green->blue but it could be anything:

```c
vec3 palette[4] = {
    vec3(0.0, 0.0, 0.0),
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0)
};
// -1 since the first color is just for transition from black (in-set) to red
int palette_size = 3;
```

To pick a color from the palette, I multiplied the magnitude `v` by the palette size. To get smooth transitions, I ran linear interpolation between the "upper" and "lower" palette values:

```c
float v0 = float(i) / float(max_iterations);
// Palette decay so the color distribution isn't so close to the edge
float v = pow(1.0 - v0, 30.0);

float pal_coord = v * palette_size;

vec3 floor_col = palette[int(pal_coord)];
vec3 ceil_col  = palette[int(pal_coord) + 1];
float dist = pal_coord - floor(pal_coord);

// Linear interpolate between upper and lower palette values
return mix(floor_col, ceil_col, dist);
```

## GLSL & Shaders

![Trail of Red](/images/glsl-mandelbrot/trail.png)

So why use GLSL? In magicpixel, we were originally rendering via the CPU. In that project, we basically had a bunch of grid squares to paint solid colors, so CPU rendering was.... ok-_ish_ at first. But when we increased the grid size it became abysmally slow. I won't go into detail about that project in this post, but basically we increased our FPS from 60 to 3000 by rendering via fragment shaders.

A "fragment shader" is a program that will run on your GPU. It basically decides what color each pixel should be, parallelized across all your GPU shader cores. So by computing the mandelbrot set on the GPU, we could parallelize the work _super easily_.

## Limitations

![Poor Fidelity](/images/glsl-mandelbrot/poor_res_1.54eminus4.png)

One limitation with this approach is floating point precision. At a certain point of zooming (\\(1.54e-4\\) in the above image), the quality of the rendering goes down significantly.

One technique people use for infinite zoom is using arbitrary precission arithmetic. But from what I've read CPUs are much better for performing arbitrary precision math. So using GLSL is great for an interactive toy, but doesn't scale ad infinitum :(
