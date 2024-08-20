const express = require("express");
const { search, ResultTypes } = require("google-sr");
const axios = require("axios");
const cheerio = require("cheerio");
const levenshtein = require("fast-levenshtein");
const https = require("https");
const Groq = require('groq-sdk');

const agent = new https.Agent({ rejectUnauthorized: false });

const groq = new Groq({
    apiKey: "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"
});

const app = express();
const port = process.env.PORT || 3000;

async function Search(query = "", numSentences = 60) {
    const searchResults = await search({
        query: query,
        safeMode: false,
        filterResults: [ResultTypes.SearchResult]
    });

    if (searchResults.length === 0) {
        return { error: 'No results found.' };
    }

    const url = searchResults[0].link;
    const description = searchResults[0].description;

    try {
        const response = await axios.get(url, { httpsAgent: agent });
        const html = response.data;
        const $ = cheerio.load(html);

        const visibleText = $('body').text();
        const sentences = visibleText.match(/[^.!?]+[.!?]+/g) || [];
        let closestSentence = '';
        let minDistance = Infinity;

        sentences.forEach(sentence => {
            const distance = levenshtein.get(description, sentence);
            if (distance < minDistance) {
                minDistance = distance;
                closestSentence = sentence;
            }
        });

        if (closestSentence === '') {
            return { error: 'No similar text found.' };
        }

        const startIdx = visibleText.indexOf(closestSentence);
        if (startIdx === -1) {
            return { error: 'Closest sentence not found in the text.' };
        }

        const textFromStart = visibleText.slice(startIdx);
        const excerpt = textFromStart.match(/[^.!?]+[.!?]+/g)?.slice(0, numSentences).join(' ').trim() || '';

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "system",
                    "content": "Вы доносите информацию для пользователей о любом их вопросе. Ваша информация и ответы должны быть НЕВЕРОЯТНО ТОЧНЫ и ПОНЯТНЫ любому. Если вы НЕ ЗАНЕТЕ ответа или информации о нём не предоставлено - ОТВЕЧАЙТЕ ИСПОЛЬЗУЯ ТО, ЧТО ЕСТЬ. Вы отвечаете БЕЗ ВАШИХ КОМЕНТАРИЕВ, ТОЛЬКО ФАКТЫ. Ваши ответы, как будто обрывки интересной статьи. вы говорите ТОЛЬКО НА РУССКОМ ЯЗЫКЕ"
                },
                {
                    "role": "user",
                    "content": "Развёрнуто ответьте на вопрос \"" + query + "\" используя информацию:\n" + excerpt
                },
            ],
            "model": "gemma2-9b-it",
            "temperature": 0.5,
            "max_tokens": 1024,
            "top_p": 1,
            "stream": false,
            "stop": null
        });

        return { answer: chatCompletion.choices[0].message.content };

    } catch (error) {
        return { error: 'Error fetching the page: ' + error.message };
    }
}

app.get("/search", async (req, res) => {
    const query = req.query.q;
    const numSentences = parseInt(req.query.numSentences) || 60;

    if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const result = await Search(query, numSentences);
    res.json(result);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
