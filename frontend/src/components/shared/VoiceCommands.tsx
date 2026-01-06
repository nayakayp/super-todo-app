import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

type VoiceCommandCallback = {
  pattern: RegExp | string;
  callback: (match: RegExpMatchArray | null) => void;
  description: string;
};

type VoiceCommandsProps = {
  onAddTodo?: (title: string) => void;
  onSearch?: (query: string) => void;
  onToggleTheme?: () => void;
  onNavigate?: (page: string) => void;
  className?: string;
};

export function VoiceCommands({
  onAddTodo,
  onSearch,
  onToggleTheme,
  onNavigate,
  className,
}: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check for browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();

    // Add todo commands
    if (lowerText.startsWith('add task') || lowerText.startsWith('add todo') || lowerText.startsWith('new task')) {
      const title = text.replace(/^(add task|add todo|new task)\s*/i, '').trim();
      if (title && onAddTodo) {
        onAddTodo(title);
        setFeedback(`Added: "${title}"`);
        return true;
      }
    }

    // Search commands
    if (lowerText.startsWith('search') || lowerText.startsWith('find')) {
      const query = text.replace(/^(search|find)\s*/i, '').trim();
      if (query && onSearch) {
        onSearch(query);
        setFeedback(`Searching for: "${query}"`);
        return true;
      }
    }

    // Theme toggle
    if (lowerText.includes('dark mode') || lowerText.includes('light mode') || lowerText.includes('toggle theme')) {
      if (onToggleTheme) {
        onToggleTheme();
        setFeedback('Theme toggled');
        return true;
      }
    }

    // Navigation
    if (lowerText.includes('go to') || lowerText.includes('open')) {
      if (lowerText.includes('stats') || lowerText.includes('statistics')) {
        onNavigate?.('stats');
        setFeedback('Opening statistics');
        return true;
      }
      if (lowerText.includes('calendar')) {
        onNavigate?.('calendar');
        setFeedback('Opening calendar');
        return true;
      }
      if (lowerText.includes('home')) {
        onNavigate?.('home');
        setFeedback('Going home');
        return true;
      }
    }

    setFeedback('Command not recognized');
    return false;
  }, [onAddTodo, onSearch, onToggleTheme, onNavigate]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setFeedback(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.results[event.results.length - 1];
      setTranscript(current[0].transcript);

      if (current.isFinal) {
        processCommand(current[0].transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedback('Error occurred. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [processCommand]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={startListening}
        disabled={isListening}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        <span>{isListening ? 'Listening...' : 'Voice Command'}</span>
      </button>

      {/* Transcript overlay */}
      {isListening && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Listening...</span>
          </div>
          <p className="text-gray-900 dark:text-white min-h-[40px]">
            {transcript || 'Say a command...'}
          </p>
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div className="absolute top-full left-0 mt-2 px-4 py-2 bg-gray-900 text-white rounded-lg shadow-xl text-sm z-50">
          {feedback}
        </div>
      )}
    </div>
  );
}

// Voice command help modal
export function VoiceCommandsHelp({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    { phrase: '"Add task [title]"', action: 'Creates a new todo' },
    { phrase: '"Search [query]"', action: 'Search todos' },
    { phrase: '"Toggle theme"', action: 'Switch dark/light mode' },
    { phrase: '"Go to stats"', action: 'Open statistics page' },
    { phrase: '"Go to calendar"', action: 'Open calendar view' },
    { phrase: '"Go to home"', action: 'Return to home' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn('text-gray-500 hover:text-gray-700 dark:hover:text-gray-300', className)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎤</span>
              Voice Commands
            </h3>

            <div className="space-y-3">
              {commands.map((cmd) => (
                <div
                  key={cmd.phrase}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <code className="text-sm text-purple-600 dark:text-purple-400">
                    {cmd.phrase}
                  </code>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{cmd.action}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Click the voice button and speak clearly. Commands are processed when you stop speaking.
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
