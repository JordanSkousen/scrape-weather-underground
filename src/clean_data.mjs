import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify";
import { readFileSync, writeFileSync } from "fs";
import moment from "moment";

const columns = ["Timestamp", "Temperature", "Icon", "Condition", "Humidity", "Pressure", "Visibility", "WindChill", "WindDirection", "WindSpeed", "Precipitation", "FeelsLike", "UVIndex", "CLDS"];
console.log(`Reading and parsing CSV file...`);
const records = parse(readFileSync("output/weatherRaw.csv"), {
  columns: true,
});
const newRecords = [];

console.log(`Successfully parsed ${records.length} records.`);
let lastEntryTimestamp = moment(records[0].Timestamp, "M/D/YYYY H:mm").subtract(1, "hour");
for (let i = 0; i < records.length; i++) {
  if (i % 5000 === 0) {
    console.log(`Cleaning records ${i} – ${Math.min(records.length, i + 4999)}...`);
  }
  let record = records[i];
  const timestamp = moment(record.Timestamp, "M/D/YYYY H:mm");
  if (timestamp.diff(lastEntryTimestamp, "hours", true) < 1) {
    continue; // All records must be at least an hour apart from each other!
  }
  lastEntryTimestamp = timestamp;
  for (const column of columns) {
    // If the value of a column is missing in this row, copy the previous row's value for this column onto this row (except for Precipitation)
    if ((record[column] === "" || !record[column]) && newRecords.length > 0 && column !== "Precipitation") {
      record[column] = newRecords[newRecords.length - 1][column];
    }
  }
  if (record.Precipitation === "" || !record.Precipitation) {
    record.Precipitation = 0; // if Precipitation is blank, assume 0
  }
  if (Number.parseInt(record.UVIndex) < 0) {
    record.UVIndex = "0"; // removes strange negative UV indexes from the data
  }
  if (!Number.isNaN(Number.parseFloat(record.Pressure))) {
    record.Pressure = Number.parseFloat(record.Pressure) + 5;
  }
  newRecords.push(record);
}

console.log(`Converting new records to CSV...`);
stringify(newRecords, {
  header: true,
  columns,
}, (err, csv) => {
  if (err) {
    console.log(`ERROR converting to CSV! `, err);
    return;
  }
  console.log("Converted to CSV. Writing to file...");
  writeFileSync("output/weatherCleaned.csv", csv);
  console.log("Successfully wrote CSV to file. Finished.");
});