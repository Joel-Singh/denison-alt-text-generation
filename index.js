import 'dotenv/config'
import { argv } from 'node:process'
import { promisify } from 'node:util'

import { exec as exec_unpromised } from 'node:child_process'

let exec = promisify(exec_unpromised);

if (argv[2] == undefined) {
    throw Error("Didn't pass in website. Do node start -- https://example.com");
}

const website = argv[2];

const { stdout, stderr } = await download_website_with_httrack(website);

console.log(stdout);
console.log(stderr);

async function download_website_with_httrack(website) {
    console.log("Downloading website");
    const { stdout, stderr } = await exec(`mkdir -p HTTrack-website-downloads && rm -rf "./HTTrack-website-downloads/*" && cd HTTrack-website-downloads && httrack --stay-on-same-domain ${website} -r3`);

    return { stdout, stderr };
}
