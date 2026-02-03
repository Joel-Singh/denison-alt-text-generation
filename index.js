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
    throw Error("Didn't pass in the httrack archive. Do npm start -- '/home/apple/httrack-archive/'");
}

let httrack_archive = argv[2];

// Copy the httrack archive
console.log("Making a copy of the httrack_archive");
await exec(`rm -rf website-to-archive && rsync -a --del ${httrack_archive}/ website-to-archive`);

console.log("Finding all the directories with index files")
let website_downloads = (await exec('ls -d ./website-to-archive/*/')).stdout.split('\n');

website_downloads = website_downloads.filter(
    (website_download) => fs.existsSync(`${website_download}index.html`)
);

console.log("Starting browser");
const browser = await puppeteer.launch({ executablePath: '/home/apple/.nix-profile/bin/google-chrome-stable' });
const page = await browser.newPage();

for (const website_download of website_downloads) {
    console.log(`Generating PDF for ${website_download}`);

    await generate_pdf(website_download, page);
}

await browser.close();

async function generate_pdf(website_download, page){
    const index_file = await readFile(`${website_download}index.html`, 'utf8');

    const { window: { document: website_document } } = new JSDOM(index_file);

    // Remove the gravatar avatars. They're just blank on the real
    // site... not sure why they're there.
    website_document.querySelector(".author-avatar")?.remove();

    // A little square is made to the left of "category" links
    // with ::before elements. These are not rendered in PDFs.
    // The easiest fix is to just move the category link over
    // so there isn't an awkward 
    website_document.querySelector(".cat-links > a")?.setAttribute("style", "margin-left: -1.5em")

    console.log("Generating Alt Text");
    for (const img of website_document.querySelectorAll("img")) {
        // Need to remove the srcset from images--we only have just the src image from the download
        img.removeAttribute("srcset");

        // Removes "loading=lazy" from images so they show up in pdfs
        img.removeAttribute("loading");


        // If the img wasn't archived--links to an https
        // source--then just skip it
        if (/https/.test(img.src)) {
            continue;
        }

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

    // Write the index with the new alt text
    await writeFile(`${website_download}index.html`, website_document.querySelector(":root").outerHTML);


    console.log("Taking a pdf of the site");

    // Slice to get rid of the relative './'
    const url = `file:///${process.cwd()}/${website_download.slice(2)}index.html`;
    await page.goto(url);

    await exec(`mkdir -p ./website-as-pdf/`);

    await page.pdf({
        path: `./website-as-pdf/${path.basename(website_download)}.pdf`,
    });

    console.log("Pdf is now at " + `./website-as-pdf/${path.basename(website_download)}.pdf`);
}

