// pages/api/foglal.js

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

  const foglalt = rows.some(row => row.Nap === nap && row.Idosav === idosav);
  if (foglalt) {
    return res.status(409).json({ error: 'Az időpont már foglalt' });
  }

  await sheet.addRow({
    Nap: nap,
    Idosav: idosav,
    Foglalo: foglalo,
    Idobelyeg: new Date().toISOString()
  });

  res.status(200).json({ message: 'Sikeres foglalás' });
}
