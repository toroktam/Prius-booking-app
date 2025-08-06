// pages/api/lista.js

import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY));
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  const data = rows.map(row => ({
    nap: row.Nap,
    idosav: row.Idosav,
    foglalo: row.Foglalo
  }));

  res.status(200).json(data);
}
