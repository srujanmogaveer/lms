import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiPlus, FiCheck } from 'react-icons/fi';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface DailyTask {
  id: string;
  title: string;
  timeIST: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export const InstructorCalendarWidget: React.FC = () => {
  const todayDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem('edusphere_instructor_today_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'task-1',
        title: 'Review and evaluate pending assignment submissions',
        timeIST: '11:00 AM IST',
        priority: 'high',
        completed: false,
      },
      {
        id: 'task-2',
        title: 'Check student discussion forum questions',
        timeIST: '02:30 PM IST',
        priority: 'medium',
        completed: false,
      },
      {
        id: 'task-3',
        title: 'Prepare course materials and curriculum updates',
        timeIST: '05:00 PM IST',
        priority: 'low',
        completed: false,
      },
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('edusphere_instructor_today_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST';

    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      title: newTaskText.trim(),
      timeIST: nowTime,
      priority: 'medium',
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
    setIsAdding(false);
  };

  const getPriorityBadge = (priority: DailyTask['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  return (
    <Card className="p-6 space-y-4 shadow-md border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Today's Schedule ({todayDateFormatted})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                IST Time Zone Agenda & Daily Tasks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <FiPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Add task for today..."
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              whileHover={{ x: 2 }}
              onClick={() => toggleTask(task.id)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                task.completed
                  ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  task.completed ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {task.completed && <FiCheck className="w-3 h-3" />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3
                    className={`font-bold text-xs line-clamp-1 ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3 text-amber-500" /> {task.timeIST}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {getPriorityBadge(task.priority)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
};
