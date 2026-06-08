import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '@/lib/api';
import Sidebar from '@/components/sidebar';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your Fleet AI Assistant. Ask me anything about your fleet - maintenance, fuel, drivers, or vehicle utilization.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { question: input });
      const answer = response.data.answer;

      let content = '';
      switch (answer.type) {
        case 'maintenance':
          content = `I found ${answer.upcoming} upcoming maintenance tasks and ${answer.overdue} overdue items.\n\n` +
            answer.vehicles.map((v: any) =>
              `- ${v.vehicle} (${v.registration}): ${v.title} - ${v.priority} priority, scheduled ${new Date(v.scheduledAt).toLocaleDateString()}`
            ).join('\n');
          break;
        case 'fuel':
          content = `Fuel summary for last 30 days:\n- Total fuel used: ${answer.totalFuel30Days?.toFixed(1) || 0} L\n- Anomalies detected: ${answer.anomalies}\n\nTop vehicles by fuel consumption:\n` +
            answer.topVehicles.map((v: any) =>
              `- ${v.vehicle}: ${v.fuel.toFixed(1)} L ${v.isAnomaly ? '(⚠️ anomaly detected)' : ''}`
            ).join('\n');
          break;
        case 'driver':
          content = `Driver risk analysis:\n\n` +
            answer.drivers.map((d: any) =>
              `- ${d.name}: Safety score ${d.safetyScore}, ${d.incidents} incidents`
            ).join('\n');
          break;
        case 'utilization':
          content = `Vehicle utilization analysis:\n\nMost underutilized:\n` +
            answer.underutilized.slice(0, 5).map((v: any) =>
              `- ${v.vehicleId}: ${v.totalDistance.toFixed(1)} km (${v.tripCount} trips)`
            ).join('\n');
          break;
        default:
          content = `Fleet Health Score: ${answer.overallScore}/100\n\n` +
            `Breakdown:\n- Fuel: ${answer.fuelScore}\n- Maintenance: ${answer.maintenanceScore}\n- Driver: ${answer.driverScore}\n- Utilization: ${answer.utilizationScore}\n\n` +
            `Fleet: ${answer.totalVehicles} vehicles, ${answer.activeDrivers} active drivers, ${answer.todayTrips} trips today.`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content, data: answer }]);
    } catch (error: any) {
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-brand-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fleet AI Assistant</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ask questions about your fleet</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-brand-600" />
                </div>
              )}
              <div className={`max-w-2xl p-4 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}>
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-brand-600" />
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about maintenance, fuel, drivers, or fleet health..."
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="max-w-4xl mx-auto mt-2 flex gap-2 flex-wrap">
            {['Which vehicles need maintenance?', 'Which drivers consume the most fuel?', 'Which vehicles are underutilized?', 'Fleet health score'].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
