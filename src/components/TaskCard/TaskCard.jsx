import React from 'react';
import './TaskCard.css';

// Added columnColor prop straight from the parent render generator loop
const TaskCard = ({ task, columnColor, onStartDrag, onDelete, isDragging }) => {
  
  const handlePointerDown = (e) => {
    if (e.target.closest('.task-delete-btn')) return;
    onStartDrag(e, task);
  };

  return (
    <div 
      className={`task-card ${isDragging ? 'dragging-placeholder' : ''}`}
      data-id={task.id}
      onPointerDown={handlePointerDown}
      style={{ 
        cursor: 'grab',
        // REWRITTEN: Read the dynamic column color color code directly
        borderLeftColor: columnColor,
        opacity: isDragging ? 0.3 : 1 
      }} 
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{task.title}</h4>
        <button 
          className="task-delete-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          title="Delete task"
        >
          ✕
        </button>
      </div>
      
      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}
    </div>
  );
};

export default TaskCard;