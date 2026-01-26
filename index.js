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
    throw Error("Didn't pass in website. Do npm start -- '/home/apple/downloaded-website/new-puppy-shelter/'");
}

let website_download = argv[2];

// Copy the website download
await exec(`rm -rf website-to-archive && cp -r ${path.dirname(website_download)} website-to-archive`);

// WARNING: This is a hardcoded path, we're assuming the
// downloaded folder is called
// "www.thereportingproject.com"
//
// Change the website download to a copy so we don't
// overwrite the original
website_download = `./website-to-archive/${path.basename(website_download)}`;

const index_file = await readFile(`${website_download}/index.html`, 'utf8');

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

    // const base64img = fs.readFileSync(`${website_download}${img.src}`, "base64");

    if (img.alt == "") {
        try {
            // const { message: { content: alt_text } } = await ollama.chat({
            //     model: 'qwen3-vl:30b',
            //     messages: [{role: 'user', content: 'Hello!'}],
            // })
            const alt_text = "This is a placeholder!";

            console.log(`Generated as alt text: ${alt_text}`);

            img.alt = alt_text;
        } catch (error) {
            console.error(error);
        }
    }
}

// Write the index with the new alt text
await writeFile(`${website_download}/index.html`, website_document.querySelector(":root").outerHTML);


console.log("Taking a pdf of the site");
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });
const page = await browser.newPage();

// Slice to get rid of the relative './'
const url = `file:///${process.cwd()}/${website_download.slice(2)}/index.html`;
await page.goto(url);

await exec(`mkdir -p ./website-as-pdf/${path.basename(website_download)}`);

await page.pdf({
    path: `./website-as-pdf/${path.basename(website_download)}/index.pdf`,
});

await browser.close();

console.log("Pdf is now at " + `./website-as-pdf/${path.basename(website_download)}/index.pdf`);
