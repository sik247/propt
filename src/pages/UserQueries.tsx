import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

const UserQueries = () => {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('gpt-5-mini-2025-08-07');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/run-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, model }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
      toast.success('Query executed successfully!');
    } catch (error) {
      console.error('Error executing query:', error);
      toast.error('Failed to execute query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Run Your Query</h1>
        <div className="space-y-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your query here..."
            className="min-h-[100px] resize-none"
          />
          <Select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gpt-5-2025-08-07">GPT-5</option>
            <option value="gpt-5-mini-2025-08-07">GPT-5 Mini</option>
            <option value="gpt-5-nano-2025-08-07">GPT-5 Nano</option>
            <option value="gpt-5-chat-2025-08-07">GPT-5 Chat</option>
            <option value="gpt-4.1-2025-04-14">GPT-4.1</option>
            <option value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</option>
            <option value="gpt-4.1-nano-2025-04-14">GPT-4.1 Nano</option>
          </Select>
          <Button onClick={handleQuery} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? 'Running...' : 'Run Query'}
          </Button>
          {response && (
            <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
              <h2 className="text-lg font-semibold text-foreground mb-2">Response</h2>
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                {response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserQueries;
