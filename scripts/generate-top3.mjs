import fs from "fs";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GA4_PROPERTY_ID;
const credentialsJson = process.env.GA4_SERVICE_ACCOUNT_JSON;

if (!propertyId) throw new Error("GA4_PROPERTY_ID is missing");
if (!credentialsJson) throw new Error("GA4_SERVICE_ACCOUNT_JSON is missing");

const credentials = JSON.parse(credentialsJson);

const client = new BetaAnalyticsDataClient({
  credentials,
});

const [response] = await client.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [
    {
      startDate: "30daysAgo",
      endDate: "today",
    },
  ],
  dimensions: [
    { name: "customEvent:cultivar_name" },
  ],
  metrics: [
    { name: "eventCount" },
  ],
  dimensionFilter: {
    andGroup: {
      expressions: [
        {
          filter: {
            fieldName: "eventName",
            stringFilter: {
              matchType: "EXACT",
              value: "select_cultivar",
            },
          },
        },
      ],
    },
  },
  orderBys: [
    {
      metric: {
        metricName: "eventCount",
      },
      desc: true,
    },
  ],
  limit: 20,
});

const top3 = (response.rows ?? [])
  .map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? "",
    count: Number(row.metricValues?.[0]?.value ?? 0),
  }))
  .filter((row) => {
    const name = row.name.trim();
    return name && name !== "(not set)" && name !== "not set";
  })
  .slice(0, 3);

fs.writeFileSync("top3.json", JSON.stringify(top3, null, 2) + "\n", "utf8");

console.log("Generated top3.json");
console.log(top3);
