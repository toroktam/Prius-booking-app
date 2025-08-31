// pages/api/updateBooking.js
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
    const sheet = await getSheet();

    if (req.method === 'POST') {
      const { date, slot, user } = req.body;
      if (!date || !slot || !user) return res.status(400).json({ error: 'Missing fields' });

      const rows = await sheet.getRows();
      const exists = rows.find(r => r.Datum === date && r.Idosav === slot);
      if (exists) return res.status(409).json({ error: 'Already booked' });

      await sheet.addRow({ Datum: date, Idosav: slot, Foglalo: user, Idobelyeg: new Date().toISOString() });
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const { date, slot, user } = req.body;
      if (!date || !slot || !user) return res.status(400).json({ error: 'Missing fields' });

      const rows = await sheet.getRows();
      const found = rows.find(r => r.Datum === date && r.Idosav === slot && r.Foglalo === user);
      if (!found) return res.status(404).json({ error: 'Not found' });

      await found.delete();
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'POST, DELETE, GET');
    return res.status(405).end();
  } catch (err) {
    console.error('updateBooking error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
