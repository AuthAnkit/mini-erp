import { useState, useEffect, useRef } from 'react';
import api from '../../api';

const renderMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-[#0f1117] text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
};

const SUGGESTIONS = [
  { icon: '📦', text: 'How many products do we have?' },
  { icon: '💰', text: 'What is the total revenue?' },
  { icon: '👥', text: 'Who is our top customer?' },
  { icon: '⚠️', text: 'Which products are critically low on stock?' },
  { icon: '🏭', text: 'How many pending manufacturing orders?' },
  { icon: '📈', text: 'What is the business health score?' },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/analytics/chat/history')
      .then(res => {
        const history = res.data
          .slice()
          .reverse()
          .flatMap(m => [
            { role: 'user', text: m.question },
            { role: 'ai', text: m.answer },
          ]);
        setMessages(history);
      })
      .finally(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    api.post('/analytics/chat', { question: q })
      .then(res => {
        setMessages(prev => [...prev, { role: 'ai', text: res.data.answer, queryType: res.data.queryType }]);
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'ai', text: '❌ Error connecting to AI engine. Please check the backend is running.', isError: true }]);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send();
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#141720] border border-[#1e2132] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1d27] border-b border-[#1e2132] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-200">ErpMini AI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-xs text-emerald-400 font-medium">Online · Natural Language ERP</p>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-lg border border-[#2a2d3e] hover:border-[#3a3d5e] transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center text-4xl mb-5">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-200 mb-2">What do you want to know?</h3>
            <p className="text-gray-500 mb-8 max-w-sm text-sm leading-relaxed">
              Ask anything about your inventory, sales, customers, or manufacturing — in plain English.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-xl w-full">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="flex items-center gap-2 text-left bg-[#1a1d27] hover:bg-[#2a2d3e] border border-[#2a2d3e] hover:border-indigo-500/40 text-sm text-gray-400 hover:text-gray-200 px-4 py-3 rounded-xl transition-all"
                >
                  <span className="text-base flex-shrink-0">{s.icon}</span>
                  <span className="text-xs leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {m.role === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0 mb-0.5">
                🤖
              </div>
            )}
            <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : m.isError
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 rounded-bl-sm'
                  : 'bg-[#1a1d27] border border-[#2a2d3e] text-gray-300 rounded-bl-sm'
            }`}>
              {m.role === 'user' ? (
                <p>{m.text}</p>
              ) : (
                <div
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                />
              )}
              {m.queryType && m.role === 'ai' && (
                <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-wider">{m.queryType}</p>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mb-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0">
              🤖
            </div>
            <div className="bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl rounded-bl-sm px-5 py-3.5 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#1a1d27] border-t border-[#1e2132]">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button
                key={s.text}
                onClick={() => send(s.text)}
                className="flex-shrink-0 flex items-center gap-1.5 bg-[#0f1117] border border-[#2a2d3e] hover:border-indigo-500/40 text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
              >
                <span>{s.icon}</span> {s.text}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your business..."
            className="w-full bg-[#0f1117] border border-[#2a2d3e] focus:border-indigo-500 rounded-xl pl-5 pr-14 py-4 text-gray-200 placeholder-gray-600 focus:outline-none transition-colors text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 rounded-lg flex items-center justify-center transition-colors text-lg"
          >
            ↑
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-700 mt-2">
          AI responses are based on your live ERP data.
        </p>
      </div>
    </div>
  );
}
