import 'dotenv/config'
import { argv } from 'node:process'
import { promisify } from 'node:util'
import { exec as exec_unpromised } from 'node:child_process'
import { readFile, writeFile} from 'node:fs/promises'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import puppeteer from 'puppeteer-core'
import OpenAI from "openai"

const openai = new OpenAI();

let exec = promisify(exec_unpromised);

if (argv[2] == undefined) {
    throw Error("Didn't pass in website. Do node start -- https://example.com");
}

const website = argv[2];

await download_website_with_httrack(website);

// Copy the website download
await exec(`rm -rf HTTrack-modified && cp -r HTTrack-website-downloads HTTrack-modified`);

const website_without_http = website.slice(8);
const index_file_path = `./HTTrack-website-downloads/${website_without_http}index.html`;
const index_file = await readFile(index_file_path, 'utf8');

const { window: { document: website_document } } = new JSDOM(index_file);

console.log("Generating Alt Text");
for (const img of website_document.querySelectorAll("img")) {
    if (!/wp-content/.test(img.src)) { // skip non-uploaded images
        continue;
    }

    // Need to remove the srcset from images--we only have just the src image from the download
    img.removeAttribute("srcset");

    // Removes "loading=lazy" from images so they show up in pdfs
    img.removeAttribute("loading");

    const base64img = fs.readFileSync(`HTTrack-modified/${website_without_http}${img.src}`, "base64");

    if (img.alt == "") {
        try {
            const { output_text: alt_text } = await openai.responses.create({
                model: "gpt-4.1-mini",
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: "Generate alt text"
                            },
                            {
                                type: "input_image",
                                image_url: `data:image/jpg;base64,${base64img}`
                            }
                        ]
                    }
                ]
            });

            console.log(`Generated as alt text: ${alt_text}`);

            img.alt = alt_text;
        } catch (error) {
            console.error(error);
        }
    }
}


// Write the index with the new alt text
const copied_index_file_path = `./HTTrack-modified/${website_without_http}index.html`;
await writeFile(copied_index_file_path, website_document.querySelector(":root").outerHTML);

console.log("Taking a pdf of the site");
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });
const page = await browser.newPage();

const url = `${process.cwd()}/HTTrack-modified/${website_without_http}index.html`;
await page.goto(`file:///${process.cwd()}/HTTrack-modified/${website_without_http}index.html`);

await exec(`mkdir -p ./website-as-pdf/${website_without_http}`);

await page.pdf({
    path: `./website-as-pdf/${website_without_http}index.pdf`,
});

await browser.close();

console.log("Pdf is now at " + `./website-as-pdf/${website_without_http}index.pdf`);

async function download_website_with_httrack(website) {
    console.log(`Downloading ${website}`);

    const { stdout, stderr } = await exec(`mkdir -p HTTrack-website-downloads && rm -rf ./HTTrack-website-downloads/* && cd HTTrack-website-downloads && httrack ${website} +* -r2`);

    console.log(stdout);
    console.log(stderr);
}
