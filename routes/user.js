const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Category = require('../models/Category');
const PrioritizationRule = require('../models/PrioritizationRule');

// Calculate priority score based on rules
const calculatePriorityScore = (task, rule) => {
  if (!rule) return 0;
  
  const now = new Date();
  const deadline = new Date(task.deadline);
  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);
  
  // Normalize deadline urgency (closer deadline = higher score)
  const deadlineScore = daysUntilDeadline <= 0 ? 100 : Math.max(0, 100 - (daysUntilDeadline * 10));
  
  // Importance score
  const importanceScore = rule.importanceLevels[task.importanceLevel] || 1;
  const normalizedImportance = (importanceScore / 4) * 100;
  
  // Weighted combination
  return (deadlineScore * rule.deadlineWeight) + (normalizedImportance * rule.importanceWeight);
};

// Set Task Priorities
router.post('/tasks', auth, async (req, res) => {
  try {
    const { name, description, deadline, importanceLevel, category } = req.body;
    
    const task = new Task({
      userId: req.user._id,
      name,
      description,
      deadline,
      importanceLevel: importanceLevel || 'medium',
      category
    });

    // Calculate priority score
    const rule = await PrioritizationRule.findOne({ isActive: true });
    task.priorityScore = calculatePriorityScore(task, rule);
    
    await task.save();
    await task.populate('category');
    
    res.json({ message: 'Task priority set successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .populate('category')
      .sort({ priorityScore: -1, deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    Object.assign(task, req.body);
    
    // Recalculate priority if deadline or importance changed
    if (req.body.deadline || req.body.importanceLevel) {
      const rule = await PrioritizationRule.findOne({ isActive: true });
      task.priorityScore = calculatePriorityScore(task, rule);
    }
    
    await task.save();
    await task.populate('category');
    
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track Time Spent on Tasks
router.post('/time-logs', auth, async (req, res) => {
  try {
    const { taskId, startTime, endTime } = req.body;
    
    const timeLog = new TimeLog({
      userId: req.user._id,
      taskId,
      startTime: startTime || new Date(),
      endTime,
      isActive: !endTime
    });

    if (endTime) {
      timeLog.duration = (new Date(endTime) - new Date(startTime)) / 1000 / 60; // in minutes
      
      // Update task total time
      const task = await Task.findById(taskId);
      if (task) {
        task.totalTimeSpent += timeLog.duration;
        await task.save();
      }
    }

    await timeLog.save();
    
    res.json({ message: 'Time entry logged successfully', timeLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/time-logs', auth, async (req, res) => {
  try {
    const timeLogs = await TimeLog.find({ userId: req.user._id })
      .populate('taskId')
      .sort({ startTime: -1 });
    res.json(timeLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/time-logs/:id/stop', auth, async (req, res) => {
  try {
    const timeLog = await TimeLog.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!timeLog) {
      return res.status(404).json({ message: 'Active time log not found' });
    }

    timeLog.endTime = new Date();
    timeLog.duration = (timeLog.endTime - timeLog.startTime) / 1000 / 60; // in minutes
    timeLog.isActive = false;

    // Update task total time
    const task = await Task.findById(timeLog.taskId);
    if (task) {
      task.totalTimeSpent += timeLog.duration;
      await task.save();
    }

    await timeLog.save();
    
    res.json({ message: 'Time tracking stopped successfully', timeLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review Task Progress
router.get('/progress', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    const timeLogs = await TimeLog.find({ userId: req.user._id });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.totalTimeSpent || 0), 0);
    
    const tasksByStatus = {
      pending: tasks.filter(t => t.status === 'pending').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      completed: completedTasks
    };

    const tasksByImportance = {
      low: tasks.filter(t => t.importanceLevel === 'low').length,
      medium: tasks.filter(t => t.importanceLevel === 'medium').length,
      high: tasks.filter(t => t.importanceLevel === 'high').length,
      critical: tasks.filter(t => t.importanceLevel === 'critical').length
    };

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
      totalTimeSpent: totalTimeSpent.toFixed(2),
      tasksByStatus,
      tasksByImportance,
      recentTasks: tasks.slice(0, 5).map(t => ({
        name: t.name,
        status: t.status,
        timeSpent: t.totalTimeSpent
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get categories for dropdown
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

