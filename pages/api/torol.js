// pages/api/torol.js

import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nap, idosav, foglalo } = req.body;

  if (!nap || !idosav || !foglalo) {
    return res.status(400).json({ error: 'Hiányzó adat' });
  }

  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY));
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  const target = rows.find(row => row.Nap === nap && row.Idosav === idosav && row.Foglalo === foglalo);

  if (target) {
    await target.delete();
    return res.status(200).json({ message: 'Foglalás törölve' });
  } else {
    return res.status(404).json({ error: 'Foglalás nem található' });
  }
}
