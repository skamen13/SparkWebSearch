import * as fal from "@fal-ai/serverless-client";

fal.config({
    credentials: "808ffb6c-6b0f-4a67-a591-9f9c0977e6cf:2c7273d72832f7968a956a402ed3dea5"
});


const result = await fal.subscribe("fal-ai/idefics-2-8b", {
    input: {
        image_url: "https://llava-vl.github.io/static/images/monalisa.jpg",
        prompt: "Do you know who drew this painting?"
    },
    logs: true,
    onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
        }
    },
});
