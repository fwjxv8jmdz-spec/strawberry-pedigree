import fs from "fs";
import { google } from "googleapis";

const propertyId = process.env.GA4_PROPERTY_ID;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

if (!propertyId) throw new Error("GA4_PROPERTY_ID is missing");
if (!clientId) throw new Error("GOOGLE_CLIENT_ID is missing");
if (!clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is missing");
if (!refreshToken) throw new Error("GOOGLE_REFRESH_TOKEN is missing");

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
oauth2Client.setCredentials({ refresh_token: refreshToken });

const { token } = await oauth2Client.getAccessToken();
if (!token) throw new Error("Failed to get access token");

const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

const body = {
  dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
  dimensions: [{ name: "customEvent:cultivar_name" }],
  metrics: [{ name: "eventCount" }],
  dimensionFilter: {
    andGroup: {
      expressions: [
        {
          filter: {
            fieldName: "eventName",
            stringFilter: {
              matchType: "EXACT",
              value: "select_cultivar"
            }
          }
        }
      ]
    }
  },
  orderBys: [
    {
      metric: { metricName: "eventCount" },
      desc: true
    }
  ],
  limit: 20
};

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

if (!res.ok) {
  const text = await res.text();
  throw new Error(`GA4 Data API error ${res.status}: ${text}`);
}

const response = await res.json();

const top3 = (response.rows ?? [])
  .map((row) => ({
    name: row.dimensionValues?.[0]?.value ?? "",
    count: Number(row.metricValues?.[0]?.value ?? 0)
  }))
  .filter((row) => {
    const name = row.name.trim();
    return name && name !== "(not set)" && name !== "not set";
  })
  .slice(0, 3);

fs.writeFileSync("top3.json", JSON.stringify(top3, null, 2) + "\n", "utf8");

console.log("Generated top3.json");
console.log(top3);
