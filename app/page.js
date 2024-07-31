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
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onChunkReceived(chunk); // Pass only the current chunk to the callback
  }
};

export default function Page () {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setOutput(''); // Clear previous output
    const message = input;

    await fetchAIResponse(message, (chunk) => {
      setOutput((prevOutput) => prevOutput + chunk);
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message"
        />
        <button type="submit">Send</button>
      </form>
      <div>
        <h3>AI Response:</h3>
        <p>{output}</p>
      </div>
    </div>
  );
};

