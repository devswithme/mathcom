import { google } from "googleapis";
import { z } from "zod";
import { formSchema } from "./form";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const sheets = google.sheets({
  auth,
  version: "v4",
});

export const add = async (data: z.infer<typeof formSchema>) => {
  const { email } = data;
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "A2:E2",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[email]],
    },
  });
};
