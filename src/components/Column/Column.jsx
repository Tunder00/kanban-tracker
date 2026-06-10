import React from 'react';
import './Column.css';

const Column = ({ column, onDeleteColumn, onStartColumnDrag, isDragging, children }) => {
  return (
    <div 
      className={`column-container ${isDragging ? 'column-dragging-source' : ''}`} 
      data-status={column.id}
    >
      {/* Title Header Block - Sits cleanly on top */}
      <div 
        className="column-header-zone"
        onPointerDown={(e) => onStartColumnDrag(e, column)}
        style={{ borderLeft: `4px solid ${column.color}` }}
      >
        <h2 className="column-title">{column.title}</h2>
        <button 
          className="column-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteColumn(column.id);
          }}
          title="Delete this stage"
        >
          ✕
        </button>
      </div>
      
      {/* Dark Grey Task Content Area - Appears directly below the title */}
      <div className="column-content">
        {children}
      </div>
    </div>
  );
};

export default Column;