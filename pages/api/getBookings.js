// pages/api/getBookings.js
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
    const rows = await sheet.getRows();

    const bookings = {};
    rows.forEach(row => {
      const key = `${row.Datum}-${row.Idosav}`;
      bookings[key] = row.Foglalo;
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('getBookings error:', error);
    res.status(500).json({ error: 'Hiba történt a foglalások lekérdezésekor' });
  }
}
