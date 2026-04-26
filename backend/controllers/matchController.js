const pool = require('../config/db');

exports.matchCandidate = async (req, res) => {
  try {
    const candidate = req.body;

    const result = await pool.query("SELECT * FROM offers WHERE status = 'active'");
    const jobs = result.rows.map(j => ({
      id: j.id,
      company: j.company_name,
      title: j.job_title,
      location: j.location,
      englishLevel: j.english_level,
      experience: j.experience_required,
      nationality: j.nationality,
      gender: j.gender,
      graduation: j.graduation_status,
      maxAge: j.max_age,
    }));

    const systemPrompt = 'You are a recruitment AI. You ONLY output raw JSON arrays. No markdown. No explanation. No code fences. Just the JSON array.';
    const userPrompt = `Match this candidate to the best 2-4 jobs from the list below.
Candidate:
${JSON.stringify(candidate, null, 2)}
Jobs:
${JSON.stringify(jobs, null, 2)}
Rules:
- Respect nationality, gender, age, experience, graduation constraints strictly.
- Return ONLY a JSON array, nothing else.
- Each item must have: "jobId" (number) and "matchReason" (1-2 sentences).
Example output:
[{"jobId":1,"matchReason":"Great fit because..."},{"jobId":3,"matchReason":"Suitable because..."}]`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Vertex Recruitment Agency',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errData));
    }

    const result2 = await response.json();
    let text = (result2.choices?.[0]?.message?.content || '').trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    const matches = JSON.parse(text);
    res.json(matches);

  } catch (err) {
    console.error('Match API Error:', err);
    res.status(500).json({ error: err.message || 'AI matching failed' });
  }
};
