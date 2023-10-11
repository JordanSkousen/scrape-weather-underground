import fetch from "node-fetch";
import moment from "moment";
import { stringify } from "csv-stringify";
import { writeFileSync } from "fs";

let day = moment({ year: 1948, month: 0, day: 1 });
let lastSavedYear = 1948;
let output = [];
const translator = {
  temp: "Temperature",
  wx_icon: "Icon",
  wx_phrase: "Condition",
  rh: "Humidity",
  pressure: "Pressure",
  vis: "Visibility",
  wc: "WindChill",
  wdir: "WindDirection",
  wspd: "WindSpeed",
  precip_total: "Precipitation",
  feels_like: "FeelsLike",
  uv_index: "UVIndex",
  clds: "CLDS",
};

const save = () => {
  // Writes `output` to ./output/weatherRaw.csv.
  console.log("Converting to CSV...");
  stringify(output, {
    header: true,
    columns: ["Timestamp"].concat(Object.values(translator)),
  }, (err, csv) => {
    if (err) {
      console.log(`ERROR converting to CSV! `, err);
      return;
    }
    console.log("Converted to CSV. Writing to file...");
    writeFileSync("output/weatherRaw.csv", csv);
    lastSavedYear = day.year();
    console.log("Successfully wrote CSV to file.");
  });
};

// Scraping historical weather data from Wunderground API
while (day.valueOf() < moment().valueOf()) {
  const end = moment(day).endOf("month");
  console.log(`Getting data from ${day.format("MMM DD, YYYY")} – ${end.format("MMM DD, YYYY")}...`);
  try {
    const data = await (await fetch(`https://api.weather.com/v1/location/KSLC:9:US/observations/historical.json?apiKey=e1f10a1e78da46f5b10a1e78da96f525&units=e&startDate=${day.format("YYYYMMDD")}&endDate=${end.format("YYYYMMDD")}`)).json();
    if (data?.observations) {
      for (const observation of data.observations) {
        output.push({
          Timestamp: moment(observation.valid_time_gmt * 1000).format("M/D/YYYY H:mm"),
          ...Object.fromEntries(Object.entries(translator).map(([key, val]) => [val, observation[key]])),
        });
      }
    }
    day = day.add(1, "month");
    if (day.year() !== lastSavedYear) {
      save(); // Periodically write the CSV after each year, in case something goes wrong
    }
  }
  catch (err) {
    console.log(`ERROR CAUGHT! `, err);
  }
}

// Final save of the CSV
save();
console.log("Finished.");