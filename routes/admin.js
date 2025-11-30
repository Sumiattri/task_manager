const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const PrioritizationRule = require('../models/PrioritizationRule');
const Category = require('../models/Category');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');

// Configure Prioritization Rules
router.post('/prioritization-rules', adminAuth, async (req, res) => {
  try {
    const { deadlineWeight, importanceWeight, importanceLevels } = req.body;
    
    // Use findOneAndUpdate with upsert for atomic operation
    const updateData = {
      deadlineWeight: deadlineWeight !== undefined ? deadlineWeight : 0.5,
      importanceWeight: importanceWeight !== undefined ? importanceWeight : 0.5,
      importanceLevels: importanceLevels || {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4
      },
      isActive: true,
      lastModifiedBy: req.user._id
    };

    // If updating existing rule, merge importanceLevels instead of replacing
    const existingRule = await PrioritizationRule.findOne({ isActive: true });
    if (existingRule && importanceLevels) {
      updateData.importanceLevels = { ...existingRule.importanceLevels, ...importanceLevels };
    }
    if (existingRule && deadlineWeight === undefined) {
      updateData.deadlineWeight = existingRule.deadlineWeight;
    }
    if (existingRule && importanceWeight === undefined) {
      updateData.importanceWeight = existingRule.importanceWeight;
    }

    const rule = await PrioritizationRule.findOneAndUpdate(
      { isActive: true },
      updateData,
      { 
        upsert: true, 
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({ 
      message: 'Prioritization rules configured successfully', 
      rule,
      modifiedBy: req.user.username
    });
  } catch (error) {
    // Handle version conflict (optimistic locking)
    if (error.name === 'VersionError') {
      return res.status(409).json({ 
        message: 'Rules were modified by another admin. Please refresh and try again.' 
      });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get('/prioritization-rules', adminAuth, async (req, res) => {
  try {
    const rule = await PrioritizationRule.findOne({ isActive: true });
    res.json(rule || { deadlineWeight: 0.5, importanceWeight: 0.5, importanceLevels: { low: 1, medium: 2, high: 3, critical: 4 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manage Task Categories
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.json({ message: 'Category created successfully', category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Monitor System Performance
router.get('/performance', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const totalTimeLogs = await TimeLog.countDocuments();
    
    const totalTimeSpent = await TimeLog.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$duration' } } }
    ]);

    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const tasksByImportance = await Task.aggregate([
      { $group: { _id: '$importanceLevel', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      totalTimeLogs,
      totalTimeSpent: totalTimeSpent[0]?.total || 0,
      tasksByStatus,
      tasksByImportance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

