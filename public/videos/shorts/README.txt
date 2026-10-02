Homepage short-video slots
==========================

Place vertical MP4 clips in this folder using these filenames:

robotics-talks.mp4
one-to-one-meeting.mp4
podcast-guest.mp4
stem-partnerships.mp4

Each matching card on the homepage already has its future video path recorded
in a data-short-video attribute in index.html. The short cards currently show
video-slot placeholders and "Coming soon" labels. To make a clip playable on
the homepage, replace that card's home-short-card__screen placeholder with an
HTML <video controls playsinline preload="metadata"> element and a <source>
pointing to its clip. Keep the existing card contents to preserve the design.
