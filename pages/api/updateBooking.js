// pages/api/updateBooking.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await doc.useServiceAccountAuth(serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    if (req.method === 'POST') {
      const { date, slot, user } = req.body;
      await sheet.addRow({
        Datum: date,
        Idosav: slot,
        Foglalo: user,
        Idobelyeg: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { date, slot, user } = req.body;
      const rows = await sheet.getRows();
      const match = rows.find(r => r.Datum === date && r.Idosav === slot && r.Foglalo === user);
      if (match) {
        await match.delete();
        return res.status(200).json({ success: true });
      }
      return res.status(404).json({ error: 'Foglalás nem található' });
    }

    res.status(405).json({ error: 'Nem támogatott metódus' });
  } catch (error) {
    console.error('updateBooking error:', error);
    res.status(500).json({ error: 'Hiba történt a foglalás módosításakor' });
  }
}
