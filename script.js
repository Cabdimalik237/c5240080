// ===== DATA STORAGE =====
// Initialize data from localStorage or use defaults
let activities = JSON.parse(localStorage.getItem('fittrack_activities')) || [];
let goals = JSON.parse(localStorage.getItem('fittrack_goals')) || {
    dailySteps: 10000,
    weeklyWorkouts: 5,
    dailyCalories: 500
};

// Chart instances
let weeklyChart = null;
let distributionChart = null;
let trendsChart = null;

// ===== UTILITY FUNCTIONS =====

/**
 * Save data to localStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('fittrack_activities', JSON.stringify(activities));
    localStorage.setItem('fittrack_goals', JSON.stringify(goals));
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get start of current week (Monday)
 */
function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get activities filtered by type and date range
 */
function getFilteredActivities(type = 'all', daysBack = null) {
    let filtered = activities;
    
    // Filter by type
    if (type !== 'all') {
        filtered = filtered.filter(activity => activity.type === type);
    }
    
    // Filter by date range
    if (daysBack !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        cutoffDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(activity => new Date(activity.date) >= cutoffDate);
    }
    
    return filtered;
}

/**
 * Calculate total for a specific activity type
 */
function calculateTotal(type, dateFilter = null) {
    const filtered = getFilteredActivities(type, dateFilter);
    return filtered.reduce((sum, activity) => sum + activity.value, 0);
}

// ===== NAVIGATION =====

/**
 * Initialize navigation
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding section
            const sectionId = link.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
            
            // Update content when switching sections
            if (sectionId === 'dashboard') {
                updateDashboard();
            } else if (sectionId === 'activities') {
                renderActivitiesList();
            } else if (sectionId === 'goals') {
                updateGoalsSection();
            } else if (sectionId === 'reports') {
                updateReportsSection();
            }
        });
    });
}

// ===== THEME TOGGLE =====

/**
 * Initialize theme toggle
 */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('fittrack_theme') || 'light';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Toggle theme on click
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('fittrack_theme', currentTheme);
        
        // Update charts with new theme
        updateAllCharts();
    });
}

// ===== DASHBOARD =====

/**
 * Update dashboard statistics and charts
 */
function updateDashboard() {
    updateDashboardStats();
    updateWeeklyChart();
    updateDistributionChart();
}

/**
 * Update dashboard stat cards
 */
function updateDashboardStats() {
    // Calculate totals
    const todaySteps = calculateTotal('steps', 0);
    const weekWorkouts = calculateWorkoutsThisWeek();
    const todayCalories = calculateTotal('calories', 0);
    
    // Update displayed values
    document.getElementById('totalSteps').textContent = formatNumber(todaySteps);
    document.getElementById('totalWorkouts').textContent = weekWorkouts;
    document.getElementById('totalCalories').textContent = formatNumber(todayCalories);
    
    // Update goals
    document.getElementById('stepsGoal').textContent = formatNumber(goals.dailySteps);
    document.getElementById('workoutsGoal').textContent = goals.weeklyWorkouts;
    document.getElementById('caloriesGoal').textContent = formatNumber(goals.dailyCalories);
    
    // Update progress rings
    updateProgressRing('stepsProgress', 'stepsPercentage', todaySteps, goals.dailySteps);
    updateProgressRing('workoutsProgress', 'workoutsPercentage', weekWorkouts, goals.weeklyWorkouts);
    updateProgressRing('caloriesProgress', 'caloriesPercentage', todayCalories, goals.dailyCalories);
}

/**
 * Calculate workouts this week
 */
function calculateWorkoutsThisWeek() {
    const weekStart = getWeekStart();
    const workoutsThisWeek = activities.filter(activity => {
        return activity.type === 'workout' && new Date(activity.date) >= weekStart;
    });
    return workoutsThisWeek.length;
}

/**
 * Update circular progress ring
 */
