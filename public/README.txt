This site embeds videos via YouTube (recommended: best quality auto-adjusts to the viewer's connection, loads fast, and doesn't use your own hosting's bandwidth).

## How to add a video anywhere you see VIDEO_ID in the code

1. Upload your video to YouTube. If you don't want it publicly searchable, set visibility to Unlisted (anyone with the link can watch, it just won't show up in search or your channel).
2. Open the video, click Share, copy the link -- it looks like https://youtube.com/watch?v=abc123XYZ
3. The part after v= (here, abc123XYZ) is your Video ID.
4. Find every VIDEO_ID placeholder in these files and replace it with your real ID:
   - media.html (3 videos: Samaa TV, Ailaan Podcast, Aaj News)
   - projects/geneva.html
   - projects/singapore.html
   - projects/robotron.html

That's it -- no re-uploading video files, no hosting limits, and it plays instantly since YouTube handles the streaming.

## If you'd rather self-host a video file instead

Less recommended (bigger files slow your site down), but if you want to: replace the <iframe> block with:
  <video src="../assets/videos/yourfile.mp4" controls style="width:100%; height:100%; object-fit:cover;"></video>
Keep files under ~15MB each (compress with HandBrake or similar) for a fast-loading site.
