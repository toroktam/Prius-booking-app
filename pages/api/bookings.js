// pages/api/bookings.js
import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY));
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const bookings = {};
    rows.forEach(row => {
      // Fontos, hogy a táblázatban lévő oszlopnevek (pl. Nap, Idosav) pontosan egyezzenek
      // a kódban használt kulcsokkal.
      if (row.Nap && row.Idosav && row.Foglalo) {
          bookings[`${row.Nap}-${row.Idosav}`] = row.Foglalo;
      }
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Hiba a foglalások lekérésekor:', error);
    res.status(500).json({ error: 'Hiba a foglalások lekérésekor' });
  }
}
