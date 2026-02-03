= Current State Of PDF Generation And Inserting Alt Text

I was able to successfully convert 500 Reporting Project
articles to PDFs (see the shared folder), but there are
about 1000 articles total. The missing articles are due to
having trouble "downloading" The Reporting Project
website. How it works, is I first download every single
page on The Reporting Project website and then run my
program on the download to convert every webpage to a PDF.

Due to the size of The Reporting Project website, I have
had various troubles properly downloading it such as only
being able to download half of the articles. I have met
with the webmaster before break who gave me advice on
downloading but who was unable to provide me with a easy,
go-to, way to do so.

== Images

I am having issues getting images to consistently load for
all PDFs. If you skim the shared google drive folder of
the converted PDFs, you'll notice a mix of articles with
and without images. This is related to my earlier issue of
having trouble "downloading" the entire website, with
images missing. Despite this issue, all text from the
websites work completely fine.

== Alt Text And Adobe Accessibility Checker

From within Adobe Acrobat, the standard way to interact
with PDFs, my generated PDFs are passing almost all of the
accessibility checks. Additionally, screen readers are
able to parse them and text is read in the right order.
However, alt text has only been able to be partially
inserted. Adobe reports that alt text is missing on images
despite also showing that there is alt text--including on
hover. Moreover, the alt text I add is not being read by
screen readers (though the rest of the document is read
fine!).

== Next Steps

- Properly "download" The Reporting Project website
- Fix images not loading
- Correctly insert alt text, so that it is read aloud and
  passes accessibility checks
