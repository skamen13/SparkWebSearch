const PptxGenJS = require("pptxgenjs");
const gis = require('async-g-i-s');

// Массив с информацией о слайдах


function parseSlideData(inputString) {
    const slides = [];
    const slideData = inputString.split("&");

    // Обработка остальных слайдов
    for (let i = 0; i < slideData.length; i++) {
        const [topicMatch, textMatch] = slideData[i].trim().match(/'([^']+)'|"([^"]+)"/g);
        const topic = topicMatch.replace(/'/g, "").trim();
        const text = textMatch.replace(/"/g, "").trim();
        slides.push({ type: getRandomInt(1, 3), topic: topic, question: "", text: text });
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

async function createPresentation(slides, color = "000000") {
    // Создаем новый объект презентации
    let pptx = new PptxGenJS();

    let imagesUrl = [""]

    for await (const slide of slides) {
        const results = await gis(slide.topic);
        imagesUrl[slides.indexOf(slide)] = results[0].url;
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
                fontSize: 36,
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
                fontSize: 36,
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
                fontSize: 36,
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

const stringData = "'Искусственный Интеллект'\n" +
    "\"Искусственный интеллект (ИИ) - это область компьютерных наук, которая занимается разработкой систем, способных выполнять задачи, требующие человеческого интеллекта, такие как обучение, решение проблем и принятие решений. Это означает, что ИИ может имитировать человеческое мышление и поведение, но не обязательно понимать смысл своих действий.\n" +
    "\n" +
    "ИИ уже широко используется в различных областях, таких как робототехника, компьютерное зрение и обработка естественного языка. Однако ИИ все еще находится в стадии развития, и его возможности и ограничения продолжают исследоваться и обсуждаться экспертами в этой области.\"\n" +
    "\n" +
    "&\n" +
    "\n" +
    "'История Разработки ИИ'\n" +
    "\"История искусственного интеллекта начинается в 1940-х годах, когда Алан Тьюринг начал размышлять о машине, которая могла бы мыслить. С тех пор в этой области произошли значительные достижения, включая разработку больших языковых моделей, таких как GPT-4, созданных Microsoft Research в 2023 году.\n" +
    "\n" +
    "За всю историю ИИ было много важных событий и открытий, которые привели к тому, что мы имеем сегодня. Для более подробного понимания истории ИИ можно обратиться к хронологии ИИ на сайте AI Topics.\"\n" +
    "\n" +
    "&\n" +
    "\n" +
    "'Применение ИИ в Реальной Жизни'\n" +
    "\"Агенты ИИ работают в рамках своих программных ограничений, доступных вычислительных ресурсов и ограничений оборудования. Они выполняют задачи в пределах своего определенного объема и имеют ограниченную память и вычислительные возможности. Однако ИИ может адаптироваться к новым情况ам и оптимизировать свое поведение с помощью машинного обучения.\n" +
    "\n" +
    "ИИ уже успешно применяется в различных отраслях и учреждениях, включая энергетическое хранение, медицинскую диагностику, военную логистику, прогнозирование судебных решений, внешнюю политику, управлен\n" +
    "ие цепочками поставок, эвакуацию и управление стихийными бедствиями. Использование ИИ влияет на социальный и экономический сдвиг в сторону increased автоматизации и принятия решений на основе данных, что влияет на рынки труда, здравоохранение, государство, промышленность, образование и многое другое.\""

let slides = [
    { type: 0, topic: "Что такое ИИ?", question: "", text: "" },
];
slides.push(...parseSlideData(stringData));

createPresentation(slides);
