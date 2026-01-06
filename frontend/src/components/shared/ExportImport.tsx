import { Todo } from '../../hooks/useTodos';

type ExportImportProps = {
  todos: Todo[];
  onImport: (todos: Partial<Todo>[]) => Promise<void>;
};

export function ExportImportButtons({ todos, onImport }: ExportImportProps) {
  const handleExport = () => {
    const exportData = todos.map((todo) => ({
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      priority: todo.priority,
      due_date: todo.due_date,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('Invalid format: expected an array');
      }

      const validTodos = data.filter(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          'title' in item &&
          typeof (item as { title: unknown }).title === 'string'
      );

      if (validTodos.length === 0) {
        throw new Error('No valid todos found in file');
      }

      await onImport(validTodos);
    } catch (error) {
      alert(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={todos.length === 0}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
        title="Export todos as JSON"
      >
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Export
      </button>
      <label className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer">
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Import
        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>
    </div>
  );
}
