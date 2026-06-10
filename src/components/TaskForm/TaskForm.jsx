import React, { useState } from 'react';
import './TaskForm.css';

const TaskForm = ({ onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [formActive, setFormActive] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    if (!title.trim()) return; // Don't add empty tasks

    // Call the parent function with the new task data
    onAddTask({ title, description, status });

    // Reset the form fields
    setTitle('');
    setDescription('');
    setStatus('todo');
  };

  const handleForm = (e)=> {
    setFormActive(!formActive)
  }

  return (
    <div className="task-form-container">
      <h3 className="task-form-title" onClick={handleForm}>Add New Task</h3>
      
      {formActive && <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-group flex-1">
          <label className="form-label">Task Title *</label>
          <input 
            type="text" 
            className="form-input"
            placeholder="e.g., Fix navigation bug"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group flex-2">
          <label className="form-label">Description</label>
          <input 
            type="text" 
            className="form-input"
            placeholder="Brief details about the task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Initial Column</label>
          <select 
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          Add Task
        </button>
      </form>}
    </div>
  );
};

export default TaskForm;