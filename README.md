# Denison Reporting Project Article To Pdf And Alt Text

Quick and dirty node script to take in a reporting project article web link,
download it locally with HTTrack, modify the images to have alt text by
calling to the OpenAI api, and the converting it all to a pdf.

This is a rough script, forgetting the trailing `/` in your url or even looking
at it wrong would break it. Additionally, it will almost definitely not work on
anything other than linux.

## Dependencies
The only dependency is to have HTTrack installed on on your PATH. On Nixpkgs,
install `httrack`. HTTrack is used to download the reporting project article
first before modifying it and then rendering it as a pdf.

And of course, have node package manager installed as it is a node project.

## Installation

Make sure `httrack` is installed, clone the repo, and run `npm install` to
install all node dependencies.

Before running, replace the executablePath on line 84:

```js
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });
```

To where-ever a browser is on your system for puppeteer to use to generate pdfs.

## Usage

```bash
npm start -- https://www.thereportingproject.org/any-article/
```

For instance:
```bash
npm start -- https://www.thereportingproject.org/bright-spot-cranberry/
```

## Notes
- Seems cost effective. Tried a couple of articles and haven't even reached a cent yet.
- We don't need HTTrack, we could just modify the DOM directly from puppeteer.
Downloading the website first just seemed like the most obvious solution.
- Having direct access to the wordpress files of The Reporting Project would
make the script much faster. The longest part is waiting for the website to
download.
