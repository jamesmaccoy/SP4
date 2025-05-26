import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()
  const { text } = req.body

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts check-in and check-out dates from user input. Respond ONLY with a JSON object: { \"fromDate\": \"YYYY-MM-DD\", \"toDate\": \"YYYY-MM-DD\" } or { \"error\": \"Could not parse dates\" } if unclear."
        },
        {
          role: "user",
          content: text,
        }
      ],
      temperature: 0,
    }),
  })
  const json = await openaiRes.json()
  let dates = null
  try {
    const content = json.choices[0].message.content
    dates = JSON.parse(content)
  } catch (e) {
    dates = { error: "Could not parse dates" }
  }
  res.status(200).json({ dates })
}