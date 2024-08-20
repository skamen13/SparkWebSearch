const axios = require('axios');
const cheerio = require('cheerio');
const { search, ResultTypes } = require('google-sr');
const levenshtein = require('fast-levenshtein');
const https = require('https');
const wiki = require('wikipedia');
const Together = require('together-ai');
const PptxGenJS = require("pptxgenjs");
const gis = require('async-g-i-s');

const agent = new https.Agent({ rejectUnauthorized: false });

const url = 'https://databorg.ai/api/webqa';
const apiKey = '06bd668a-1766-4436-955f-0d70dbba4417';
const urls = ['https://en.wikipedia.org'];

const together = new Together({ apiKey: "b1d33813a782e133a59ba32e103e75419915b499007c8b6ee1f34c5152dab438" });

async function Search(query = "", numSentences = 3) {
    const searchResults = await search({
        query: query,
        safeMode: false,
        filterResults: [ResultTypes.SearchResult]
    });



    if (searchResults.length === 0) {
        console.log('No results found.');
        return;
    }

    const url = searchResults[0].link;
    const description = searchResults[0].description;

    try {
        const response = await axios.get(url, { httpsAgent: agent });
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract visible text from the page
        const visibleText = $('body').text();

        // Find the closest match to the description
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
            console.log('No similar text found.');
            return;
        }

        // Find start position of the closest sentence
        const startIdx = visibleText.indexOf(closestSentence);
        if (startIdx === -1) {
            console.log('Closest sentence not found in the text.');
            return;
        }

        // Get the portion of the text starting from the closest sentence
        const textFromStart = visibleText.slice(startIdx);

        // Limit to the number of sentences specified
        const excerpt = textFromStart.match(/[^.!?]+[.!?]+/g)?.slice(0, numSentences).join(' ').trim() || '';

        console.log('Excerpt:', excerpt);

    } catch (error) {
        console.error('Error fetching the page:', error);
    }
}

async function searchWiki(query = 'AI'){
    await wiki.setLang('ru');

    const searchResults = await wiki.search(query);
    const title = searchResults.results[0].title;
    const page = await wiki.page(title);
    console.log(page);

}

const extractStrings = (inputString, delimiter) => {
    const regex = new RegExp(`${delimiter}(.*?)${delimiter}`, 'g');
    const matches = [];
    let match;

    while ((match = regex.exec(inputString)) !== null) {
        matches.push(match[1]);  // match[1] содержит текст между разделителями
    }

    return matches;
};

