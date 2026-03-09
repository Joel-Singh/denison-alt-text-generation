import 'dotenv/config'
import { argv } from 'node:process'
import { promisify } from 'node:util'
import { exec as exec_unpromised } from 'node:child_process'
import { open } from 'node:fs/promises'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import puppeteer from 'puppeteer-core'
import ollama from 'ollama'
import path from 'node:path'

let exec = promisify(exec_unpromised);

console.log("Reading web links for ./article-links.txt");

let article_links = [];

console.log("Reading ./article-links.txt");
const article_links_file = await open('./article-links.txt');
for await (const line of article_links_file.readLines()) {
    article_links.push(line);
}

console.log("Starting browser");
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });

const timed_out_articles = [];

const articles_being_downloaded = [];

let i = 0;
const LIMIT = 5;

const pdfs_being_generated = [];
for (let j = 0; j < LIMIT; j++) {
    pdfs_being_generated.push(continually_generate_pdfs());
}

await Promise.all(pdfs_being_generated);

await browser.close();

console.log("Finished generating all PDFs, manually check the following timed out articles: ");
for (const article of timed_out_articles) {
    console.log(article);
}

async function continually_generate_pdfs() {
    if (i < article_links.length) {
        console.log(`article ${i+1} out of ${article_links.length}`);
        i++;
        const url = article_links[i-1];
        return generate_pdf(url, timed_out_articles).then(continually_generate_pdfs).catch((error) => {
            console.log(`Erroring on ${url}`);
            throw error;
        });
    }
}


async function generate_pdf(url, timed_out_articles){

    let pdf_file_path = get_website_pdf_file_path(url);
    if (fs.existsSync(pdf_file_path)) {
        console.log(`Skipping ${url}, already downloaded`);
        return;
    }

    function log_with_context(msg) {
        console.log(`${url}: ${msg}`);
    }


    let page;
    try {
        page = await browser.newPage();
    } catch (error) {
        log_with_context(msg);
        throw error;
    }

    // Allows the ability to log and see it in stdout
    await page.exposeFunction('customLog', (message) => {
        log_with_context(`${message}`);
    });

    log_with_context(`Generating PDF`);

    log_with_context("Going to page");
    // Sleep 0.2 to not DDOS the reporting project
    await exec("sleep 0.2");

    await page_goto_with_retry(page, url);

    await page.evaluate(() => {
        // Replacing a embedded vimeo video with 
        const embedded_vimeo_videos = document.querySelectorAll("figure.is-provider-vimeo");

        customLog("Replacing embedded vimeo videos with text");
        for (const embedded_vimeo_video of embedded_vimeo_videos) {
            if (embedded_vimeo_video != null) {
                const title = embedded_vimeo_video.querySelector("iframe").title;

                const src = embedded_vimeo_video.querySelector("iframe").src;

                const replacement = document.createElement("ins");
                replacement.innerHTML = `Embedded article video titled "${title}" not rendered in PDF. <a href="${src}">Original Link</a>.`;

                embedded_vimeo_video.replaceWith(replacement);
            }
        }

        customLog("Removing Author Portrait");
        document.querySelector(".author-avatar")?.remove();

        customLog("Generating Alt Text");
        for (const img of document.querySelectorAll("img")) {
            // Removes "loading=lazy" from images so they show up in pdfs
            img.removeAttribute("loading");

            let img_parent = img.parentElement;
            if (img.alt == "") {
                try {
                    let alt_text = "";

                    let caption = '"empty caption"';
                    // We also check to see if the figcaption
                    // comes right after the figure--this isn't
                    // valid per spec but TRP does it
                    let figcaption = img_parent.querySelector('figcaption')?.cloneNode(true) || img_parent.parentElement.querySelector('figure + figcaption')?.cloneNode(true);

                    if (figcaption) {
                        figcaption.querySelector(".image-credit")?.remove();
                        caption = figcaption.innerText
                    }

                    let prompt = `Create a terse one sentence description describing WHAT is in this image without extraneous info. Avoid repeating information in the caption: ${caption}.`

                    customLog(`The prompt is: ${prompt} for ${img.src}`)
                    // const { message: { content: alt_text } } = await ollama.chat({
                    //     model: 'qwen3-vl:30b',
                    //     messages: [
                    //         {
                    //             role: 'user',
                    //             content: 'Generate alt text for this image',
                    //             images: [`${website_download}/${img.src}`]
                    //         }
                    //     ],
                    // })
                    //
                    // customLog(`Generated as alt text: ${alt_text}`);

                    img.alt = alt_text;
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                }
            }

            // There's a bug where if you have a nested img in a
            // figure, the resulting pdf is a figure nested in a
            // figure
            //
            // We don't need to worry about messing up the look of
            // the site because figures are styled through classes
            customLog("Converting figure > img to nonexistentElement > img");
            if (img_parent.tagName == "FIGURE") {
                let new_parent = document.createElement("nonexistentElement");
                new_parent.innerHTML = img_parent.innerHTML;
                img_parent.replaceWith(new_parent);
            }
        }
    });

    await exec(`mkdir -p ./articles-as-pdf/`);

    log_with_context("Waiting for the network to be idle")
    try {
        await page.waitForNetworkIdle();
    } catch (error) {
        log_with_context("Errored on waiting for network idle");

        if (error.name === 'TimeoutError') {
            timed_out_articles.push((await page.title()));
        } else {
            throw error;
        }
    }

    log_with_context("Downloading page as a pdf");
    try {
        await page_pdf_with_retry({
            path: pdf_file_path,

            // If set to false, the captions of figures will
            // have a white background covering up images
            omitBackground: true,

            printBackground: true,
            tagged: true,
            timeout: 60 * 1000,
        }, page, url);
    } catch (error) {
        log_with_context("Errored on pdf");
        if (error.name === 'TimeoutError') {
            log_with_context("PDF Timeout Error");
        }

        throw error
    }

    page.close();
    log_with_context("PDF now at " + `${pdf_file_path}`);
}

function get_website_pdf_file_path(url) {
    const file_name =
        url
        .replace(/https\:\/\//, '') // Get rid of the https at the front
        .replace(/[^a-zA-Z0-9\.\-\/\# ]/g, '') // Get rid of "irregular" characters
        .replace(/[ \.\/#]/g, '-') // Replace spaces, dots, slashes, and pound with a dash
        .replace(/-$/g, '') // Remove trailing dashes
        .toLowerCase();

    return `./articles-as-pdf/${file_name}.pdf`;
}

async function page_goto_with_retry(page, url) {
    try {
        await page.goto(url)
    } catch (error) {
        if (error.name === "TimeoutError") {
            console.log(`Failed to go to ${url}, trying again`);
            await page_goto_with_retry(page, url);
        } else {
            throw error;
        }
    }
}

async function page_pdf_with_retry(pdf_options, page, url) {
    try {
        await page.pdf(pdf_options);
    } catch (error) {
        if (error.name === "TimeoutError") {
            console.log(`Timed out downloading ${url} as pdf, trying again`);
            await page_pdf_with_retry(pdf_options, page, url);
        } else {
            throw error;
        }
    }
}
