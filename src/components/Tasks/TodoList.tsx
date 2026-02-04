import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ListTodo, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TaskForm } from './TaskForm';
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../../stores/taskStore';
import type { TodoItem } from '../../types';
import toast from 'react-hot-toast';

export function TodoList() {
  const {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoComplete,
    clearCompletedTodos,
  } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; todoId: string | null }>({
    isOpen: false,
    todoId: null,
  });
  const [clearConfirm, setClearConfirm] = useState(false);

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;

  const handleSubmit = (data: Omit<TodoItem, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTodo) {
      updateTodo(editingTodo.id, data);
      toast.success('Todo updated!');
    } else {
      addTodo(data);
      toast.success('Todo created!');
    }
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  const handleEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, todoId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.todoId) {
      deleteTodo(deleteConfirm.todoId);
      toast.success('Todo deleted');
    }
    setDeleteConfirm({ isOpen: false, todoId: null });
  };

  const handleClearCompleted = () => {
    setClearConfirm(true);
  };

  const confirmClearCompleted = () => {
    clearCompletedTodos();
    toast.success(`Cleared ${completedCount} completed todos`);
    setClearConfirm(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--status-success-bg)',
            }}
          >
            <ListTodo style={{ color: 'var(--status-success)' }} size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Todo List
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {todos.length - completedCount} active, {completedCount} completed
            </p>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus size={16} className="mr-1" />
          Add Todo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div
          className="flex gap-1 p-1"
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderRadius: 'var(--border-radius-sm)',
                background: filter === f ? 'var(--accent-primary)' : 'transparent',
                color: filter === f ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {completedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
            <Trash2 size={14} className="mr-1" />
            Clear Completed
          </Button>
        )}
      </div>

      {filteredTodos.length === 0 ? (
        <div
          className="text-center py-12"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px dashed var(--border-primary)',
          }}
        >
          <ListTodo size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all'
              ? 'No todos yet'
              : filter === 'active'
              ? 'No active todos'
              : 'No completed todos'}
          </p>
          {filter === 'all' && (
            <>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Add tasks you need to get done
              </p>
              <Button onClick={() => setIsModalOpen(true)} size="sm">
                Add Your First Todo
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filteredTodos.map((todo) => (
              <TaskCard
                key={todo.id}
                type="todo"
                task={todo}
                onEdit={() => handleEdit(todo)}
                onDelete={() => handleDelete(todo.id)}
                onToggleComplete={() => toggleTodoComplete(todo.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTodo ? 'Edit Todo' : 'New Todo'}
      >
        <TaskForm
          mode="todo"
          initialData={editingTodo || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Todo"
        message="Are you sure you want to delete this todo? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, todoId: null })}
      />

      <ConfirmDialog
        isOpen={clearConfirm}
        title="Clear Completed"
        message={`Are you sure you want to delete ${completedCount} completed todo${completedCount === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmClearCompleted}
        onCancel={() => setClearConfirm(false)}
      />
    </div>
  );
}
