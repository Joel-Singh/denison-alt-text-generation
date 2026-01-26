# Current Technical Plan

Currently, most of The Reporting Project articles (~90%)
[^1] have successfully been downloaded with HTTrack. The
next steps would be creating PDFs from those downloads
with alt text. There are two main ways to generate alt
text:

- Locally
- Through calling a cloud api

Calling on a cloud api has already been done and shown to
work. Moreover, local alt text generation is more
complicated. But, local generation has a couple benefits.
Unlike a cloud api, there won't be a cost to creating alt
text. And, local generation is more stable in the long
term as unlike cloud APIs, it won't suddenly deprecate.
Furthermore, the development cycle is significantly easier
as we can do full alt text generation test runs on the
roughly 1500 articles without fear of running out or
wasting credits.

I'm going to try generating alt text locally. If local
generation isn't feasible because of unexpected
complexity, takes absurd amounts of time to run, or
generates subpar alt text, then we'll simply fall back on
a cloud api.

[^1]: After letting my computer sit for awhile to scrape
    all of the reporting project articles, I realized it
    missed some articles located on a different domain. I
    assumed and restricted the scraping to
    thereportingproject.com. This will be adjusted and the
    missing articles added eventually.

# Generating Alt Text Locally

Here is a comparison of local alt text generation:
https://dri.es/comparing-local-llms-for-alt-text-generation

i was able to install node and npm on the denison
machines. Plus ollama. Time to figure out how to give it
an image?

# Documentation

Need to document the manual installation of nvm, node, and
technically npm (which is bundled with node)

Downloading websites with httrack (find the right options
from silver laptop)

And then running the program on a downloaded website.
(going to modify the program to just take in an index file).