function updateProgressRing(circleId, percentageId, current, goal) {
    const percentage = Math.min((current / goal) * 100, 100);
    const circle = document.getElementById(circleId);
    const percentageText = document.getElementById(percentageId);
    
    const circumference = 163.36; // 2 * PI * 26
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
    percentageText.textContent = Math.round(percentage) + '%';
}

/**
 * Update weekly activity chart
 */
function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Get last 7 days of data
    const last7Days = getLast7DaysData();
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#d1d5db' : '#6b7280';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.labels,
            datasets: [
                {
                    label: 'Steps',
                    data: last7Days.steps,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Calories',
                    data: last7Days.calories,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

/**
 * Get data for last 7 days
 */
function getLast7DaysData() {
    const labels = [];
    const steps = [];
    const calories = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Format label
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayName);
        
        // Get data for this day
        const dayActivities = activities.filter(a => a.date === dateStr);
        const daySteps = dayActivities.filter(a => a.type === 'steps').reduce((sum, a) => sum + a.value, 0);
        const dayCalories = dayActivities.filter(a => a.type === 'calories').reduce((sum, a) => sum + a.value, 0);
        
        steps.push(daySteps);
        calories.push(dayCalories);
    }
    
    return { labels, steps, calories };
}

/**
 * Update activity distribution chart
 */
function updateDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#d1d5db' : '#6b7280';
    
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    // Calculate totals for each type
    const stepsCount = activities.filter(a => a.type === 'steps').length;
    const workoutsCount = activities.filter(a => a.type === 'workout').length;
    const caloriesCount = activities.filter(a => a.type === 'calories').length;
    
    distributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Steps', 'Workouts', 'Calories'],
            datasets: [{
                data: [stepsCount, workoutsCount, caloriesCount],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15
                    }
                }
            }
        }
    });
}

/**
 * Update all charts (used when theme changes)
 */
function updateAllCharts() {
    updateWeeklyChart();
    updateDistributionChart();
    updateTrendsChart();
}

// ===== ACTIVITIES SECTION =====

/**
 * Initialize activities section
 */
function initActivities() {
    const addActivityBtn = document.getElementById('addActivityBtn');
    const cancelActivityBtn = document.getElementById('cancelActivityBtn');
    const activityFormElement = document.getElementById('activityFormElement');
    const filterType = document.getElementById('filterType');
    const activityDate = document.getElementById('activityDate');
    
    // Set default date to today
    activityDate.value = getTodayDate();
    
    // Show form
    addActivityBtn.addEventListener('click', () => {
        showActivityForm();
    });
    
    // Hide form
    cancelActivityBtn.addEventListener('click', () => {
        hideActivityForm();
    });
    
    // Handle form submission
    activityFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        handleActivitySubmit();
    });
    
    // Handle filter change
    filterType.addEventListener('change', () => {
        renderActivitiesList();
    });
    
    // Initial render
    renderActivitiesList();
}

/**
 * Show activity form
 */
