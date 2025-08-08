import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_ID = '14OnABoY-pzyAW-oXGHBxLxYsCu9Q3JtNDmNIqb530gI';
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

export default async function handler(req, res) {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);
    await doc.useServiceAccountAuth(CREDENTIALS);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    if (req.method === 'GET') {
      const rows = await sheet.getRows();
      const bookings = {};
      rows.forEach(row => {
        const key = `${row.Datum}-${row.Idosav}`;
        bookings[key] = row.Foglalo;
      });
      return res.status(200).json(bookings);
    }

    if (req.method === 'POST') {
      const { date, slot, user } = req.body;
      await sheet.addRow({
        Datum: date,
        Idosav: slot,
        Foglalo: user,
        Idobelyeg: new Date().toISOString()
      });
      return res.status(201).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { date, slot, user } = req.body;
      const rows = await sheet.getRows();
      const match = rows.find(r => r.Datum === date && r.Idosav === slot && r.Foglalo === user);
      if (match) {
        await match.delete();
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
