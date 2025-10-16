import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Calendar } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    title: string;
    text: string;
    value: string;
  }>;
}

interface FormData {
  name: string;
  status: string;
  dueDate: string;
  videoLink: string;
  priority: string;
}

interface Message {
  type: string;
  text: string;
}

export default function MondayForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    status: 'Not Started',
    dueDate: '',
    videoLink: '',
    priority: 'Medium'
  });
  const [apiToken, setApiToken] = useState('');
  const [boardId, setBoardId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [polling, setPolling] = useState(false);

  // Fetch board items
  const fetchBoardItems = async () => {
    if (!apiToken || !boardId) return;

    try {
      const query = `query {
        boards(ids: [${boardId}]) {
          items_page(limit: 50) {
            items {
              id
              name
              column_values {
                id
                title
                text
                value
              }
            }
          }
        }
      }`;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiToken
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      if (data.data?.boards?.[0]?.items_page?.items) {
        setItems(data.data.boards[0].items_page.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Fetch error: ${errorMessage}` });
    }
  };

  // Poll for changes every 5 seconds when polling is enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && apiToken && boardId) {
      interval = setInterval(fetchBoardItems, 5000);
      fetchBoardItems();
    }
    return () => clearInterval(interval);
  }, [polling, apiToken, boardId]);

  const handleSubmit = async () => {

    if (!apiToken || !boardId) {
      setMessage({ type: 'error', text: 'Please enter API token and Board ID' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Build column values object with correct column IDs
      const columnValues = {
        status: { label: formData.status },
        date_mkwgjj16: { date: formData.dueDate },
        link_mkwgbrj9: { url: formData.videoLink, text: "Video" },
        color_mkwgb0s1: { label: formData.priority }
      };

      const mutation = `mutation {
        create_item (
          board_id: ${boardId},
          item_name: "${formData.name.replace(/"/g, '\\"')}",
          column_values: ${JSON.stringify(columnValues)}
        ) {
          id
          name
        }
      }`;

      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiToken
        },
        body: JSON.stringify({ query: mutation })
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      setMessage({ type: 'success', text: 'Project added successfully!' });
      setFormData({
        name: '',
        status: 'Not Started',
        dueDate: '',
        videoLink: '',
        priority: 'Medium'
      });

      if (polling) {
        setTimeout(fetchBoardItems, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: 'error', text: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Not Started': 'bg-gray-100 text-gray-700',
      'Working on it': 'bg-yellow-100 text-yellow-700',
      'Done': 'bg-green-100 text-green-700',
      'Stuck': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-100 text-red-700',
      'Medium': 'bg-blue-100 text-blue-700',
      'Low': 'bg-gray-100 text-gray-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Projects Board</h1>
          <p className="text-gray-600 mb-6">Add and track your projects in real-time</p>
          
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-purple-600">⚙️</span> API Configuration
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Token *
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Your Monday.com API token"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board ID *
                </label>
                <input
                  type="text"
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  placeholder="Board ID (numbers only)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="polling"
                checked={polling}
                onChange={(e) => setPolling(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="polling" className="text-sm text-gray-700 font-medium">
                🔄 Enable auto-refresh (syncs every 5 seconds)
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="Not Started">Not Started</option>
                <option value="Working on it">Working on it</option>
                <option value="Done">Done</option>
                <option value="Stuck">Stuck</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} /> Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Link
              </label>
              <input
                type="url"
                name="videoLink"
                value={formData.videoLink}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            {loading ? '⏳ Adding Project...' : '✨ Add Project to Monday.com'}
          </button>

          {message.text && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>

        {polling && items.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">📋 Live Projects</h2>
              <div className="flex items-center gap-2">
                <RefreshCw className={`${polling ? 'animate-spin' : ''} text-purple-600`} size={20} />
                <span className="text-sm text-gray-600">Auto-syncing</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Video Link</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const getColumnValue = (id: string) => {
                      const col = item.column_values.find(c => c.id === id);
                      return col?.text || '-';
                    };
                    
                    const statusValue = getColumnValue('status');
                    const dueDateValue = getColumnValue('date_mkwgjj16');
                    const videoLinkCol = item.column_values.find(c => c.id === 'link_mkwgbrj9');
                    const priorityValue = getColumnValue('color_mkwgb0s1');
                    
                    let videoUrl = '-';
                    if (videoLinkCol?.value) {
                      try {
                        const parsed = JSON.parse(videoLinkCol.value);
                        videoUrl = parsed.url || parsed.text || '-';
                      } catch (e) {
                        videoUrl = videoLinkCol.text || '-';
                      }
                    }
                    
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-4 px-4 font-medium text-gray-800">{item.name}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusValue)}`}>
                            {statusValue}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{dueDateValue}</td>
                        <td className="py-4 px-4">
                          {videoUrl && videoUrl !== '-' ? (
                            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              🔗 Link
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(priorityValue)}`}>
                            {priorityValue}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-3">📖 Setup Instructions:</h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Get your API token from Monday.com: Profile → Admin → API</li>
            <li>Find your Board ID from the URL: monday.com/boards/YOUR_BOARD_ID</li>
            <li>Ensure your board has these columns: Status, Due Date, Video Link, Priority</li>
            <li>Column names must match exactly (case-sensitive)</li>
            <li>Enable auto-refresh to see live updates from Monday.com</li>
          </ol>
        </div>
      </div>
    </div>
  );
}