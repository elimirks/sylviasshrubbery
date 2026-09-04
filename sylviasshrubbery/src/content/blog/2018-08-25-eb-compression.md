---
title: EB Image Compression Algorithm
description: EB Image Compression Algorithm
pubDate: "Aug 25 2018"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

For a while, I've been interested in image compression algorithms. Specifically, [lossless](https://en.wikipedia.org/wiki/Lossless_compression) image compression algorithms. I thought of a really simple area-based lossless compression algorithm on Friday, so I wrote a small program to compress [PPM](https://en.wikipedia.org/wiki/Netpbm_format) files. The compressed format, Eli Bitmap (EB), stores rectangles of identical color as "regions" in the bitmap data. Any pixels that could not be reasonably compressed using into rectangles would be appended after the rectangle region definitions. If you want to see the program, [here it is](https://github.com/elimirks/miscprojects/tree/master/eb_compression/src).

In theory, images with large blank regions should compress the best. Images with rapidly varying texture don't have as many rectangle regions, so they won't work as well.

I took the below images from [OpenGameArt.org](https://opengameart.org/) (thanks!).

Tanks
-----

This is the first large image I tried using EB compression. It turned out quite well, with less than a third the original PPM file size. Of course, PNG performed better than EB, but there is a much larger gap between EB and PPM.

| Format | File Size |
| ------ | --------- |
| PNG    | 238K      |
| PPM    | 1.5M      |
| EB     | 341K      |

![Tanks](/images/eb-compression/tanks.png)

Forest
-----

In this image, notice how the textures are constantly changing. Thus, there likely aren't very many mono-colored rectangles. Sadly, EB compression only shaved off about 100K from the 658K PPM file.

| Format | File Size |
| ------ | --------- |
| PNG    | 128K      |
| PPM    | 658K      |
| EB     | 576K      |

![Forest](/images/eb-compression/forest.png)
