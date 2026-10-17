import { useEffect, useState } from 'react'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '')

const initialAuthForm = {
  name: '',
  email: '',
  password: ''
}

const initialTaskForm = {
  title: '',
  description: '',
  priority: 'medium',
  status: 'pending',
  dueDate: ''
}

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState(initialAuthForm)
  const [user, setUser] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [tasks, setTasks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [refreshTasks, setRefreshTasks] = useState(0)

  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [taskMessage, setTaskMessage] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTaskForm, setEditTaskForm] = useState(initialTaskForm)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [isDeletingTaskId, setIsDeletingTaskId] = useState(null)

  // Restore the cookie-backed session when the app opens.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        })

        if (!response.ok) {
          setUser(null)
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Session check failed:', error)
        setMessage('Unable to connect to the server. Please try again.')
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [])

  // Load tasks for the authenticated user.
  useEffect(() => {
    if (!user) {
      setTasks([])
      setIsLoadingTasks(false)
      return
    }

    let cancelled = false

    async function loadTasks() {
      setIsLoadingTasks(true)
      setTaskError('')

      try {
        const response = await fetch(`${API_URL}/api/tasks`, {
          credentials: 'include'
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load tasks')
        }

        if (!cancelled) {
          setTasks(data.tasks || [])
        }
      } catch (error) {
        if (!cancelled) {
          setTaskError(error.message || 'Unable to load tasks')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTasks(false)
        }
      }
    }

    loadTasks()

    return () => {
      cancelled = true
    }
  }, [user, refreshTasks])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData(previous => ({
      ...previous,
      [name]: value
    }))
  }

  function handleTaskChange(event) {
    const { name, value } = event.target

    setTaskForm(previous => ({
      ...previous,
      [name]: value
    }))
  }

  // Register or log in.
  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    try {
      const endpoint = isLogin ? 'login' : 'register'

      const response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(
          isLogin
            ? {
                email: formData.email,
                password: formData.password
              }
            : formData
        )
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      if (isLogin) {
        // Verify that the browser has an authenticated session.
        const sessionResponse = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        })

        if (!sessionResponse.ok) {
          throw new Error(
            'Login succeeded, but session verification failed.'
          )
        }

        const sessionData = await sessionResponse.json()
        setUser(sessionData.user)
        setMessage('')
      } else {
        setIsLogin(true)

        setFormData(previous => ({
          ...previous,
          password: ''
        }))

        setMessage('Registration successful! You can now log in.')
      }
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the server')
    } finally {
      setIsLoading(false)
    }
  }

  // Create a task using the existing protected API.
  async function handleCreateTask(event) {
    event.preventDefault()
    setTaskMessage('')
    setTaskError('')
    setIsCreatingTask(true)

    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate || null
      }

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create task')
      }

      setTaskForm(initialTaskForm)
      setTaskMessage('Task created successfully!')

      // Reload the list and dashboard counts.
      setRefreshTasks(previous => previous + 1)
    } catch (error) {
      setTaskError(error.message || 'Unable to create task')
    } finally {
      setIsCreatingTask(false)
    }
  }

  function startEditingTask(task) {
    setTaskError('')
    setTaskMessage('')
    setEditingTaskId(task._id)

    setEditTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : ''
    })
  }

  function handleEditTaskChange(event) {
    const { name, value } = event.target

    setEditTaskForm(previous => ({
      ...previous,
      [name]: value
    }))
  }

  async function handleUpdateTask(event) {
    event.preventDefault()
    setTaskError('')
    setTaskMessage('')
    setIsSavingTask(true)

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${editingTaskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            title: editTaskForm.title.trim(),
            description: editTaskForm.description.trim(),
            priority: editTaskForm.priority,
            status: editTaskForm.status,
            dueDate: editTaskForm.dueDate || null
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update task')
      }

      setEditingTaskId(null)
      setEditTaskForm(initialTaskForm)
      setTaskMessage('Task updated successfully!')
      setRefreshTasks(previous => previous + 1)
    } catch (error) {
      setTaskError(error.message || 'Unable to update task')
    } finally {
      setIsSavingTask(false)
    }
  }

  async function handleDeleteTask(taskId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    )

    if (!confirmed) return

    setTaskError('')
    setTaskMessage('')
    setIsDeletingTaskId(taskId)

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete task')
      }

      if (editingTaskId === taskId) {
        setEditingTaskId(null)
      }

      setTaskMessage('Task deleted successfully!')
      setRefreshTasks(previous => previous + 1)
    } catch (error) {
      setTaskError(error.message || 'Unable to delete task')
    } finally {
      setIsDeletingTaskId(null)
    }
  }

  async function handleLogout() {
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Logout failed. Please try again.')
      }

      setUser(null)
      setIsLogin(true)
      setFormData(initialAuthForm)
      setTaskForm(initialTaskForm)
      setTaskMessage('')
      setTaskError('')
      setMessage('')
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the server')
    }
  }

  // Calculate dashboard statistics from the complete task list.
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const completedCount = tasks.filter(
    task => task.status === 'completed'
  ).length

  const pendingCount = tasks.filter(
    task => task.status === 'pending'
  ).length

  const inProgressCount = tasks.filter(
    task => task.status === 'in-progress'
  ).length

  const overdueCount = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') {
      return false
    }

    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)

    return dueDate < today
  }).length

  // Apply search, status and priority filters.
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter

    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const inputClass =
    'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

  const labelClass = 'mb-2 block text-sm font-medium text-slate-300'

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Checking your session...
      </div>
    )
  }

  // Authenticated dashboard.
  if (user) {
    const summaryCards = [
      { label: 'Total tasks', count: tasks.length, color: 'text-blue-400' },
      { label: 'Pending', count: pendingCount, color: 'text-amber-400' },
      {
        label: 'In progress',
        count: inProgressCount,
        color: 'text-violet-400'
      },
      {
        label: 'Completed',
        count: completedCount,
        color: 'text-emerald-400'
      },
      { label: 'Overdue', count: overdueCount, color: 'text-red-400' }
    ]

    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
            <h1 className="text-xl font-bold">
              TaskFlow <span className="text-blue-400">Lite</span>
            </h1>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div>
            <p className="text-sm text-blue-400">YOUR WORKSPACE</p>
            <h2 className="mt-2 text-3xl font-bold">
              Welcome, {user.name}!
            </h2>
            <p className="mt-2 text-slate-400">
              Here's an overview of your tasks.
            </p>
          </div>

          {/* Dashboard summary cards */}
          <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {summaryCards.map(card => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                  {card.count}
                </p>
              </div>
            ))}
          </section>

          {/* Create task form */}
          <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Create a task</h3>
              <p className="mt-1 text-sm text-slate-400">
                Add a task to your personal workspace.
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Task title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  placeholder="e.g. Complete project documentation"
                  maxLength={100}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className={labelClass}>
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskChange}
                  placeholder="Add details about this task"
                  maxLength={1000}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="priority" className={labelClass}>
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleTaskChange}
                    className={inputClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className={labelClass}>
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={taskForm.status}
                    onChange={handleTaskChange}
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="dueDate" className={labelClass}>
                    Due date <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={handleTaskChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {taskMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
                >
                  {taskMessage}
                </div>
              )}

              {taskError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {taskError}
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingTask}
                className="rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingTask ? 'Creating task...' : 'Create task'}
              </button>
            </form>
          </section>

          {/* Task list */}
          <section className="mt-10">
            <div>
              <h3 className="text-xl font-semibold">Your tasks</h3>
              <p className="mt-1 text-sm text-slate-400">
                Tasks associated with your account.
              </p>

              {/* Search and filters */}
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="task-search" className={labelClass}>
                    Search tasks
                  </label>
                  <input
                    id="task-search"
                    type="search"
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Search by title..."
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="status-filter" className={labelClass}>
                    Filter by status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority-filter" className={labelClass}>
                    Filter by priority
                  </label>
                  <select
                    id="priority-filter"
                    value={priorityFilter}
                    onChange={event => setPriorityFilter(event.target.value)}
                    className={inputClass}
                  >
                    <option value="all">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoadingTasks && (
              <p className="mt-6 text-slate-400">Loading your tasks...</p>
            )}

            {taskError && !isLoadingTasks && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                Unable to load or update tasks. {taskError}
                <button
                  type="button"
                  onClick={() => setRefreshTasks(previous => previous + 1)}
                  className="ml-3 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Corrected empty state: distinguish empty list from no matches. */}
            {!isLoadingTasks &&
              !taskError &&
              filteredTasks.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center">
                  <h4 className="text-lg font-semibold">
                    {tasks.length === 0
                      ? 'No tasks yet'
                      : 'No matching tasks'}
                  </h4>

                  <p className="mt-2 text-sm text-slate-400">
                    {tasks.length === 0
                      ? 'Create your first task using the form above.'
                      : 'Try changing your search or filters.'}
                  </p>

                  {tasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                        setPriorityFilter('all')
                      }}
                      className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

            {!isLoadingTasks &&
              !taskError &&
              filteredTasks.length > 0 && (
                <div className="mt-6 space-y-3">
                  {filteredTasks.map(task => (
                    <article
                      key={task._id}
                      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                    >
                      {editingTaskId === task._id ? (
                        <form
                          onSubmit={handleUpdateTask}
                          className="space-y-4"
                        >
                          <h4 className="text-lg font-semibold">Edit task</h4>

                          <div>
                            <label
                              className={labelClass}
                              htmlFor={`edit-title-${task._id}`}
                            >
                              Task title
                            </label>
                            <input
                              id={`edit-title-${task._id}`}
                              name="title"
                              value={editTaskForm.title}
                              onChange={handleEditTaskChange}
                              maxLength={100}
                              className={inputClass}
                              required
                            />
                          </div>

                          <div>
                            <label
                              className={labelClass}
                              htmlFor={`edit-description-${task._id}`}
                            >
                              Description
                            </label>
                            <textarea
                              id={`edit-description-${task._id}`}
                              name="description"
                              value={editTaskForm.description}
                              onChange={handleEditTaskChange}
                              maxLength={1000}
                              rows={3}
                              className={inputClass}
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                              <label
                                className={labelClass}
                                htmlFor={`edit-priority-${task._id}`}
                              >
                                Priority
                              </label>
                              <select
                                id={`edit-priority-${task._id}`}
                                name="priority"
                                value={editTaskForm.priority}
                                onChange={handleEditTaskChange}
                                className={inputClass}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>

                            <div>
                              <label
                                className={labelClass}
                                htmlFor={`edit-status-${task._id}`}
                              >
                                Status
                              </label>
                              <select
                                id={`edit-status-${task._id}`}
                                name="status"
                                value={editTaskForm.status}
                                onChange={handleEditTaskChange}
                                className={inputClass}
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>

                            <div>
                              <label
                                className={labelClass}
                                htmlFor={`edit-dueDate-${task._id}`}
                              >
                                Due date
                              </label>
                              <input
                                id={`edit-dueDate-${task._id}`}
                                name="dueDate"
                                type="date"
                                value={editTaskForm.dueDate}
                                onChange={handleEditTaskChange}
                                className={inputClass}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              disabled={isSavingTask}
                              className="rounded-lg bg-blue-500 px-4 py-2 font-medium hover:bg-blue-600 disabled:opacity-60"
                            >
                              {isSavingTask ? 'Saving...' : 'Save changes'}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingTask}
                              onClick={() => setEditingTaskId(null)}
                              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold">{task.title}</h4>

                            {task.description && (
                              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                                {task.status === 'in-progress'
                                  ? 'In progress'
                                  : task.status.charAt(0).toUpperCase() +
                                    task.status.slice(1)}
                              </span>

                              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                                {task.priority.charAt(0).toUpperCase() +
                                  task.priority.slice(1)}{' '}
                                priority
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-400">
                              {task.dueDate
                                ? `Due ${new Date(task.dueDate).toLocaleDateString()}`
                                : 'No due date'}
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              disabled={isDeletingTaskId === task._id}
                              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task._id)}
                              disabled={isDeletingTaskId === task._id}
                              className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                            >
                              {isDeletingTaskId === task._id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
          </section>

          <p className="mt-8 text-sm text-slate-500">{user.email}</p>
        </main>
      </div>
    )
  }

  // Login and registration screen.
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl font-bold text-blue-400">
            T
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            TaskFlow <span className="text-blue-400">Lite</span>
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            {isLogin
              ? 'Welcome back! Sign in to manage your tasks.'
              : 'Create your account and organize your work.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true)
              setMessage('')
            }}
            className={`rounded-lg py-2.5 text-sm font-medium transition ${
              isLogin
                ? 'bg-blue-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLogin(false)
              setMessage('')
            }}
            className={`rounded-lg py-2.5 text-sm font-medium transition ${
              !isLogin
                ? 'bg-blue-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                minLength={2}
                maxLength={100}
                className={inputClass}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              minLength={8}
              className={inputClass}
              required
            />
          </div>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border p-3 text-sm ${
                message.toLowerCase().includes('successful')
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? 'Please wait...'
              : isLogin
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Simple tasks. Clear priorities. Better productivity.
        </p>
      </div>
    </div>
  )
}

export default App