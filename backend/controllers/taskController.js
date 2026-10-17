const Task = require('../models/Task')

async function createTask(req, res) {
  try {
    const { title, description, status, priority, dueDate } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      })
    }

    if (title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 100 characters'
      })
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters'
      })
    }

    if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status'
      })
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task priority'
      })
    }

    let parsedDueDate = null

    if (dueDate) {
      parsedDueDate = new Date(dueDate)

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date'
        })
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: parsedDueDate,
      user: req.user.id
    })

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    })
  } catch (error) {
    console.error('Create task failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to create task'
    })
  }
}

async function getTasks(req, res) {
  try {
    const tasks = await Task.find({
      user: req.user.id
    }).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    })
  } catch (error) {
    console.error('Get tasks failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks'
    })
  }
}

async function updateTask(req, res) {
  try {
    const { title, description, status, priority, dueDate } = req.body
    const updates = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Task title is required'
        })
      }

      if (title.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot exceed 100 characters'
        })
      }

      updates.title = title.trim()
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Description must be a string of at most 1000 characters'
        })
      }

      updates.description = description.trim()
    }

    if (status !== undefined) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task status'
        })
      }

      updates.status = status
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid task priority'
        })
      }

      updates.priority = priority
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        updates.dueDate = null
      } else {
        const parsedDueDate = new Date(dueDate)

        if (Number.isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date'
          })
        }

        updates.dueDate = parsedDueDate
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update'
      })
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id
      },
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      })
    }

    console.error('Update task failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to update task'
    })
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      })
    }

    console.error('Delete task failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    })
  }
}



module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
}
