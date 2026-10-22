import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Info,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function AICopilotPage({ onNavigate, currentUser }) {
  const isEmployee = currentUser?.role_id === 'EMPLOYEE';

  const employeeQuestions = [
    'What are my assigned projects and deliverables?',
    'Which projects have overdue milestones?',
    'What are the top three organisational risks?',
    'What actions should I prioritize this week?',
    'Can I view corporate financial budgets and payroll?',
    "Summarise the organisation's current operational health."
  ];

  const adminQuestions = [
    'Which projects have overdue milestones?',
    'Which departments are below their quarterly targets?',
    'What are the top three organisational risks?',
    'Which projects have unresolved dependencies?',
    'Which KPIs are showing unusual changes?',
    'What actions should management prioritise this week?',
    "Summarise the organisation's current operational health."
  ];

  const suggestedQuestions = isEmployee ? employeeQuestions : adminQuestions;

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'copilot',
      text: isEmployee
        ? "Hello **Alex Chen**! I am **Korvix Copilot**, operating under your **Employee Technical Clearance** in **Engineering & Architecture**.\n\nI can analyze your assigned deliverables (`PRJ-101: Cloud Native Migration`, `PRJ-105: Zero Trust Architecture`), upcoming technical milestones, dependencies, and active engineering risks grounded in the live digital twin.\n\n*Note: Corporate financial budgets and executive audit logs are restricted by RBAC policy.*"
        : "Hello! I am **Korvix Copilot**, your enterprise digital twin intelligence assistant. I analyze real-time project schedules, departmental KPIs, dependency chains, and operational risks grounded directly in the live system database.\n\nSelect any of the suggested prompts below or type your organizational question to inspect live metrics.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: isEmployee ? 'Deterministic Demo AI Mode (Employee Scope)' : 'Deterministic Demo AI Mode',
      source_records: null
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleCitation = (msgId) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await api.copilotChat(query);
      const botMsgId = `copilot-${Date.now()}`;
      const botMessage = {
        id: botMsgId,
        sender: 'copilot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: response.mode || 'Deterministic Demo AI Engine',
        source_records: response.source_records || [],
        disclaimer: response.disclaimer,
        intent: response.intent
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'copilot',
          text: `I encountered an error querying the digital twin database: ${err.message}. Please verify the backend connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-1',
        sender: 'copilot',
        text: "Conversation cleared. How can I assist you with your organizational intelligence analysis?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'Deterministic Demo AI Mode',
        source_records: null
      }
    ]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden p-6">
      {/* Top Engine Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Korvix Conversational Copilot</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live SQLite Grounding
              </span>
              {isEmployee && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                  Employee Scope: Alex Chen
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Deterministic intent classification with exact mathematical aggregation and source record attribution
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const hasRecords = msg.source_records && msg.source_records.length > 0;
            const isExpanded = expandedCitations[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white'
                    : 'bg-slate-900 text-white shadow-xs'
                }`}>
                  {isUser ? (currentUser?.name?.slice(0, 2).toUpperCase() || 'ME') : <Bot className="w-4 h-4 text-teal-400" />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl`}>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                  }`}>
                    {/* Render message with linebreaks */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Ground-Truth Source Attribution Drawer */}
                    {!isUser && hasRecords && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => toggleCitation(msg.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Database className="w-3.5 h-3.5" />
                          <span>Grounded Source Records ({msg.source_records.length})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[10px] space-y-1.5 overflow-x-auto text-slate-700">
                            {msg.source_records.map((rec, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-50 border border-slate-100 flex flex-wrap gap-2">
                                {Object.entries(rec).map(([k, v]) => (
                                  <span key={k} className="inline-block">
                                    <strong className="text-slate-500">{k}:</strong> {String(v)}
                                  </span>
                                ))}
                              </div>
                            ))}
                            {msg.disclaimer && (
                              <p className="text-[10px] text-slate-400 font-sans italic pt-1">{msg.disclaimer}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp} {msg.mode && `• ${msg.mode}`}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-xl mr-auto items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 text-teal-400" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Scanning digital twin graph & calculating deterministic metrics...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Question Chips */}
        <div className="px-6 py-2.5 border-t border-slate-100 bg-slate-50/60 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Prompts:</span>
            <div className="flex gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium whitespace-nowrap shadow-xs transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              disabled={loading}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Korvix about overdue milestones, KPI deficits, risks, or priorities..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
