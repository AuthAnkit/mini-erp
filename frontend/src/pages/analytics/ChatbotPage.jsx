import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get('/analytics/chat/history')
      .then(res => {
        const history = res.data.map(m => [
          { role: 'user', text: m.question },
          { role: 'ai', text: m.answer }
        ]).flat();
        setMessages(history.reverse());
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    api.post('/analytics/chat', { question: q })
      .then(res => {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'Error connecting to AI engine.' }]);
      })
      .finally(() => setLoading(false));
  };

  const suggestions = [
    "What products are critically low on stock?",
    "Who is my top customer?",
    "What is the total revenue?",
    "How many pending sales orders are there?"
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-[#141720] border border-[#1e2132] rounded-2xl overflow-hidden">
      <div className="bg-[#1a1d27] border-b border-[#1e2132] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
          🤖
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-200">ErpMini AI Assistant</h2>
          <p className="text-xs text-indigo-400">Natural Language ERP Querying</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-[#1a1d27] rounded-2xl flex items-center justify-center text-4xl mb-4 border border-[#2a2d3e]">💬</div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">How can I help you today?</h3>
            <p className="text-gray-500 mb-6 max-w-md">Ask me anything about your inventory, sales, manufacturing, or overall business performance.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); document.getElementById('chat-input').focus(); }} className="bg-[#1a1d27] hover:bg-[#2a2d3e] border border-[#2a2d3e] text-sm text-gray-300 px-4 py-2 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-2xl px-5 py-3 ${
              m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-[#1a1d27] border border-[#2a2d3e] text-gray-300 rounded-bl-none'
            }`}>
              <pre className="whitespace-pre-wrap font-sans font-medium text-[15px] leading-relaxed">
                {m.text}
              </pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl rounded-bl-none px-5 py-3 flex gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-[#1a1d27] border-t border-[#1e2132]">
        <form onSubmit={send} className="relative">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your business..."
            className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl pl-4 pr-12 py-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white w-10 rounded-lg flex items-center justify-center transition-colors">
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
