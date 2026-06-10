import React, { useState, useEffect } from 'react';
import Column from '../Column/Column';
import TaskCard from '../TaskCard/TaskCard';
import TaskForm from '../TaskForm/TaskForm';
import './KanbanBoard.css';

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#ff4d4f' },
  { id: 'in-progress', title: 'In Progress', color: '#faad14' },
  { id: 'done', title: 'Done', color: '#52c41a' },
];

const KanbanBoard = () => {
  // LocalStorage initialization
  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('kanban_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // State controls for adding new columns
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('#0070f3');

  // Custom Toast State
  const [toastMessage, setToastMessage] = useState(null);

  // Dragging states (Shared across tasks & columns)
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragWidth, setDragWidth] = useState(0);
  const [createCustom, setCreateCustom] = useState(false);

  const handleCustom = (e)=>{
      setCreateCustom(!createCustom)
    }

  // Auto-sync utilities
  useEffect(() => {
    localStorage.setItem('kanban_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Helper helper to trigger custom notification banner
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Column Creation Engine
  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;

    const newCol = {
      id: `col_${Date.now()}`,
      title: newColTitle.trim(),
      color: newColColor
    };

    setColumns([...columns, newCol]);
    setNewColTitle('');
  };

  // Guarded Deletion Engine
  const handleDeleteColumn = (colId) => {
    const hasTasks = tasks.some(task => task.status === colId);
    
    if (hasTasks) {
      showToast("Tasks present, cannot delete stage.");
      return;
    }

    setColumns(columns.filter(col => col.id !== colId));
  };

  const handleAddTask = (data) => {
    setTasks([...tasks, { ...data, id: Date.now().toString() }]);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleClearAllData = () => {
    if (window.confirm("Delete everything and start fresh?")) {
      setTasks([]);
      setColumns(DEFAULT_COLUMNS);
      localStorage.clear();
    }
  };

  // Initialize Card Move Tracking
  const handleStartDrag = (e, task) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedTask(task);
    setDragWidth(rect.width);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPosition({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Initialize Column Move Tracking
  const handleStartColumnDrag = (e, column) => {
    if (e.target.closest('.column-delete-btn')) return;
    const rect = e.currentTarget.closest('.column-container').getBoundingClientRect();
    
    setDraggedColumn(column);
    setDragWidth(rect.width);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPosition({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Unified Pointer Listener Effect Hook
  useEffect(() => {
    if (!draggedTask && !draggedColumn) return;

    const handlePointerMove = (e) => {
      setDragPosition({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e) => {
      // CASE A: Task is dropped
      if (draggedTask) {
        const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);
        const columnElement = elementAtPoint?.closest('[data-status]');

        if (columnElement) {
          const newStatus = columnElement.getAttribute('data-status');
          const cardElements = Array.from(columnElement.querySelectorAll('.task-card:not(.dragging-placeholder)'));
          
          let insertIndex = cardElements.length;
          for (let i = 0; i < cardElements.length; i++) {
            const rect = cardElements[i].getBoundingClientRect();
            if (e.clientY < (rect.top + rect.height / 2)) {
              insertIndex = i;
              break;
            }
          }

          setTasks(prev => {
            const clean = prev.filter(t => t.id !== draggedTask.id);
            const targets = clean.filter(t => t.status === newStatus);
            const others = clean.filter(t => t.status !== newStatus);
            targets.splice(insertIndex, 0, { ...draggedTask, status: newStatus });
            return [...others, ...targets];
          });
        }
        setDraggedTask(null);
      }

      // CASE B: Column is dropped
      if (draggedColumn) {
        const boardContainer = document.querySelector('.board-columns');
        const columnNodes = Array.from(boardContainer.querySelectorAll('.column-container'));
        
        let insertIndex = columnNodes.length;
        for (let i = 0; i < columnNodes.length; i++) {
          const rect = columnNodes[i].getBoundingClientRect();
          // Evaluate horizontal coordinate midpoints
          if (e.clientX < (rect.left + rect.width / 2)) {
            insertIndex = i;
            break;
          }
        }

        setColumns(prev => {
          const clean = prev.filter(c => c.id !== draggedColumn.id);
          clean.splice(insertIndex, 0, draggedColumn);
          return clean;
        });
        setDraggedColumn(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedTask, draggedColumn]);

  return (
    <div className="board-container">
      {/* Toast Alert Portal */}
      {toastMessage && <div className="custom-toast-banner">{toastMessage}</div>}

      <header className="board-header">
        <h1>Daily Operations Tracker</h1>
        <div className="in-header">
          <button className="clear-data-btn" onClick={handleClearAllData}>
          Reset Entire Workspace
          </button>
          {/* Dynamic Column Generator Form */}
          <div className="column-creator-container">
            <h3 onClick={handleCustom}>Create Custom Stage</h3>
            {createCustom && <form onSubmit={handleAddColumn} className="column-creator-form">
              <input 
                type="text"
                placeholder="Stage Title (e.g., Testing)"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                required
              />
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                />
              </div>
              <button type="submit" className="add-column-btn">Add Stage</button>
            </form>}
          </div>
        </div>
      </header>

      {/* Control Actions Deck */}
      <div className="management-deck">
        <TaskForm onAddTask={handleAddTask} />
      </div>
      
      {/* Central Columns Grid */}
      <div className="board-columns">
        {columns.map(column => {
          const filteredTasks = tasks.filter(task => task.status === column.id);

          return (
            <Column 
              key={column.id} 
              column={column}
              onDeleteColumn={handleDeleteColumn}
              onStartColumnDrag={handleStartColumnDrag}
              isDragging={draggedColumn?.id === column.id} // ADDED THIS PROP FLAG HERE
            >
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  columnColor={column.color}
                  onStartDrag={handleStartDrag}
                  onDelete={handleDeleteTask} 
                  isDragging={draggedTask?.id === task.id}
                />
              ))}

              {filteredTasks.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '4px', fontSize: '0.9rem' }}>
                  No active items
                </div>
              )}
            </Column>
          );
        })}
      </div>

      {/* Ghost Preview Shadow Mirror Item for Moving Columns */}
      {draggedColumn && (
        <div
          className="column-container"
          style={{
            position: 'fixed',
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            width: dragWidth,
            pointerEvents: 'none', // Allows underlying calculations to bypass this node
            zIndex: 9999,
            opacity: 0.85,
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            transform: 'rotate(2deg) scale(1.01)', // Subtle dynamic movement cue
            transition: 'transform 0.1s'
          }}
        >
          <div className="column-header-zone" style={{ borderLeft: `4px solid ${draggedColumn.color}` }}>
            <h2 className="column-title">{draggedColumn.title}</h2>
            <button className="column-delete-btn">✕</button>
          </div>
          
          <div className="column-content">
            {/* Reads and visually copies all matching cards into the moving preview */}
            {tasks
              .filter(task => task.status === draggedColumn.id)
              .map(task => (
                <div 
                  key={task.id} 
                  className="task-card" 
                  style={{ borderLeft: `4px solid ${draggedColumn.color}` }}
                >
                  <div className="task-card-header">
                    <h4 className="task-card-title">{task.title}</h4>
                    <button className="task-delete-btn">✕</button>
                  </div>
                  {task.description && <p className="task-card-description">{task.description}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {draggedTask && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            width: dragWidth,
            pointerEvents: 'none', // Crucial: lets the mouse "see" through to the columns below
            zIndex: 99999, // Brings the card to the absolute front
            backgroundColor: '#ffffff',
            padding: '14px',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            borderLeft: `4px solid ${columns.find(col => col.id === draggedTask.status)?.color || '#ccc'}`,
            transform: 'scale(1.02)', 
            transition: 'transform 0.1s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#222', fontWeight: 600 }}>{draggedTask.title}</h4>
            <span style={{ color: '#ff4d4f', fontSize: '0.9rem' }}>✕</span>
          </div>
          {draggedTask.description && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: 1.4 }}>{draggedTask.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;