// Yeh Vercel ka serverless function hai
export default async function handler(request, response) {
  // User se sheet ka naam lenge (jaise 'Movies', 'Series')
  const sheetName = request.query.sheet;

  if (!sheetName) {
    return response.status(400).json({ error: 'Sheet name is required' });
  }
  // Apni secret keys server se lenge
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;

  try {
    // Google ko request bhejenge
    const fetchResponse = await fetch(url);
    if (!fetchResponse.ok) {
      throw new Error(`Google Sheets API error! status: ${fetchResponse.status}`);
    }
    const data = await fetchResponse.json();
// Vercel ko batayenge ki is response ko cache na kare
response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    // Data user ko wapas bhej denge
    response.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from Google Sheet:', error);
    response.status(500).json({ error: 'Failed to fetch data' });
  }
}
