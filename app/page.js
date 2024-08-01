'use client';

import React, { useState } from 'react';

const fetchAIResponse = async (message, onChunkReceived) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let incompleteChunk = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    let chunk = decoder.decode(value, { stream: true });

    // Concatenate with the previous incomplete chunk
    chunk = incompleteChunk + chunk;

    // Find the last space to ensure we're not cutting off in the middle of a word
    const lastSpaceIndex = chunk.lastIndexOf(' ');

    if (lastSpaceIndex === -1) {
      // If no space is found, the entire chunk is incomplete
      incompleteChunk = chunk;
    } else {
      // Process the complete part of the chunk
      const completeChunk = chunk.slice(0, lastSpaceIndex + 1);
      incompleteChunk = chunk.slice(lastSpaceIndex + 1);
      onChunkReceived(completeChunk);
    }
  }

  // Handle any remaining incomplete chunk
  if (incompleteChunk) {
    onChunkReceived(incompleteChunk);
  }
};

export default function Page() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = input;
    setInput('');

    // Add user message to the chat
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', name: 'User', text: message }]);

    await fetchAIResponse(message, (chunk) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.sender === 'ai') {
          // If the last message is from AI, append the chunk to the last AI message
          return [...prevMessages.slice(0, -1), { ...lastMessage, text: lastMessage.text + chunk }];
        } else {
          // Otherwise, add a new AI message
          return [...prevMessages, { sender: 'ai', name: 'Fire Sensei', text: chunk }];
        }
      });
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chat-message ${message.sender}`}>
            <strong>{message.name}:</strong> {message.text}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
          className="chat-input"
        />
        <button type="submit" className="chat-button">Send</button>
      </form>
    </div>
  );
}
