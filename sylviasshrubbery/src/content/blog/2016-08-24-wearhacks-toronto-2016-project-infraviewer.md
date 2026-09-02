---
title: 'WearHacks Toronto 2016 Project: InfraViewer'
description: 'WearHacks Toronto 2016 Project: InfraViewer'
pubDate: "Aug 24 2016"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

At WearHacks Toronto 2016, we were trying to think of project ideas, but nothing came to mind that we all agreed on. So Adrian, Austin and I went out for coffee to take a mental break. While at the coffee shop, we were talking about all the types of light humans are blind to. Wouldn't it be amazing if we could the whole spectrum of light, including infra red and ultra violet? ... maybe we can!

When we got back to the Bitmaker offices (where the hackathon was held), we checked out the available hardware to see if there were any IR cameras. Unfortunately, the only IR camera we could find was on the Kinect, and it's IR camera only has intensity (not spectrum data). So we made due with what we had and decided to use both the IR and RGB cameras of the Kinect to render both layers on top of each other.

Josh, Austin and I worked on the translation algorithm while Kulraj and Nick created an SFML GUI. The colorspace transformation algorithm we ended up designing and implemented was to shift the visible light by 10 degrees (hue), then shift the IR spectrum into the first 10 degrees of red hue. Essentially, we squeezed the visible light from the non-IR camera so there was no red left, then put a red layer on top of that image to display the infra red data.

The hardware turned out to be pretty difficult to overlay. The IR camera and visible light cameras had significantly different resolutions and aspect ratios. So we had to program some magic to translate the IR data to fit on top of the RGB data. Because of this, the IR layer was slightly offset from where it should have been. For instance, a slight red glow would appear around our bodies (from our body heat), but it would be shifted one side, since the camera perspectives were not identical.

{{< load-photoswipe >}}
{{< figure height="256" src="/images/misc/wearhacks2016.jpg" >}}

You can check out the project here: [InfraViewer](https://github.com/Dirision/WearHacks2016). But be warned, the code base is pretty messy!

