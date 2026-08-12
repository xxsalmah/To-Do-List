import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const categories = [
  {
    id: "brain",
    name: "Brain Dump",
    icon: "🍰",
    color: "cream",
  },
  {
    id: "academic",
    name: "Academic Weapon",
    icon: "🥥",
    color: "pink",
  },
  {
    id: "places",
    name: "Places to Go",
    icon: "👜",
    color: "beige",
  },
  {
    id: "hobbies",
    name: "Hobbies",
    icon: "🎧",
    color: "lavender",
  },
];

const motivationalMessages = [
  "You're doing better than you think ✦",
  "Tiny steps still move you forward 🌷",
  "Look at you getting things done ✨",
  "One thing at a time. You've got this ☕",
  "Progress looks good on you ♡",
  "Future you is going to be grateful for this.",
  "You showed up. That's already something.",
  "Keep going — you're building something lovely ✦",
];

const completionMessages = [
  "Task conquered! ✦",
  "Look at you go! ✨",
  "Another one down! 🌷",
  "Tiny win, big energy ♡",
  "You're on a roll! ☕",
  "Future you says thank you ✦",
  "That deserves a little celebration! 🎀",
];

function Dashboard() {
  const navigate = useNavigate();

  // =========================
  // USER + TASKS
  // =========================

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  // =========================
  // NEW TASK
  // =========================

  const [newTask, setNewTask] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("Brain Dump");

  const [selectedPriority, setSelectedPriority] =
    useState("Medium");

  const [dueDate, setDueDate] = useState("");

  // =========================
  // SEARCH + VIEWS
  // =========================

  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("all");

  // =========================
  // UI
  // =========================

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // =========================
  // EDITING
  // =========================

  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDueDate, setEditDueDate] = useState("");

  // =========================
  // STREAK
  // =========================

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // =========================
  // CELEBRATION
  // =========================

  const [celebration, setCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // =========================
  // DATE HELPERS
  // =========================

  const getDateStatus = (date) => {
    if (!date) return null;

    const today = new Date();
    const due = new Date(date);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() < today.getTime()) {
      return "overdue";
    }

    if (due.getTime() === today.getTime()) {
      return "today";
    }

    return "upcoming";
  };

  const formatDueDate = (date) => {
    if (!date) return "";

    const due = new Date(date);

    return due.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // =========================
  // DAILY MOTIVATION
  // =========================

  const getDailyMessage = () => {
    const today = new Date();

    const dayNumber =
      today.getFullYear() +
      today.getMonth() +
      today.getDate();

    return motivationalMessages[
      dayNumber % motivationalMessages.length
    ];
  };

  // =========================
  // STREAK CALCULATION
  // =========================

  const calculateStreak = (completedDays) => {
    if (!completedDays.length) {
      return {
        current: 0,
        best: 0,
      };
    }

    const sortedDays = [...completedDays].sort();

    let best = 1;
    let running = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const previous = new Date(sortedDays[i - 1]);
      const current = new Date(sortedDays[i]);

      const difference =
        (current - previous) /
        (1000 * 60 * 60 * 24);

      if (difference === 1) {
        running++;
      } else {
        running = 1;
      }

      best = Math.max(best, running);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayKey = today
      .toISOString()
      .split("T")[0];

    const yesterday = new Date(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayKey = yesterday
      .toISOString()
      .split("T")[0];

    let currentStreak = 0;

    if (sortedDays.includes(todayKey)) {
      currentStreak = 1;

      if (sortedDays.includes(yesterdayKey)) {
        for (
          let i = sortedDays.length - 1;
          i > 0;
          i--
        ) {
          const current = new Date(
            sortedDays[i]
          );

          const previous = new Date(
            sortedDays[i - 1]
          );

          const difference =
            (current - previous) /
            (1000 * 60 * 60 * 24);

          if (difference === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      current: currentStreak,
      best,
    };
  };

  // =========================
  // UPDATE STREAK
  // =========================

  const updateStreak = () => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const todayKey = today
      .toISOString()
      .split("T")[0];

    const savedData = JSON.parse(
      localStorage.getItem("taskStreak") || "{}"
    );

    const completedDays =
      savedData.completedDays || [];

    if (!completedDays.includes(todayKey)) {
      completedDays.push(todayKey);
    }

    localStorage.setItem(
      "taskStreak",
      JSON.stringify({
        completedDays,
      })
    );

    const result = calculateStreak(
      completedDays
    );

    setStreak(result.current);
    setBestStreak(result.best);
  };

  // =========================
  // LOAD DASHBOARD
  // =========================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userResponse = await fetch(
          "http://localhost:5000/api/me",
          {
            credentials: "include",
          }
        );

        if (!userResponse.ok) {
          navigate("/login");
          return;
        }

        const userData =
          await userResponse.json();

        setUser(userData.user);

        const taskResponse = await fetch(
          "http://localhost:5000/api/tasks",
          {
            credentials: "include",
          }
        );

        const taskData =
          await taskResponse.json();

        if (taskResponse.ok) {
          setTasks(taskData);
        } else {
          setMessage(
            taskData.message ||
              "Could not load tasks."
          );
        }

        const savedData = JSON.parse(
          localStorage.getItem("taskStreak") || "{}"
        );

        const completedDays =
          savedData.completedDays || [];

        const result =
          calculateStreak(completedDays);

        setStreak(result.current);
        setBestStreak(result.best);
      } catch (error) {
        console.error(error);

        setMessage(
          "Could not connect to the backend."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  // =========================
  // ADD TASK
  // =========================

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            text: newTask,
            category: selectedCategory,
            priority: selectedPriority,
            dueDate: dueDate || null,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setTasks((current) => [
          data.task,
          ...current,
        ]);

        setNewTask("");
        setSelectedPriority("Medium");
        setDueDate("");
        setMessage("");
      } else {
        setMessage(
          data.message ||
            "Could not add task."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // =========================
  // COMPLETE TASK
  // =========================

  const toggleTask = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setTasks((current) =>
          current.map((task) =>
            task._id === taskId
              ? data.task
              : task
          )
        );

        if (data.task.completed) {
          updateStreak();

          const randomMessage =
            completionMessages[
              Math.floor(
                Math.random() *
                  completionMessages.length
              )
            ];

          setCelebrationText(
            randomMessage
          );

          setCelebration(true);

          setTimeout(() => {
            setCelebration(false);
          }, 2500);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // DELETE TASK
  // =========================

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setTasks((current) =>
          current.filter(
            (task) =>
              task._id !== taskId
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // START EDIT
  // =========================

  const startEditing = (task) => {
    setEditingTask(task._id);
    setEditText(task.text);

    setEditPriority(
      task.priority || "Medium"
    );

    if (task.dueDate) {
      setEditDueDate(
        new Date(task.dueDate)
          .toISOString()
          .split("T")[0]
      );
    } else {
      setEditDueDate("");
    }

    setMessage("");
  };

  // =========================
  // CANCEL EDIT
  // =========================

  const cancelEditing = () => {
    setEditingTask(null);
    setEditText("");
    setEditPriority("Medium");
    setEditDueDate("");
  };

  // =========================
  // SAVE EDIT
  // =========================

  const saveEdit = async (taskId) => {
    if (!editText.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            text: editText,
            priority: editPriority,
            dueDate:
              editDueDate || null,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        setTasks((current) =>
          current.map((task) =>
            task._id === taskId
              ? data.task
              : task
          )
        );

        cancelEditing();
      } else {
        setMessage(
          data.message ||
            "Could not edit task."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not connect to the backend."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      await fetch(
        "http://localhost:5000/api/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // FILTER TASKS
  // =========================

  const getCategoryTasks = (
    categoryName
  ) => {
    return tasks.filter((task) => {
      if (
        task.category !==
        categoryName
      ) {
        return false;
      }

      if (
        !task.text
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      ) {
        return false;
      }

      const status = getDateStatus(
        task.dueDate
      );

      if (activeView === "today") {
        return (
          status === "today" &&
          !task.completed
        );
      }

      if (activeView === "high") {
        return (
          task.priority === "High" &&
          !task.completed
        );
      }

      if (activeView === "upcoming") {
        return (
          status === "upcoming" &&
          !task.completed
        );
      }

      if (
        activeView === "completed"
      ) {
        return task.completed;
      }

      if (activeView === "overdue") {
        return (
          status === "overdue" &&
          !task.completed
        );
      }

      return true;
    });
  };

  // =========================
  // STATS
  // =========================

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;

  const totalTasks = tasks.length;

  const remainingTasks =
    totalTasks - completedTasks;

  const todayTasks =
    tasks.filter(
      (task) =>
        !task.completed &&
        getDateStatus(
          task.dueDate
        ) === "today"
    ).length;

  const overdueTasks =
    tasks.filter(
      (task) =>
        !task.completed &&
        getDateStatus(
          task.dueDate
        ) === "overdue"
    ).length;

  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks /
            totalTasks) *
            100
        );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="auth-page">
        <div className="loading-screen">
          <div className="auth-logo">
            ✦
          </div>

          <h2>
            Getting your things together...
          </h2>

          <p>
            Loading your tasks.
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="app">

      {/* =====================
          CELEBRATION
      ====================== */}

      {celebration && (
        <div className="celebration">
          <div className="celebration-card">

            <div className="celebration-sparkles">
              ✦ ✧ ✦
            </div>

            <div className="celebration-icon">
              ✓
            </div>

            <h2>
              {celebrationText}
            </h2>

            <p>
              Keep making those little
              wins count.
            </p>

          </div>
        </div>
      )}

      {/* =====================
          TOP BAR
      ====================== */}

      <header className="topbar">

        <div>
          <p className="eyebrow">
            YOUR LITTLE CORNER ✦
          </p>
        </div>

        <div className="top-actions">

          <button
            className="icon-button"
            onClick={handleLogout}
            title="Log out"
          >
            ↪
          </button>

          <button className="avatar">
            {user?.username
              ? user.username
                  .charAt(0)
                  .toUpperCase()
              : "U"}
          </button>

        </div>

      </header>

      {/* =====================
          HERO
      ====================== */}

      <section className="hero">

        <div>

          <p className="eyebrow">
            WELCOME BACK,{" "}
            {user?.username?.toUpperCase() ||
              "FRIEND"}
          </p>

          <h1>
            Make today
            <br />
            <span>count.</span>
          </h1>

          <p className="hero-subtitle">
            {getDailyMessage()}
          </p>

        </div>

        <div className="progress-circle">

          <strong>
            {progress}%
          </strong>

          <span>
            done
          </span>

        </div>

      </section>

      {/* =====================
          STATS
      ====================== */}

      <section className="stats">

        <div className="stat-card cream">

          <span>☕</span>

          <strong>
            {totalTasks}
          </strong>

          <p>
            Total tasks
          </p>

        </div>

        <div className="stat-card pink">

          <span>✦</span>

          <strong>
            {completedTasks}
          </strong>

          <p>
            Completed
          </p>

        </div>

        <div className="stat-card beige">

          <span>◌</span>

          <strong>
            {remainingTasks}
          </strong>

          <p>
            Still to do
          </p>

        </div>

      </section>

      {/* =====================
          STREAK
      ====================== */}

      <section className="streak-section">

        <div className="streak-card">

          <div className="streak-icon">
            🔥
          </div>

          <div>

            <strong>
              {streak} day
              {streak === 1
                ? ""
                : "s"}
            </strong>

            <p>
              Current streak
            </p>

          </div>

        </div>

        <div className="streak-card">

          <div className="streak-icon">
            🏆
          </div>

          <div>

            <strong>
              {bestStreak} day
              {bestStreak === 1
                ? ""
                : "s"}
            </strong>

            <p>
              Best streak
            </p>

          </div>

        </div>

      </section>

      {/* =====================
          DATE OVERVIEW
      ====================== */}

      <section className="date-overview">

        <div className="date-card">

          <span>◷</span>

          <div>

            <strong>
              {todayTasks}
            </strong>

            <p>
              Due today
            </p>

          </div>

        </div>

        <div className="date-card">

          <span>!</span>

          <div>

            <strong>
              {overdueTasks}
            </strong>

            <p>
              Overdue
            </p>

          </div>

        </div>

      </section>

      {/* =====================
          SEARCH
      ====================== */}

      <div className="search-box">

        <span>
          ⌕
        </span>

        <input
          type="text"
          placeholder="Search your tasks..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

      </div>

      {/* =====================
          SMART VIEWS
      ====================== */}

      <div className="smart-views">

        <button
          className={
            activeView === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("all")
          }
        >
          ✨ All
        </button>

        <button
          className={
            activeView === "today"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("today")
          }
        >
          ☀️ Today
        </button>

        <button
          className={
            activeView === "high"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("high")
          }
        >
          🔴 High Priority
        </button>

        <button
          className={
            activeView === "upcoming"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("upcoming")
          }
        >
          ⏰ Upcoming
        </button>

        <button
          className={
            activeView === "completed"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("completed")
          }
        >
          ✓ Completed
        </button>

        <button
          className={
            activeView === "overdue"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveView("overdue")
          }
        >
          ⚠️ Overdue
        </button>

      </div>

      {/* =====================
          ADD TASK
      ====================== */}

      <section className="add-task">

        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTask}
          onChange={(e) =>
            setNewTask(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask();
            }
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value
            )
          }
        >

          {categories.map(
            (category) => (
              <option
                key={category.id}
                value={category.name}
              >
                {category.name}
              </option>
            )
          )}

        </select>

        <select
          className={`priority-select ${selectedPriority.toLowerCase()}`}
          value={selectedPriority}
          onChange={(e) =>
            setSelectedPriority(
              e.target.value
            )
          }
        >

          <option value="Low">
            🟢 Low
          </option>

          <option value="Medium">
            🟡 Medium
          </option>

          <option value="High">
            🔴 High
          </option>

        </select>

        <input
          className="due-date-input"
          type="date"
          value={dueDate}
          onChange={(e) =>
            setDueDate(
              e.target.value
            )
          }
        />

        <button onClick={addTask}>
          ＋
        </button>

      </section>

      {message && (
        <p className="auth-message">
          {message}
        </p>
      )}

      {/* =====================
          LISTS
      ====================== */}

      <section className="lists-section">

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              YOUR WORLD
            </p>

            <h2>
              My Lists
            </h2>

          </div>

          <span>
            {categories.length} lists
          </span>

        </div>

        <div className="category-grid">

          {categories.map(
            (category) => {

              const categoryTasks =
                getCategoryTasks(
                  category.name
                );

              const completed =
                categoryTasks.filter(
                  (task) =>
                    task.completed
                ).length;

              return (
                <article
                  className={`category-card ${category.color}`}
                  key={category.id}
                >

                  {/* CATEGORY TOP */}

                  <div className="category-top">

                    <div className="category-icon">
                      {category.icon}
                    </div>

                    <span className="task-number">
                      {
                        categoryTasks.length
                      }
                    </span>

                  </div>

                  <div className="category-title">

                    <h3>
                      {category.name}
                    </h3>

                    <span>
                      {completed}/
                      {
                        categoryTasks.length
                      }{" "}
                      done
                    </span>

                  </div>

                  {/* PROGRESS */}

                  <div className="mini-progress">

                    <div
                      style={{
                        width:
                          categoryTasks.length ===
                          0
                            ? "0%"
                            : `${
                                (completed /
                                  categoryTasks.length) *
                                100
                              }%`,
                      }}
                    />

                  </div>

                  {/* TASK LIST */}

                  <div className="task-list">

                    {categoryTasks.length ===
                    0 ? (

                      <p className="empty-task">
                        Nothing here yet ✦
                      </p>

                    ) : (

                      categoryTasks.map(
                        (task) => {

                          const dateStatus =
                            getDateStatus(
                              task.dueDate
                            );

                          return (
                            <div
                              className="task"
                              key={
                                task._id
                              }
                            >

                              {/* EDIT MODE */}

                              {editingTask ===
                              task._id ? (

                                <>
                                  <input
                                    className="edit-task-input"
                                    value={
                                      editText
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditText(
                                        e.target
                                          .value
                                      )
                                    }
                                    onKeyDown={(
                                      e
                                    ) => {

                                      if (
                                        e.key ===
                                        "Enter"
                                      ) {
                                        saveEdit(
                                          task._id
                                        );
                                      }

                                      if (
                                        e.key ===
                                        "Escape"
                                      ) {
                                        cancelEditing();
                                      }

                                    }}
                                    autoFocus
                                  />

                                  <select
                                    className="edit-priority-select"
                                    value={
                                      editPriority
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditPriority(
                                        e.target
                                          .value
                                      )
                                    }
                                  >

                                    <option value="Low">
                                      🟢
                                    </option>

                                    <option value="Medium">
                                      🟡
                                    </option>

                                    <option value="High">
                                      🔴
                                    </option>

                                  </select>

                                  <input
                                    className="edit-date-input"
                                    type="date"
                                    value={
                                      editDueDate
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditDueDate(
                                        e.target
                                          .value
                                      )
                                    }
                                  />

                                  <button
                                    className="edit-save"
                                    onClick={() =>
                                      saveEdit(
                                        task._id
                                      )
                                    }
                                  >
                                    ✓
                                  </button>

                                  <button
                                    className="edit-cancel"
                                    onClick={
                                      cancelEditing
                                    }
                                  >
                                    ×
                                  </button>
                                </>

                              ) : (

                                <>
                                  {/* CHECKBOX */}

                                  <button
                                    className={`checkbox ${
                                      task.completed
                                        ? "checked"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      toggleTask(
                                        task._id
                                      )
                                    }
                                  >
                                    {task.completed
                                      ? "✓"
                                      : ""}
                                  </button>

                                  {/* TASK CONTENT */}

                                  <div className="task-content">

                                    <span
                                      className={
                                        task.completed
                                          ? "completed"
                                          : ""
                                      }
                                    >
                                      {
                                        task.text
                                      }
                                    </span>

                                    {task.dueDate && (
                                      <small
                                        className={`due-date ${dateStatus}`}
                                      >

                                        {dateStatus ===
                                          "overdue" &&
                                          "⚠ "}

                                        {dateStatus ===
                                          "today" &&
                                          "◷ "}

                                        {formatDueDate(
                                          task.dueDate
                                        )}

                                      </small>
                                    )}

                                  </div>

                                  {/* PRIORITY */}

                                  <span
                                    className={`priority-badge ${
                                      (
                                        task.priority ||
                                        "Medium"
                                      ).toLowerCase()
                                    }`}
                                  >
                                    {task.priority ||
                                      "Medium"}
                                  </span>

                                  {/* EDIT */}

                                  <button
                                    className="edit-task"
                                    onClick={() =>
                                      startEditing(
                                        task
                                      )
                                    }
                                    title="Edit task"
                                  >
                                    ✎
                                  </button>

                                  {/* DELETE */}

                                  <button
                                    className="delete-task"
                                    onClick={() =>
                                      deleteTask(
                                        task._id
                                      )
                                    }
                                    title="Delete task"
                                  >
                                    ×
                                  </button>

                                </>
                              )}

                            </div>
                          );
                        }
                      )
                    )}

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>

      {/* =====================
          QUOTE
      ====================== */}

      <section className="quote-card">

        <div className="quote-icon">
          ✦
        </div>

        <div>

          <p>
            "You don't need to
            have it all figured
            out. Just figure out
            the next thing."
          </p>

          <span>
            — your future self
          </span>

        </div>

      </section>

    </div>
  );
}

export default Dashboard;