function parseSlideData(inputString) {
    const slides = [];
    const slideData = inputString.split("&");


    // Обработка остальных слайдов
    for (let i = 0; i < slideData.length; i++) {
        const matches = slideData[i].trim().match(/'([^']+)'|"([^"]+)"/g);
        if (!matches || matches.length < 2) continue; // Пропускаем некорректные слайды

        const topic = matches[0].replace(/'/g, "").trim();
        const texts = matches.slice(1).map(text => text.replace(/"/g, "").trim());
        const combinedText = texts.join("\n\n"); // Объединяем тексты с разделением

        slides.push({ type: getRandomInt(1, 3), topic: topic, question: "", text: combinedText });
    }

    return slides;
}

function getRandomInt(min, max) {
    // Убедимся, что min и max являются целыми числами
    min = Math.ceil(min);
    max = Math.floor(max);

    // Генерация случайного числа в заданном диапазоне [min, max]
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function invertHexColor(hex) {
    // Удаляем знак #
    hex = hex.replace(/^#/, '');

    // Если цвет в короткой форме, преобразуем его в длинную
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Инвертируем цвет
    const invertedHex = (parseInt(hex, 16) ^ 0xFFFFFF).toString(16).padStart(6, '0');

    // Возвращаем с добавленным знаком #
    return `#${invertedHex}`;
}

async function createPresentation(slides, color = "000000", mainTopic = "") {
    // Создаем новый объект презентации
    let pptx = new PptxGenJS();

    let imagesUrl = [""]

    for await (const slide of slides) {
        const results = await gis(mainTopic);

        // Фильтруем результаты, оставляя только те, которые используют протокол https
        const httpsResults = results.filter(result => result.url.startsWith("https:"));

        // Проверяем, есть ли результаты после фильтрации, и присваиваем первый из них
        if (httpsResults.length > 0) {
            imagesUrl[slides.indexOf(slide)] = httpsResults[0].url;
        } else {
            imagesUrl[slides.indexOf(slide)] = null; // Или другое значение по умолчанию, если нет https URL
        }
    }

    // Проходим по массиву слайдов
    slides.forEach((slideInfo) => {
        let slide = pptx.addSlide();

        slide.background = {
            color: color, // Цвета градиента
        };

        if (slideInfo.type === 0) {
            // Титульный слайд (type: 0)

            slide.addImage({
                path: imagesUrl[slides.indexOf(slideInfo)],
                x: 0,
                y: -1.8,
                h: 9.22,
                w: 10,
                transparency: 85
            })

            slide.addText(slideInfo.topic, {
                x: 1.63,
                y: 0.6,
                w: 5.95,
                h: 3.78,
                fontSize: 64,
                color: invertHexColor(color),
                align: "center",
                fontFace: { fontFace:'Bahnschrift SemiBold'},
                bold: true,
            });
        } else if (slideInfo.type === 1) {
            // Слайд с текстом (type: 1)
            slide.addText(slideInfo.topic, {
                x: 0.34,
                y: 0,
                w: 4.38,
                h: 1.62,
                fontSize: 24,
                color: invertHexColor(color),
                bold: true,
                fontFace: { fontFace:'Bahnschrift SemiBold'}
            });

            slide.addText(slideInfo.text, {
                x: 0.34,
                y: 1.62,
                w: 4.66,
                h: 2.46,
                fontSize: 12,
                color: invertHexColor(color),
                align: "left",
                valign: "top",
                lineSpacingMultiple: 0.9,
                fontFace: { fontFace:'Bahnschrift'},
                autoFit: true
            });

            slide.addImage({
                path: imagesUrl[slides.indexOf(slideInfo)],
                x: 5.11,
                y: 0,
                h: 5.64,
                w: 7.38,
            })

            slide.addImage({
                path: "./image-1.png",
                x: 1.49,
                y: -0.08,
                h: 5.74,
                w: 5.45,
                rotate: 3
            })
        } else if (slideInfo.type === 2) {
            // Слайд с текстом (type: 1)
            slide.addText(slideInfo.topic, {
                x: 5.34,
                y: 0,
                w: 4.38,
                h: 1.62,
                fontSize: 24,
                color: invertHexColor(color),
                bold: true,
                align: "right",
                fontFace: { fontFace:'Bahnschrift SemiBold'}
            });

            slide.addText(slideInfo.text, {
                x: 5.2,
                y: 1.55,
                w: 4.66,
                h: 2.46,
                fontSize: 12,
                color: invertHexColor(color),
                align: "right",
                valign: "top",
                lineSpacingMultiple: 0.9,
                fontFace: { fontFace:'Bahnschrift'},
                autoFit: true
            });

            slide.addImage({
                path: "./image-2.png",
                x: -0.4,
                y: 0.49,
                h: 4.27,
                w: 5.45,
            })

            slide.addImage({
                path: imagesUrl[slides.indexOf(slideInfo)],
                x: 0.96,
                y: 1.23,
                h: 2.79,
                w: 3.65,
            })
        } else if (slideInfo.type === 3) {
            // Слайд с текстом (type: 1)
            slide.addText(slideInfo.topic, {
                x: 0.34,
                y: 0,
                w: 4.38,
                h: 1.62,
                fontSize: 24,
                color: invertHexColor(color),
                bold: true,
                fontFace: { fontFace:'Bahnschrift SemiBold'}
            });

            slide.addText(slideInfo.text, {
                x: 0.34,
                y: 1.62,
                w: 4.66,
                h: 2.46,
                fontSize: 12,
                color: invertHexColor(color),
                align: "left",
                valign: "top",
                lineSpacingMultiple: 0.9,
                fontFace: { fontFace:'Bahnschrift'},
                autoFit: true
            });

            slide.addImage({
                path: imagesUrl[slides.indexOf(slideInfo)],
                x: 5.71,
                y: 1.57,
                h: 2.48,
                w: 3.25,
            })

            slide.addImage({
                path: "./image-3.png",
                x: 3.45,
                y: 0.41,
                h: 4.89,
                w: 6.21,
            })
        }
    });

    // Сохраняем презентацию
    pptx.writeFile({ fileName: "Presentation.pptx" });
}

async function CreatePresentation(topic = "Что такое ИИ?", slidesCount = 3, color = "000000"){
    let chat = [{
        "role": "user",
        "content": "Вам нужно создать презентацию powerpoint на тему: \"" + topic + "\" напишите список из " + slidesCount + " слайдов, заголовок каждого слайда на русском, окружите с двух сторон знаками # и вопрос на который будет отвечать этот слайд на английском языке (ОЧЕНЬ ПРОСТОЙ по своему грамматическому устройству вопрос, ОТВЕТ НА КОТОРЫЙ МОЖНО НАЙТИ В Wilipedia. ВМЕСТО ТОГО чтобы задавать вопросы по конкретным тема задавайте ОБЩИЕ ВОПРОСЫ например What is AI?  или вместо \"What was the main economics activity in 'City' during the 19th Dentury?\" задавать просто \"'City' history\" окружите с двух сторон знаками %"
    },]

    const stream1 = await together.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: chat,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>","<|eom_id|>"],
        stream: true,
    });

    let llmResult = "";

    for await (const chunk of stream1) {
        llmResult += chunk.choices[0]?.delta?.content;
        // use process.stdout.write instead of console.log to avoid newlines
        process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }

    chat.push({
        "role": "assistant",
        "content": llmResult
    });
    const topics = extractStrings(llmResult, '#')
    const questions = extractStrings(llmResult, '%')
    console.log("\n\n");

    let llm2Prompt = "Используя информацию, полученную по вопросам, и СВОИ СОБСТВЕННЫЕ ЗНАНИЯ, составьте полноценные ТЕКСТЫ (по 2 абзаца на слайд) НА РУССКОМ, которые будут на слайдах и поместите названия каждого слайда в одинарные кавычки - ' на тексты каждого слайда в двойные кавычки - \". Слайды разделяйте знаком &. Вот информация по слайдам:\n"

    for await (const currentTopic of topics){
        const i = topics.indexOf(currentTopic);
        console.log(`Слайд ${i + 1} - "${topics[i]}" - Вопрос: ${questions[i]}`);
        const question = questions[i];
        const result = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({question, urls}),
        }).then((r) => r.json());
        console.log(result.result);

        if (result.result === "I am sorry, I was not able to find answer to this question.")
        {
            llm2Prompt += `\n${i + 1}. - ${topics} - На этот слайд информации не нашлось. Вы можете в этом слайде написать с помощью собственных знаний, но если вы неуверены в правильности своего ответа - пропустите этот слайд`
        }
        else {
            llm2Prompt += `\n${i + 1}. - ${topics} - ${result.result}`
        }
    }

    console.log(llm2Prompt)

    chat.push({
        "role": "user",
        "content": llm2Prompt
    });

    const stream2 = await together.chat.completions.create({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: chat,
        max_tokens: 3024,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stop: ["<|eot_id|>","<|eom_id|>"],
        stream: true,
    });

    llmResult = "";

    for await (const chunk of stream2) {
        llmResult += chunk.choices[0]?.delta?.content;
        // use process.stdout.write instead of console.log to avoid newlines
        process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }

    let slides = [
        { type: 0, topic: topic, question: "", text: "" },
    ];

    slides.push(...parseSlideData(llmResult));

    await createPresentation(slides, color, topic);
}

// Example usage
CreatePresentation("Куликовская битва", 3);
