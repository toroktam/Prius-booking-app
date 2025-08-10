// pages/api/getBookings.js
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = process.env.SHEET_ID; // set in Vercel
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT; // teljes JSON string

async function getSheet() {
  if (!GOOGLE_SERVICE_ACCOUNT || !SHEET_ID) {
    throw new Error('Missing env vars: GOOGLE_SERVICE_ACCOUNT or SHEET_ID');
  }
  const creds = JSON.parse(GOOGLE_SERVICE_ACCOUNT);
  const doc = new GoogleSpreadsheet(SHEET_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).end();

    const sheet = await getSheet();
    const rows = await sheet.getRows();
    const map = {};
    rows.forEach(r => {
      // Feltételezett oszlopnevek: Datum (yyyy-MM-dd), Idosav (pl. "08:00–09:40"), Foglalo
      const key = `${r.Datum}-${r.Idosav}`;
      map[key] = r.Foglalo;
    });
    return res.status(200).json(map);
  } catch (err) {
    console.error('getBookings error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
