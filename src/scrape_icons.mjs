import fetch from "node-fetch";
import { writeFileSync } from "fs";

// Scrapes all Wunderground weather SVG icons
for (let i = 0; i <= 47; i++) {
  console.log(`Saving ${i}.svg...`);
  writeFileSync(`icons/${i}.svg`, Buffer.from(await (await fetch(`https://www.wunderground.com/static/i/c/v4/${i}.svg`)).arrayBuffer()));
}