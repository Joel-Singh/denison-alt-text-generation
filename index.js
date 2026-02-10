import 'dotenv/config'
import { argv } from 'node:process'
import { promisify } from 'node:util'
import { exec as exec_unpromised } from 'node:child_process'
import { readFile, writeFile} from 'node:fs/promises'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import puppeteer from 'puppeteer-core'
import ollama from 'ollama'
import path from 'node:path'

let exec = promisify(exec_unpromised);

if (argv[2] == undefined) {
    throw Error("Didn't pass in a website. Do npm start -- 'https://example.com'");
}

let url = argv[2];

// Copy the httrack archive

console.log("Starting browser");
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });
const page = await browser.newPage();

console.log(`Generating PDF for ${url}`);

await generate_pdf(url, page);

await browser.close();

async function generate_pdf(url, page){
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

    await exec(`mkdir -p ./website-as-pdf/`);

    console.log("Waiting for network idle");
    await page.waitForNetworkIdle();

    console.log("Creating PDF");
    await page.pdf({
        path: `./website-as-pdf/index.pdf`,

        // If set to false, the captions of figures will
        // have a white background covering up images
        omitBackground: true,

        printBackground: true,
        tagged: true,
    });

    console.log("Pdf is now at " + `./website-as-pdf/index.pdf`);
}
