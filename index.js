const { DiscussServiceClient } = require('@google-ai/generativelanguage');
const { GoogleAuth } = require('google-auth-library');
const TelegramBot = require('node-telegram-bot-api');
const token = '6331919192:AAGoTSQdlz_89MEyRakrhGzQhgEGcGLRZWc';
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const bot = new TelegramBot(token, { polling: true });

const MODEL_NAME = 'models/chat-bison-001';
const API_KEY = 'AIzaSyCGNHIx6AF919A0DOA52LhAW4uS5MTIoDU';

const MAX_HISTORY_MESSAGES = 5;  // maximum number of previous messages to keep

const client = new DiscussServiceClient({
    authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

async function generateResponse(messages) {
    const result = await client.generateMessage({
        model: MODEL_NAME,
        prompt: { messages },
    });

    return result[0].candidates[0].content;
}

const chatHistory = {};  // keep track of chat history for each chat
const errorMessages = [
    "I'm sorry, something went wrong.",
    "Oops! There was an error.",
    "My circuits are a little frazzled. Try again later.",
    "An error occurred. Please try again.",
];
bot.on('message', async function (msg) {
    let waitMessageIds = [];
    try {
        if (msg.text === '/start') {
            bot.sendMessage(msg.chat.id, 'Hello! Welcome to Aeva ChatBot. How can I assist you today?');
            return;
        }
        if (msg.text.toLowerCase().replace(/[^\w\s]/g, '') === "what is your name" ||
            msg.text.toLowerCase().replace(/[^\w\s]/g, '') === "whats your name") {
            bot.sendMessage(msg.chat.id, 'My name is Aeva.');
            return;
        }
        if (msg.text.toLowerCase().replace(/[^\w\s]/g, '') === "who create you" ||
            msg.text.toLowerCase().replace(/[^\w\s]/g, '') === "who created you") {
            bot.sendMessage(msg.chat.id, 'I am Created by Mohammed Othman, for more Information visit [this link](https://mohammed-info.netlify.app/)', { parse_mode: 'Markdown' });
            return;
        }
        const userMessage = msg.text.toLowerCase();
        const messages = chatHistory[msg.chat.id] || [];
        messages.push({ content: userMessage });

        // Remove older messages to keep only the last few messages
        while (messages.length > MAX_HISTORY_MESSAGES) {
            messages.shift();
        }

        chatHistory[msg.chat.id] = messages;  // update chat history



        // Send "wait" message and store its message ID
        const waitMessage = await bot.sendMessage(msg.chat.id, '🤔');
        const waitMessage2 = await bot.sendMessage(msg.chat.id, 'Still working on it...');
        waitMessageIds.push(waitMessage2.message_id);

        waitMessageIds.push(waitMessage.message_id);
        bot.sendChatAction(msg.chat.id, 'typing');
        const response = await generateResponse(messages);

        bot.sendMessage(msg.chat.id, response);

    } catch (error) {
        // Choose a random error message
        const randomIndex = Math.floor(Math.random() * errorMessages.length);
        const randomErrorMessage = errorMessages[randomIndex];
        bot.sendMessage(msg.chat.id, randomErrorMessage);
    } finally {
        // Delete all "wait" messages if they were sent
        for (const messageId of waitMessageIds) {
            bot.deleteMessage(msg.chat.id, messageId);
        }
    }
});
