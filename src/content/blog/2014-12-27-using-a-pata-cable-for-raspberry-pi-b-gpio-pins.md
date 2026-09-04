---
title: Using a PATA cable for Raspberry Pi B+ GPIO pins
description: Using a PATA cable for Raspberry Pi B+ GPIO pins
pubDate: "Dec 27 2014"
heroImage: "../../assets/pata_pi.jpg"
---

This is not a very impressive discovery... but I figured out that with a (very little) bit of work, a PATA ribbon cable works perfectly with the Raspberry Pi B+!

However, as you can see here, PATA cables have one pin sealed off, which blocks it from plugging in to the GPIO pins on the Pi.

![PATA Header](/images/pi-pata/pata_original.jpg)

As it turns out, it is just a thin piece of plastic, and has a usable connection underneath.

I used the nice ghetto method of hammering a nail into it.

![PATA Cable in a Vice](/images/pi-pata/pata_vice.jpg)

And there you have it - a nice ribbon cable that fits perfectly into the Pi GPIO pins.

![Modified PATA cable](/images/pi-pata/pata_finished.jpg)
![Modified PATA cable attached to a Raspberry Pi](/images/pi-pata/pata_pi.jpg)

Also note - If you have a case like mine, you might have to break off the top of the PATA connector for the lid to fit properly.
