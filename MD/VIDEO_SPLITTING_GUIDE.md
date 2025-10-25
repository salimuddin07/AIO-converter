I'll create a simple solution and guidance instead of trying to fix the complex auto-split feature.

The current issue is that you're getting only one segment because when you enter "0:00-0:30", 
you're creating exactly one segment from 0 to 30 seconds.

## Solutions:

### Option 1: Use Equal-Length Splitting (Recommended)
- Select "Split into equal-length clips"
- Set Minutes: 0, Seconds: 30 (or whatever duration you want)
- This will automatically split your ENTIRE video into 30-second segments

### Option 2: Enter Multiple Custom Segments
Instead of entering:
```
0:00-0:30
```

Enter multiple segments like:
```
0:00-0:30 | Part 1
0:30-1:00 | Part 2
1:00-1:30 | Part 3
1:30-2:00 | Part 4
2:00-2:30 | Part 5
```

This will create 5 separate 30-second segments.

The key point is: Each line = One output video file

So if you want multiple segments, you need multiple lines.