function showActivityForm(activity = null) {
    const form = document.getElementById('activityForm');
    const formTitle = document.getElementById('formTitle');
    const activityId = document.getElementById('activityId');
    const activityType = document.getElementById('activityType');
    const activityValue = document.getElementById('activityValue');
    const activityDate = document.getElementById('activityDate');
    const activityNotes = document.getElementById('activityNotes');
    const saveBtn = document.getElementById('saveActivityBtn');
    
    if (activity) {
        // Edit mode
        formTitle.textContent = 'Edit Activity';
        activityId.value = activity.id;
        activityType.value = activity.type;
        activityValue.value = activity.value;
        activityDate.value = activity.date;
        activityNotes.value = activity.notes || '';
        saveBtn.textContent = 'Update Activity';
    } else {
        // Add mode
        formTitle.textContent = 'Add New Activity';
        activityId.value = '';
        activityType.value = '';
        activityValue.value = '';
        activityDate.value = getTodayDate();
        activityNotes.value = '';
        saveBtn.textContent = 'Save Activity';
    }
    
    // Clear errors
    clearFormErrors();
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide activity form
 */
function hideActivityForm() {
    const form = document.getElementById('activityForm');
    form.style.display = 'none';
    clearFormErrors();
    document.getElementById('activityFormElement').reset();
}

/**
 * Validate activity form
 */
function validateActivityForm() {
    let isValid = true;
    clearFormErrors();
    
    const activityType = document.getElementById('activityType');
    const activityValue = document.getElementById('activityValue');
    const activityDate = document.getElementById('activityDate');
    
    // Validate type
    if (!activityType.value) {
        showError('activityTypeError', 'Please select an activity type');
        isValid = false;
    }
    
    // Validate value
    if (!activityValue.value || activityValue.value <= 0) {
        showError('activityValueError', 'Please enter a valid value greater than 0');
        isValid = false;
    }
    
    // Validate date
    if (!activityDate.value) {
        showError('activityDateError', 'Please select a date');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Show form error message
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.textContent = '');
}

/**
 * Handle activity form submission
 */
function handleActivitySubmit() {
    if (!validateActivityForm()) {
        return;
    }
    
    const activityId = document.getElementById('activityId').value;
    const activityType = document.getElementById('activityType').value;
    const activityValue = parseInt(document.getElementById('activityValue').value);
    const activityDate = document.getElementById('activityDate').value;
    const activityNotes = document.getElementById('activityNotes').value;
    
    if (activityId) {
        // Update existing activity
        const index = activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
            activities[index] = {
                id: activityId,
                type: activityType,
                value: activityValue,
                date: activityDate,
                notes: activityNotes,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new activity
        activities.push({
            id: generateId(),
            type: activityType,
            value: activityValue,
            date: activityDate,
            notes: activityNotes,
            createdAt: new Date().toISOString()
        });
    }
    
    // Save and update UI
    saveToLocalStorage();
    renderActivitiesList();
    hideActivityForm();
    updateDashboard();
    updateGoalsSection();
}

/**
 * Render activities list
 */
function renderActivitiesList() {
    const listContainer = document.getElementById('activitiesList');
    const filterType = document.getElementById('filterType').value;
    
    // Get filtered activities
    let filtered = filterType === 'all' 
        ? activities 
        : activities.filter(a => a.type === filterType);
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 8V56M8 32H56" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No activities found</p>
                <p class="empty-state-subtitle">Try changing the filter or add a new activity!</p>
            </div>
        `;
        return;
    }
    
    // Render activities
    let html = '';
    filtered.forEach(activity => {
        const formattedDate = new Date(activity.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const valueLabel = getValueLabel(activity.type, activity.value);
        
        html += `
            <div class="activity-item" data-id="${activity.id}">
                <div class="activity-info">
                    <span class="activity-type-badge ${activity.type}">${activity.type}</span>
                    <div class="activity-details">
                        <div class="activity-value">${valueLabel}</div>
                        <div class="activity-date">${formattedDate}</div>
                        ${activity.notes ? `<div class="activity-notes">${activity.notes}</div>` : ''}
                    </div>
                </div>
                <div class="activity-actions">
                    <button class="icon-btn edit-activity" data-id="${activity.id}" aria-label="Edit activity">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete delete-activity" data-id="${activity.id}" aria-label="Delete activity">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4H16M14 4V15C14 15.5304 13.7893 16.0391 13.4142 16.4142C13.0391 16.7893 12.5304 17 12 17H6C5.46957 17 4.96086 16.7893 4.58579 16.4142C4.21071 16.0391 4 15.5304 4 15V4M6 4V2C6 1.73478 6.10536 1.48043 6.29289 1.29289C6.48043 1.10536 6.73478 1 7 1H11C11.2652 1 11.5196 1.10536 11.7071 1.29289C11.8946 1.48043 12 1.73478 12 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.edit-activity').forEach(btn => {
        btn.addEventListener('click', handleEditActivity);
    });
    
    document.querySelectorAll('.delete-activity').forEach(btn => {
        btn.addEventListener('click', handleDeleteActivity);
    });
}

/**
 * Get formatted value label
 */
