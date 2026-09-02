---
title: Matlab nanrms
description: Matlab nanrms
pubDate: "Aug 13 2017"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

I often find the Matlab [nanmean](https://www.mathworks.com/help/stats/nanmean.html) function very useful. Unfortunately there is no builtin to behave similarly for RMS. So here is a snippet which may yield use!
 

```octave    
function r = nanrms(values)
% Compute the RMS of the given values, ignoring NaNs

r = [];
% For each row in the values vector/matrix, ignore NaNs
for i = 1:size(values, 2)
    row = values(:, i);
    nonNaNs = row(~isnan(row));
    r(end + 1) = rms(nonNaNs);
end
end
```    
