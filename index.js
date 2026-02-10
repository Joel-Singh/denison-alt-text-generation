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
const page = await browser.newPage();

const timed_out_articles = [];
for (let i = 0; i < article_links.length; i++) {
    const url = article_links[i];
    console.log(`Generating PDF for ${url}`)
    console.log(`article ${i+1} out of ${article_links.length}`)

    await generate_pdf(url, page, timed_out_articles);
}

await browser.close();

console.log("Finished generating all PDFs, manually check the following timed out articles: ");
for (const article of timed_out_articles) {
    console.log(article);
}

async function generate_pdf(url, page, timed_out_articles){
    await page.goto(url);

    await page.evaluate(() => {
        console.log("Generating Alt Text");
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

                    console.log(`Generated as alt text: ${alt_text}`);

                    img.alt = alt_text;
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                }
            }
        }
    });

    await exec(`mkdir -p ./articles-as-pdf/`);

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

    await page.pdf({
        path: `./articles-as-pdf/${title_normalized}.pdf`,

        // If set to false, the captions of figures will
        // have a white background covering up images
        omitBackground: true,

        printBackground: true,
        tagged: true,
    });

    console.log("PDF now at " + `./articles-as-pdf/${title_normalized}.pdf`);
}
