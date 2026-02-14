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
const LIMIT = 10;
for (let j = 0; j < LIMIT; j++) {
    continually_generate_pdfs();
}

async function continually_generate_pdfs() {
    if (i < article_links.length) {
        console.log(`article ${i+1} out of ${article_links.length}`);
        generate_pdf(article_links[i], timed_out_articles).then(continually_generate_pdfs);
        i++;
    }
}

console.log("Finished generating all PDFs, manually check the following timed out articles: ");
for (const article of timed_out_articles) {
    console.log(article);
}

async function generate_pdf(url, timed_out_articles){
    const page = await browser.newPage();

    // Allows the ability to log and see it in stdout
    await page.exposeFunction('customLog', (message) => {
        console.log(`${message}`);
    });

    console.log(`Generating PDF for ${url}`);

    console.log("Going to page");
    // Sleep 0.2 to not DDOS the reporting project
    await exec("sleep 0.2");
    await page.goto(url);

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

        customLog("Generating Alt Text");
        for (const img of document.querySelectorAll("img")) {
            // Removes "loading=lazy" from images so they show up in pdfs
            img.removeAttribute("loading");

            if (img.alt == "") {
                try {
                    let alt_text = "";
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

                    // customLog(`Generated as alt text: ${alt_text}`);

                    img.alt = alt_text;
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                }
            }
        }
    });

    await exec(`mkdir -p ./articles-as-pdf/`);

    console.log("Waiting for the network to be idle")
    try {
        await page.waitForNetworkIdle();
    } catch (error) {
        if (error.name === 'TimeoutError') {
            timed_out_articles.push((await page.title()));
        } else {
            throw error;
        }
    }

    const title_normalized =
        (await page.title())
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/ /g, '-')
        .toLowerCase();

    console.log("Downloading page as a pdf");
    await page.pdf({
        path: `./articles-as-pdf/${title_normalized}.pdf`,

        // If set to false, the captions of figures will
        // have a white background covering up images
        omitBackground: true,

        printBackground: true,
        tagged: true,
    });

    page.close();
    console.log("PDF now at " + `./articles-as-pdf/${title_normalized}.pdf`);
}
