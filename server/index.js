import { configDotenv } from "dotenv";
import express from 'express';
import { WebSocketServer } from "ws";
import OpenAi from "openai";
import cors from 'cors';

import content from "./content.js";

const app = express();
const Port = process.env.PORT || 8000;
const wss = new WebSocketServer({ noServer: true });

configDotenv({
  path: "./.env"
});


const openai = new OpenAi({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static("public"));
app.use(cors());

const generateResponse = async (message) => {
  try {
    const aiResponse = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: content },
        { role: 'user', content: message }
      ],
      model: 'gpt-4',
    });

    return aiResponse.choices[0].message.content;
  } catch (error) {
    console.error('Error:', error);
    return 'I encountered an error while processing your request. Please try again later.';
  }
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    console.log('Received audio data', message.toString());
    let audioMessage = message.toString();

    try {

      const reply = await generateResponse(audioMessage);
      console.log('AI Response:', reply);

      ws.send(reply);
    } catch (error) {
      console.error('Error:', error);
      ws.send('Error processing your request.');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const server = app.listen(Port, () => {
  console.log("Server listening on port: ", Port);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
