import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'published-schedule.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(dataFilePath)) {
        return res.status(200).json({ schedule: null });
      }

      const fileData = fs.readFileSync(dataFilePath, 'utf-8');
      const json = JSON.parse(fileData || '{}');

      return res.status(200).json(json);
    } catch (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: 'Failed to read published schedule' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      const dir = path.dirname(dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2));

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: 'Failed to save published schedule' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (fs.existsSync(dataFilePath)) {
        fs.writeFileSync(dataFilePath, JSON.stringify({ schedule: null }, null, 2));
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE error:', err);
      return res.status(500).json({ error: 'Failed to clear published schedule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}