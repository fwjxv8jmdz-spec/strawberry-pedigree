import readline from "readline";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is missing");
if (!CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET is missing");

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

const scopes = [
  "https://www.googleapis.com/auth/analytics.readonly"
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nPaste the authorization code here.\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Code: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log("\nRefresh token:\n");
    console.log(tokens.refresh_token);
    console.log("\nAccess token:\n");
    console.log(tokens.access_token);
  } catch (err) {
    console.error(err);
  } finally {
    rl.close();
  }
});