function getValueLabel(type, value) {
    switch (type) {
        case 'steps':
            return formatNumber(value) + ' steps';
        case 'workout':
            return value + ' workout' + (value !== 1 ? 's' : '');
        case 'calories':
            return formatNumber(value) + ' cal';
        default:
            return value;
    }
}

/**
 * Handle edit activity
 */
function handleEditActivity(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const activity = activities.find(a => a.id === id);
    if (activity) {
        showActivityForm(activity);
    }
}

/**
 * Handle delete activity
 */
function handleDeleteActivity(e) {
    const id = e.currentTarget.getAttribute('data-id');
    
    if (confirm('Are you sure you want to delete this activity?')) {
        activities = activities.filter(a => a.id !== id);
        saveToLocalStorage();
        renderActivitiesList();
        updateDashboard();
        updateGoalsSection();
    }
}

// ===== GOALS SECTION =====

/**
 * Initialize goals section
 */
function initGoals() {
    // Set initial values
    document.getElementById('dailyStepsGoal').value = goals.dailySteps;
    document.getElementById('weeklyWorkoutsGoal').value = goals.weeklyWorkouts;
    document.getElementById('dailyCaloriesGoal').value = goals.dailyCalories;
    
    // Handle goal form submissions
    const goalForms = document.querySelectorAll('.goal-form');
    goalForms.forEach((form, index) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (index === 0) {
                // Daily steps goal
                goals.dailySteps = parseInt(document.getElementById('dailyStepsGoal').value);
            } else if (index === 1) {
                // Weekly workouts goal
                goals.weeklyWorkouts = parseInt(document.getElementById('weeklyWorkoutsGoal').value);
            } else if (index === 2) {
                // Daily calories goal
                goals.dailyCalories = parseInt(document.getElementById('dailyCaloriesGoal').value);
            }
            
            saveToLocalStorage();
            updateGoalsSection();
            updateDashboard();
            
            // Show success feedback
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Updated!';
            btn.style.backgroundColor = '#10b981';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        });
    });
    
    updateGoalsSection();
}

/**
 * Update goals section progress
 */
function updateGoalsSection() {
    // Calculate current progress
    const todaySteps = calculateTotal('steps', 0);
    const weekWorkouts = calculateWorkoutsThisWeek();
    const todayCalories = calculateTotal('calories', 0);
    
    // Update steps goal
    updateGoalProgress('dailySteps', todaySteps, goals.dailySteps);
    
    // Update workouts goal
    updateGoalProgress('weeklyWorkouts', weekWorkouts, goals.weeklyWorkouts);
    
    // Update calories goal
    updateGoalProgress('dailyCalories', todayCalories, goals.dailyCalories);
}

/**
 * Update individual goal progress
 */
function updateGoalProgress(goalType, current, target) {
    const percentage = Math.min((current / target) * 100, 100);
    
    const progressBar = document.getElementById(`${goalType}Progress`);
    const progressText = document.getElementById(`${goalType}ProgressText`);
    const goalText = document.getElementById(`${goalType}GoalText`);
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = formatNumber(current);
    }
    
    if (goalText) {
        goalText.textContent = formatNumber(target);
    }
}

// ===== REPORTS SECTION =====

/**
 * Update reports section
 */
function updateReportsSection() {
    update7DaySummary();
    updateTrendsChart();
    updateInsights();
}

/**
 * Update 7-day summary statistics
 */
function update7DaySummary() {
    const steps7Day = calculateTotal('steps', 7);
    const workouts7Day = activities.filter(a => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return a.type === 'workout' && new Date(a.date) >= cutoff;
    }).length;
    const calories7Day = calculateTotal('calories', 7);
    const avgSteps = Math.round(steps7Day / 7);
    
    document.getElementById('report7DaySteps').textContent = formatNumber(steps7Day);
    document.getElementById('report7DayWorkouts').textContent = workouts7Day;
    document.getElementById('report7DayCalories').textContent = formatNumber(calories7Day);
    document.getElementById('reportAvgSteps').textContent = formatNumber(avgSteps);
}

/**
 * Update 30-day trends chart
 */
function updateTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    const last30Days = getLast30DaysData();
    
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#d1d5db' : '#6b7280';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';
    
    if (trendsChart) {
        trendsChart.destroy();
    }
    
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.labels,
            datasets: [
                {
                    label: 'Steps',
                    data: last30Days.steps,
                    borderColor: 'rgba(99, 102, 241, 1)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Calories',
                    data: last30Days.calories,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: textColor,
                        maxTicksLimit: 10
                    },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

/**
 * Get data for last 30 days
 */
function getLast30DaysData() {
    const labels = [];
    const steps = [];
    const calories = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Format label (show date for every 5th day)
        const label = i % 5 === 0 ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
        labels.push(label);
        
        // Get data for this day
        const dayActivities = activities.filter(a => a.date === dateStr);
        const daySteps = dayActivities.filter(a => a.type === 'steps').reduce((sum, a) => sum + a.value, 0);
        const dayCalories = dayActivities.filter(a => a.type === 'calories').reduce((sum, a) => sum + a.value, 0);
        
        steps.push(daySteps);
        calories.push(dayCalories);
    }
    
    return { labels, steps, calories };
}

/**
 * Update insights and achievements
 */
function updateInsights() {
    const insightsList = document.getElementById('insightsList');
    const insights = [];
    
    // Check if user met their daily steps goal today
    const todaySteps = calculateTotal('steps', 0);
    if (todaySteps >= goals.dailySteps) {
        insights.push({
            type: 'success',
            title: 'Daily Steps Goal Achieved! 🎉',
            text: `You've reached ${formatNumber(todaySteps)} steps today!`
        });
    }
    
    // Check weekly workout goal
    const weekWorkouts = calculateWorkoutsThisWeek();
    if (weekWorkouts >= goals.weeklyWorkouts) {
        insights.push({
            type: 'success',
            title: 'Weekly Workout Goal Completed! 💪',
            text: `You've completed ${weekWorkouts} workouts this week!`
        });
    }
    
    // Check for consistent activity
    const last7Days = getLast7DaysData();
    const activeDays = last7Days.steps.filter(s => s > 0).length;
    if (activeDays >= 5) {
        insights.push({
            type: 'success',
            title: 'Great Consistency! 🔥',
            text: `You've been active ${activeDays} out of the last 7 days!`
        });
    }
    
    // Check if user needs motivation
    if (activities.length > 0 && todaySteps === 0 && weekWorkouts === 0) {
        insights.push({
            type: 'warning',
            title: 'Time to Get Moving! ⏰',
            text: 'You haven\'t logged any activity today. Let\'s get started!'
        });
    }
    
    // Render insights
    if (insights.length === 0) {
        insightsList.innerHTML = `
            <div class="empty-state">
                <p>Keep tracking to unlock insights!</p>
            </div>
        `;
    } else {
        let html = '';
        insights.forEach(insight => {
            html += `
                <div class="insight-item">
                    <div class="insight-icon ${insight.type}">
                        ${insight.type === 'success' ? '✓' : '!'}
                    </div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.text}</p>
                    </div>
                </div>
            `;
        });
        insightsList.innerHTML = html;
    }
}

// ===== EXPORT FUNCTIONALITY =====

/**
 * Initialize export functionality
 */
function initExport() {
    const exportBtn = document.getElementById('exportBtn');
    
    exportBtn.addEventListener('click', () => {
        exportReport();
    });
}

/**
 * Export fitness report as CSV
 */
function exportReport() {
    // Prepare CSV content
    let csv = 'Date,Type,Value,Notes\n';
    
    // Sort activities by date
    const sorted = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(activity => {
        const notes = activity.notes ? activity.notes.replace(/,/g, ';') : '';
        csv += `${activity.date},${activity.type},${activity.value},"${notes}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-report-${getTodayDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    alert('Report exported successfully!');
}

// ===== INITIALIZATION =====

/**
 * Initialize the application
 */
function init() {
    initNavigation();
    initTheme();
    initActivities();
    initGoals();
    initExport();
    
    // Initial update
    updateDashboard();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}