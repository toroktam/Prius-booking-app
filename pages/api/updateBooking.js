// pages/api/updateBooking.js
import { GoogleSpreadsheet } from 'google-spreadsheet';

async function getSheet() {
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY));
  await doc.loadInfo();
  return doc.sheetsByIndex[0];
}

export default async function handler(req, res) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();

  if (req.method === 'POST') {
    const { date, slot, user } = req.body;
    if (!date || !slot || !user) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const exists = rows.find(r => r.Nap === date && r.Idosav === slot);
    if (exists) {
      return res.status(409).json({ error: 'Slot already taken' });
    }

    await sheet.addRow({
      Nap: date,
      Idosav: slot,
      Foglalo: user,
      Idobelyeg: new Date().toISOString()
    });
    return res.status(200).json({ message: 'Booking successful' });
  }

  if (req.method === 'DELETE') {
    const { date, slot, user } = req.body;
    if (!date || !slot || !user) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const rowToDelete = rows.find(r => r.Nap === date && r.Idosav === slot && r.Foglalo === user);
    if (!rowToDelete) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await rowToDelete.delete();
    return res.status(200).json({ message: 'Booking deleted' });
  }

  return res.status(405).end();
}
