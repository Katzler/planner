import { useRef } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';
import { useTaskStore } from '../../stores/taskStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import toast from 'react-hot-toast';

interface ExportData {
  version: number;
  exportedAt: string;
  tasks: {
    coreTasks: ReturnType<typeof useTaskStore.getState>['coreTasks'];
    todos: ReturnType<typeof useTaskStore.getState>['todos'];
  };
  schedule: {
    weekSchedule: ReturnType<typeof useScheduleStore.getState>['weekSchedule'];
  };
}

export function ExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskStore = useTaskStore();
  const scheduleStore = useScheduleStore();

  const handleExport = () => {
    try {
      const data: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks: {
          coreTasks: taskStore.coreTasks,
          todos: taskStore.todos,
        },
        schedule: {
          weekSchedule: scheduleStore.weekSchedule,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported');
    } catch {
      toast.error('Failed to export data. Please try again.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onerror = () => {
      toast.error('Failed to read file. Please try again.');
    };

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          toast.error('Failed to read file contents.');
          return;
        }

        let data: ExportData;
        try {
          data = JSON.parse(result);
        } catch {
          toast.error('Invalid file format. Expected a JSON file.');
          return;
        }

        if (!data.version || !data.tasks || !data.schedule) {
          toast.error('Invalid backup file. Missing required fields.');
          return;
        }

        // Import tasks
        if (data.tasks.coreTasks) {
          data.tasks.coreTasks.forEach((task) => {
            if (!taskStore.coreTasks.find((t) => t.id === task.id)) {
              taskStore.addCoreTask(task);
            }
          });
        }

        if (data.tasks.todos) {
          data.tasks.todos.forEach((todo) => {
            if (!taskStore.todos.find((t) => t.id === todo.id)) {
              taskStore.addTodo(todo);
            }
          });
        }

        // Import schedule
        if (data.schedule.weekSchedule) {
          scheduleStore.setWeekSchedule(data.schedule.weekSchedule);
        }

        toast.success('Data imported');
      } catch {
        toast.error('An unexpected error occurred during import.');
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center"
          style={{
            borderRadius: 'var(--border-radius-md)',
            background: 'var(--accent-bg)',
          }}
        >
          <Download style={{ color: 'var(--accent-primary)' }} size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Backup & Restore
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Export or restore your data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-4"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Export
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Download your tasks and schedule
          </p>
          <Button onClick={handleExport} variant="secondary" size="sm" className="w-full">
            <Download size={14} className="mr-2" />
            Export
          </Button>
        </div>

        <div
          className="p-4"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Import
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Restore from a backup file
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <Upload size={14} className="mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div
        className="p-3 flex items-start gap-2 text-sm"
        style={{
          background: 'var(--status-warning-bg)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <AlertTriangle style={{ color: 'var(--status-warning)' }} className="shrink-0 mt-0.5" size={16} />
        <div style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-1">
            <strong style={{ color: 'var(--text-primary)' }}>Data is stored locally in your browser.</strong>
          </p>
          <p>
            Your data will be lost if you clear your browser's cache, cookies, site data, or browsing history.
            Using incognito/private mode will also not save your data. Export backups regularly to avoid losing your tasks.
          </p>
        </div>
      </div>
    </div>
  );
}
