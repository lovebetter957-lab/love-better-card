module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        ok: false,
        error: 'Method not allowed',
      });
    }

    const gasUrl = process.env.GAS_URL;

    if (!gasUrl) {
      return res.status(500).json({
        ok: false,
        error: '缺少 Vercel 環境變數 GAS_URL',
      });
    }

    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: 'Apps Script 回傳不是 JSON',
        raw: text,
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || String(error),
    });
  }
};
