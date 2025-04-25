import React, { useState, useEffect, useRef } from 'react';

type Message = {
  role: string;
  content: string;
};

const Chat = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    setInput('');

    try {
      const res = await fetch('http://localhost:5001/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let currentAIMessage = '';
      setMessages((msgs) => [...msgs, { role: 'assistant', content: '' }]);

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          currentAIMessage += chunk;

          // Optional: Format on the fly (basic)
          const formatted = currentAIMessage
            .replace(/###\s?(.*?)(?=\n|$)/g, '<br/><h3>$1</h3><br/>')
            .replace(/##\s?(.*?)(?=\n|$)/g, '<br/><h2>$1</h2><br/>')
            .replace(/#\s?(.*?)(?=\n|$)/g, '<br/><h1>$1</h1><br/>')
            .replace(/^- (.*?)(?=<br\/>|$)/gm, '<ul><li>$1</li></ul>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br/>')
            .replace(/\\u([\dA-F]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));

          setMessages((msgs) => {
            const updated = [...msgs];
            updated[updated.length - 1] = { role: 'assistant', content: formatted };
            return updated;
          });

          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

          if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            (window as any).MathJax.typesetPromise().then(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
          }
        }
      }
    } catch (error) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Error reaching server.' }]);
    }
  };

  useEffect(() => {
    if ((window as any).MathJax) {
      (window as any).MathJax.typesetPromise().then(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]);

  return (
    <div>
      <div style={{ border: '1px solid #ccc', padding: '1rem', height: '300px', overflowY: 'scroll' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '0.5rem 0' }}>
            <span>{msg.role === 'user' ? 'You' : 'MathCom AI'}: </span>
            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your question..."
        style={{ width: '80%', padding: '0.5rem', marginTop: '1rem' }}
      />
      <button onClick={sendMessage} style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}>
        Send
      </button>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js" async></script>
    </div>
  );
};

export default Chat;
