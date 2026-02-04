import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Target } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { TaskForm } from './TaskForm';
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../../stores/taskStore';
import type { CoreTask } from '../../types';
import toast from 'react-hot-toast';

export function CoreTaskList() {
  const { coreTasks, addCoreTask, updateCoreTask, deleteCoreTask, reorderCoreTasks } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CoreTask | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({
    isOpen: false,
    taskId: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderCoreTasks(active.id as string, over.id as string);
    }
  };

  const handleSubmit = (data: Omit<CoreTask, 'id'>) => {
    if (editingTask) {
      updateCoreTask(editingTask.id, data);
      toast.success('Task updated!');
    } else {
      addCoreTask(data);
      toast.success('Core task created!');
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleEdit = (task: CoreTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, taskId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.taskId) {
      deleteCoreTask(deleteConfirm.taskId);
      toast.success('Task deleted');
    }
    setDeleteConfirm({ isOpen: false, taskId: null });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center"
            style={{
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--accent-bg)',
            }}
          >
            <Target style={{ color: 'var(--accent-primary)' }} size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Core Tasks
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Recurring tasks you must complete regularly
            </p>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus size={16} className="mr-1" />
          Add Core Task
        </Button>
      </div>

      {coreTasks.length === 0 ? (
        <div
          className="text-center py-12"
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px dashed var(--border-primary)',
          }}
        >
          <Target size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
            No core tasks yet
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Add your regular work responsibilities
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            Add Your First Core Task
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Drag to reorder • Tasks at top are scheduled first
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={coreTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                <AnimatePresence>
                  {coreTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      type="core"
                      task={task}
                      onEdit={() => handleEdit(task)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Core Task' : 'New Core Task'}
      >
        <TaskForm
          mode="core"
          initialData={editingTask || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Core Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null })}
      />
    </div>
  );
}
