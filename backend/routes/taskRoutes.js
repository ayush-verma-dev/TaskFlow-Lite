const express = require('express')
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/', protect, createTask)
router.get('/', protect, getTasks)
router.patch('/:id', protect, updateTask)
router.delete('/:id', protect, deleteTask)

module.exports = router
