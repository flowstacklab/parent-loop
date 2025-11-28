// Global variables
let currentTab = 'favorites';
let currentMenuType = 'nido';
let currentActivityGroup = 'nido';
let editingCombinationId = null;
let combinations = [];
let MENU_NIDO = {};
let MENU_INFANZIA = {};
let ACTIVITIES = {};
let WEEK_1_MONDAY = '';
let ACTIVITY_MOMENTS = ['Ingresso', 'Attività 1', 'Attività 2', 'Pranzo', 'Riposo', 'Merenda', 'Uscita'];

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getCurrentDay(date) {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[date.getDay()];
}

function getTomorrowDay(date) {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[(date.getDay() + 1) % 7];
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

function getWeekNumber(date) {
    const startDate = new Date(WEEK_1_MONDAY);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weekNum = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(4, weekNum));
}

// Load week configuration
async function loadWeekConfig() {
    try {
        const response = await fetch('week-config.txt');
        const text = await response.text();
        WEEK_1_MONDAY = text.trim();
    } catch (error) {
        console.error('Error loading week config:', error);
        // Default to today if config fails
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        WEEK_1_MONDAY = monday.toISOString().split('T')[0];
    }
}

// Load menu data
async function loadMenuData() {
    try {
        const [nidoResponse, infanziaResponse] = await Promise.all([
            fetch('menu-nido.txt'),
            fetch('menu-infanzia.txt')
        ]);
        
        const nidoText = await nidoResponse.text();
        const infanziaText = await infanziaResponse.text();
        
        MENU_NIDO = parseMenuData(nidoText);
        MENU_INFANZIA = parseMenuData(infanziaText);
    } catch (error) {
        console.error('Error loading menu data:', error);
    }
}

// Parse menu data from text format
function parseMenuData(text) {
    const menu = {};
    const lines = text.split('\n');
    
    // Day mapping (1=Lunedì, 2=Martedì, etc.)
    const dayMap = {
        '1': 'Lunedì',
        '2': 'Martedì', 
        '3': 'Mercoledì',
        '4': 'Giovedì',
        '5': 'Venerdì'
    };
    
    for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim() === '' || line.startsWith('#')) {
            continue;
        }
        
        // Parse format: settimana|giorno|primo|secondo|frutta
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 5) {
            const weekNum = parseInt(parts[0]);
            const dayNum = parts[1];
            const primo = parts[2];
            const secondo = parts[3];
            const frutta = parts[4];
            
            if (weekNum >= 1 && weekNum <= 4 && dayMap[dayNum]) {
                if (!menu[weekNum]) {
                    menu[weekNum] = {};
                }
                
                menu[weekNum][dayMap[dayNum]] = {
                    primo: primo,
                    secondo: secondo,
                    frutta: frutta
                };
            }
        }
    }
    
    return menu;
}

// Load activities data
async function loadActivitiesData() {
    try {
        const response = await fetch('activities.txt');
        const text = await response.text();
        ACTIVITIES = parseActivitiesData(text);
    } catch (error) {
        console.error('Error loading activities data:', error);
    }
}

// Parse activities data from text format
function parseActivitiesData(text) {
    const activities = {};
    const lines = text.split('\n');
    
    // Day mapping (1=Lunedì, 2=Martedì, etc.)
    const dayMap = {
        '1': 'Lunedì',
        '2': 'Martedì', 
        '3': 'Mercoledì',
        '4': 'Giovedì',
        '5': 'Venerdì',
        '6': 'Sabato'
    };
    
    for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim() === '' || line.startsWith('#')) {
            continue;
        }
        
        // Parse format: gruppo|giorno|attivita_mattino|attivita_pomeriggio
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 4) {
            const group = parts[0];
            const dayNum = parts[1];
            const activity1 = parts[2];
            const activity2 = parts[3];
            
            if (dayMap[dayNum]) {
                if (!activities[group]) {
                    activities[group] = {};
                }
                
                // Create moments array with 7 items (matching ACTIVITY_MOMENTS)
                const moments = [
                    activity1 === '-' ? 'Attività libera' : activity1,  // Ingresso
                    activity1 === '-' ? 'Attività libera' : activity1,  // Attività 1
                    activity2 === '-' ? 'Attività libera' : activity2,  // Attività 2
                    'Pranzo',                                           // Pranzo
                    'Riposo',                                           // Riposo
                    'Merenda',                                          // Merenda
                    'Uscita'                                            // Uscita
                ];
                
                activities[group][dayMap[dayNum]] = moments;
            }
        }
    }
    
    return activities;
}

// Load all data files
async function loadAllDataFiles() {
    await Promise.all([
        loadMenuData(),
        loadActivitiesData()
    ]);
}

// Combinations management
function loadCombinations() {
    const saved = localStorage.getItem('combinations');
    if (saved) {
        combinations = JSON.parse(saved);
    }
}

function saveCombinations() {
    localStorage.setItem('combinations', JSON.stringify(combinations));
}

// Display functions
function displayQuickView() {
    const quickView = document.getElementById('quick-view');
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentDay = getCurrentDay(today);
    
    quickView.innerHTML = '';
    
    const quickViewHeader = document.createElement('div');
    quickViewHeader.className = `quick-view-header week-${currentWeek}`;
    quickViewHeader.innerHTML = `<h2>Settimana ${currentWeek} - ${currentMenuType === 'nido' ? 'Piccoli' : 'Grandi'}</h2>`;
    quickView.appendChild(quickViewHeader);
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';
    
    // Show days in order (Monday to Saturday)
    const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const menuData = currentMenuType === 'nido' ? MENU_NIDO : MENU_INFANZIA;
    
    for (const day of dayOrder) {
        const dayMenu = menuData[currentWeek] && menuData[currentWeek][day];
        if (dayMenu) {
            const dayCard = createDayCard(day, dayMenu, currentDay, getTomorrowDay(today));
            menuContainer.appendChild(dayCard);
        }
    }
    
    quickView.appendChild(menuContainer);
}

function createDayCard(day, menu, currentDay, tomorrowDay) {
    const card = document.createElement('div');
    let cardClass = 'day-card';
    let badgeHTML = '';
    
    if (day === currentDay) {
        cardClass += ' today';
        badgeHTML = '<div class="day-badge today-badge">OGGI</div>';
    } else if (day === tomorrowDay) {
        cardClass += ' tomorrow';
        badgeHTML = '<div class="day-badge tomorrow-badge">DOMANI</div>';
    }
    
    card.className = cardClass;
    
    let menuHTML = '';
    if (menu.primo) {
        menuHTML += `
            <div class="meal">
                <h3>Primo</h3>
                <p>${menu.primo}</p>
            </div>`;
    }
    if (menu.secondo) {
        menuHTML += `
            <div class="meal">
                <h3>Secondo</h3>
                <p>${menu.secondo}</p>
            </div>`;
    }
    if (menu.contorno) {
        menuHTML += `
            <div class="meal">
                <h3>Contorno</h3>
                <p>${menu.contorno}</p>
            </div>`;
    }
    if (menu.frutta) {
        menuHTML += `
            <div class="meal">
                <h3>Frutta</h3>
                <p>${menu.frutta}</p>
            </div>`;
    }
    
    card.innerHTML = `
        ${badgeHTML}
        <h2>
            ${day}
            <span class="day-date"></span>
        </h2>
        ${menuHTML}
    `;
    
    return card;
}

function displayAllWeeks() {
    const weeksContent = document.getElementById('weeks-content');
    weeksContent.innerHTML = '';
    
    // Display all 4 weeks
    for (let week = 1; week <= 4; week++) {
        const weekSection = createWeekSection(week);
        weeksContent.appendChild(weekSection);
    }
    
    // Setup intersection observer after content is loaded
    setTimeout(setupWeekObserver, 100);
}

function createWeekSection(weekNum) {
    const section = document.createElement('div');
    section.className = 'week-section';
    section.id = `week-${weekNum}`;
    section.setAttribute('data-week', weekNum);
    
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentDay = getCurrentDay(today);
    
    if (weekNum === currentWeek) {
        section.classList.add('current-week');
    }
    
    const weekTitle = document.createElement('h2');
    weekTitle.className = 'week-title';
    weekTitle.innerHTML = `Settimana ${weekNum}`;
    if (weekNum === currentWeek) {
        weekTitle.innerHTML += ' <span class="current-badge">Corrente</span>';
    }
    section.appendChild(weekTitle);
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container compact';
    
    // Show days in order (Monday to Saturday)
    const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const menuData = currentMenuType === 'nido' ? MENU_NIDO : MENU_INFANZIA;
    
    for (const day of dayOrder) {
        const dayMenu = menuData[weekNum] && menuData[weekNum][day];
        if (dayMenu) {
            const dayCard = createDayCard(day, dayMenu, currentDay, getTomorrowDay(today));
            menuContainer.appendChild(dayCard);
        }
    }
    
    section.appendChild(menuContainer);
    return section;
}

// Mark current week in timeline (permanent indicator)
function markCurrentWeekInTimeline(currentWeekNum) {
    document.querySelectorAll('.timeline-item').forEach(item => {
        const weekNum = parseInt(item.getAttribute('data-week'));
        if (weekNum === currentWeekNum) {
            item.classList.add('current');
        } else {
            item.classList.remove('current');
        }
    });
}

function toggleAllWeeks() {
    const quickView = document.getElementById('quick-view');
    const allWeeksContainer = document.getElementById('all-weeks-container');
    const btnAllWeeks = document.getElementById('btn-all-weeks');
    
    if (allWeeksContainer.classList.contains('hidden')) {
        // Show all weeks
        quickView.classList.add('hidden');
        allWeeksContainer.classList.remove('hidden');
        
        btnAllWeeks.textContent = 'Nascondi';
        btnAllWeeks.classList.remove('btn-secondary');
        btnAllWeeks.classList.add('btn-primary');
        
        displayAllWeeks();
    } else {
        // Hide all weeks, show quick view
        quickView.classList.remove('hidden');
        allWeeksContainer.classList.add('hidden');
        
        btnAllWeeks.textContent = 'Tutte le Settimane';
        btnAllWeeks.classList.remove('btn-primary');
        btnAllWeeks.classList.add('btn-secondary');
    }
}

// Setup Intersection Observer to track which week is visible
function setupWeekObserver() {
    const options = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const weekNum = entry.target.getAttribute('data-week');
                updateTimeline(parseInt(weekNum));
            }
        });
    }, options);

    // Observe all week sections
    document.querySelectorAll('.week-section').forEach(section => {
        observer.observe(section);
    });
}

// Update timeline to highlight active week
function updateTimeline(weekNum) {
    document.querySelectorAll('.timeline-item').forEach(item => {
        if (parseInt(item.getAttribute('data-week')) === weekNum) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Scroll to specific week
function scrollToWeek(weekNum, smooth = true) {
    const weekElement = document.getElementById(`week-${weekNum}`);
    if (weekElement) {
        const offset = 80; // Offset for sticky timeline
        const elementPosition = weekElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: smooth ? 'smooth' : 'auto'
        });

        updateTimeline(weekNum);
    }
}

// Switch between tabs (Favorites / Menu / Activities / Preferences)
async function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked tab
    const clickedTab = document.querySelector(`[data-tab="${tab}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Get all sections
    const favoritesSection = document.getElementById('favorites-section');
    const menuSection = document.getElementById('menu-section');
    const activitiesSection = document.getElementById('activities-section');
    
    // Hide all sections
    favoritesSection.classList.add('hidden');
    menuSection.classList.add('hidden');
    activitiesSection.classList.add('hidden');
    
    // Show selected section
    if (tab === 'favorites') {
        favoritesSection.classList.remove('hidden');
        displayFavorites();
    } else if (tab === 'menu') {
        menuSection.classList.remove('hidden');
        // Ensure data is loaded before displaying
        if (Object.keys(MENU_NIDO).length === 0 || Object.keys(MENU_INFANZIA).length === 0) {
            await loadMenuData();
        }
        displayQuickView();
    } else if (tab === 'activities') {
        activitiesSection.classList.remove('hidden');
        // Ensure data is loaded before displaying
        if (Object.keys(ACTIVITIES).length === 0) {
            await loadActivitiesData();
        }
        displayActivities();
    }
}

// Select menu type (Nido / Infanzia)
function selectMenuType(type) {
    currentMenuType = type;
    
    // Update selector buttons
    document.querySelectorAll('#menu-section .selector-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const clickedBtn = document.querySelector(`[data-menu-type="${type}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Refresh menu display
    const allWeeksContainer = document.getElementById('all-weeks-container');
    if (allWeeksContainer.classList.contains('hidden')) {
        displayQuickView();
    } else {
        displayAllWeeks();
    }
}

// Select activity group
function selectActivityGroup(group) {
    currentActivityGroup = group;
    
    // Update selector buttons
    document.querySelectorAll('#activities-section .selector-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const clickedBtn = document.querySelector(`[data-activity-group="${group}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Refresh activities display
    displayActivities();
}

// Display activities for selected group
function displayActivities() {
    const today = new Date();
    const currentDay = getCurrentDay(today);
    const tomorrowDay = getTomorrowDay(today);
    
    const activitiesContent = document.getElementById('activities-content');
    activitiesContent.innerHTML = '';
    
    const activities = ACTIVITIES[currentActivityGroup];
    
    if (!activities || Object.keys(activities).length === 0) {
        activitiesContent.innerHTML = '<p style="text-align: center; color: #999;">Nessuna attività disponibile per questo gruppo.</p>';
        return;
    }
    
    const activityWeek = document.createElement('div');
    activityWeek.className = 'activity-week';
    
    const activitiesGrid = document.createElement('div');
    activitiesGrid.className = 'activities-grid';
    
    // Show days in order (Monday to Saturday)
    const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    for (const day of dayOrder) {
        const moments = activities[day];
        if (moments) {
            const dayCard = createActivityDayCard(day, moments, currentDay, tomorrowDay);
            activitiesGrid.appendChild(dayCard);
        }
    }
    
    activityWeek.appendChild(activitiesGrid);
    activitiesContent.appendChild(activityWeek);
}

// Create activity day card
function createActivityDayCard(day, moments, currentDay, tomorrowDay) {
    const card = document.createElement('div');
    let cardClass = 'activity-day-card';
    
    if (day === currentDay) {
        cardClass += ' today';
    } else if (day === tomorrowDay) {
        cardClass += ' tomorrow';
    }
    
    card.className = cardClass;
    
    let momentsHTML = '';
    for (let i = 0; i < moments.length && i < ACTIVITY_MOMENTS.length; i++) {
        momentsHTML += `
            <div class="activity-moment">
                <div class="activity-moment-title">${ACTIVITY_MOMENTS[i]}</div>
                <div class="activity-moment-content">${moments[i]}</div>
            </div>`;
    }
    
    card.innerHTML = `
        <h3>${day}</h3>
        ${momentsHTML}
    `;
    
    return card;
}

// Open combination modal
function openCombinationModal(combinationId = null) {
    const modal = document.getElementById('combination-modal');
    const form = document.getElementById('combination-form');
    
    if (combinationId) {
        // Edit mode
        editingCombinationId = combinationId;
        const combination = combinations.find(c => c.id === combinationId);
        
        if (combination) {
            document.getElementById('combination-name').value = combination.name;
            document.getElementById('combination-menu').value = combination.menuType;
            document.getElementById('combination-activity').value = combination.activityGroup;
        }
    } else {
        // Add mode
        editingCombinationId = null;
        form.reset();
    }
    
    modal.classList.add('active');
}

// Close combination modal
function closeCombinationModal() {
    const modal = document.getElementById('combination-modal');
    modal.classList.remove('active');
    editingCombinationId = null;
}

// Delete combination
function deleteCombination(combinationId) {
    if (confirm('Sei sicuro di voler eliminare questa combinazione?')) {
        combinations = combinations.filter(c => c.id !== combinationId);
        saveCombinations();
        
        // Update favorites if visible
        if (currentTab === 'favorites') {
            displayFavorites();
        }
    }
}

// Move combination up
function moveCombinationUp(combinationId) {
    const index = combinations.findIndex(c => c.id === combinationId);
    if (index > 0) {
        // Swap with previous
        [combinations[index - 1], combinations[index]] = [combinations[index], combinations[index - 1]];
        saveCombinations();
        
        // Update favorites if visible
        if (currentTab === 'favorites') {
            displayFavorites();
        }
    }
}

// Move combination down
function moveCombinationDown(combinationId) {
    const index = combinations.findIndex(c => c.id === combinationId);
    if (index >= 0 && index < combinations.length - 1) {
        // Swap with next
        [combinations[index], combinations[index + 1]] = [combinations[index + 1], combinations[index]];
        saveCombinations();
        
        // Update favorites if visible
        if (currentTab === 'favorites') {
            displayFavorites();
        }
    }
}

// Display favorites (combined daily view of menu and activities)
function displayFavorites() {
    const container = document.getElementById('favorites-content');
    container.innerHTML = '';
    
    if (combinations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <button class="add-combination-btn" onclick="openCombinationModal()" style="display: inline-block;">
                    ➕ Aggiungi
                </button>
            </div>
        `;
        return;
    }
    
    const today = new Date();
    const currentDay = getCurrentDay(today);
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'favorites-tabs-container';
    
    // Create tabs bar
    const tabsBar = document.createElement('div');
    tabsBar.className = 'favorites-tabs';
    
    // Create tabs
    combinations.forEach((combination, index) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = `favorite-tab-btn ${index === 0 ? 'active' : ''}`;
        tabBtn.textContent = `⭐ ${combination.name}`;
        tabBtn.onclick = () => switchFavoriteTab(combination.id);
        tabsBar.appendChild(tabBtn);
    });
    
    tabsContainer.appendChild(tabsBar);
    
    // Create tab contents
    combinations.forEach((combination, index) => {
        const tabContent = document.createElement('div');
        tabContent.className = `favorites-tab-content ${index === 0 ? 'active' : ''}`;
        tabContent.id = `favorite-tab-${combination.id}`;
        
        // Determine if toggle should be shown (only Monday-Friday)
        const dayIndex = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'].indexOf(currentDay);
        const showToggle = dayIndex >= 0 && dayIndex < 4; // Monday to Thursday
        
        // Create toggle HTML
        const toggleHTML = showToggle ? `
            <div class="day-toggle">
                <button class="day-toggle-btn active" onclick="toggleFavoriteDay('${combination.id}', 'today')">
                    📅 Oggi
                </button>
                <button class="day-toggle-btn" onclick="toggleFavoriteDay('${combination.id}', 'tomorrow')">
                    📅 Domani
                </button>
            </div>
        ` : '';
        
        tabContent.innerHTML = `
            <div class="favorite-combination">
                <button class="favorite-delete-btn" onclick="deleteCombination('${combination.id}')" title="Elimina">×</button>
                ${toggleHTML}
                <div id="day-content-${combination.id}">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;
        
        tabsContainer.appendChild(tabContent);
    });
    
    container.appendChild(tabsContainer);
    
    // Add button at the end
    const addButtonAtEnd = document.createElement('div');
    addButtonAtEnd.style.cssText = 'text-align: center; margin-top: 2rem;';
    addButtonAtEnd.innerHTML = '<button class="add-combination-btn" onclick="openCombinationModal()">➕ Aggiungi</button>';
    container.appendChild(addButtonAtEnd);
    
    // Load content for all favorites
    combinations.forEach(combination => {
        loadFavoriteDayContent(combination.id, 'today');
    });
}

// Switch between favorite tabs
function switchFavoriteTab(combinationId) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.favorite-tab-btn');
    const tabContents = document.querySelectorAll('.favorites-tab-content');
    
    tabButtons.forEach((btn, index) => {
        const combination = combinations[index];
        if (combination && combination.id === combinationId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab contents
    tabContents.forEach(content => {
        if (content.id === `favorite-tab-${combinationId}`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Load content for a specific day in favorites
function loadFavoriteDayContent(combinationId, dayType) {
    const combination = combinations.find(c => c.id === combinationId);
    if (!combination) return;
    
    const today = new Date();
    const currentDay = getCurrentDay(today);
    const currentWeek = getWeekNumber(today);
    const isWeekendDay = isWeekend(today);
    
    // Calculate display day and week
    let displayDay = currentDay;
    let displayWeek = currentWeek;
    let dayLabel = '';
    
    if (isWeekendDay) {
        // If Sunday, show next Monday (tomorrow)
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + 1);
        displayWeek = getWeekNumber(nextMonday);
        displayDay = 'Lunedì';
        dayLabel = 'Domani - Lunedì';
    } else if (dayType === 'tomorrow') {
        // Get tomorrow
        const tomorrow = getTomorrowDay(today);
        const tomorrowDate = new Date(today);
        tomorrowDate.setDate(today.getDate() + 1);
        displayWeek = getWeekNumber(tomorrowDate);
        displayDay = tomorrow;
        dayLabel = `Domani - ${tomorrow}`;
    } else {
        // Today
        dayLabel = displayDay === 'Sabato' ? 'Oggi - Sabato' : `Oggi - ${displayDay}`;
    }
    
    // Get menu data
    const menuData = combination.menuType === 'nido' ? MENU_NIDO : MENU_INFANZIA;
    const dayMenu = (displayDay !== 'Sabato') ? (menuData[displayWeek] && menuData[displayWeek][displayDay]) : null;
    
    // Get activities data
    const dayActivities = ACTIVITIES[combination.activityGroup] && ACTIVITIES[combination.activityGroup][displayDay];
    
    // Create menu HTML (solo se non è sabato)
    let menuHTML = '';
    if (dayMenu) {
        menuHTML = `
            <div class="favorite-menu-items">
                <div class="meal">
                    <h4>🍝 Primo</h4>
                    <p>${dayMenu.primo}</p>
                </div>
                <div class="meal">
                    <h4>🍖 Secondo</h4>
                    <p>${dayMenu.secondo}</p>
                </div>`;
        
        if (dayMenu.contorno) {
            menuHTML += `
                <div class="meal">
                    <h4>🥗 Contorno</h4>
                    <p>${dayMenu.contorno}</p>
                </div>`;
        }
        
        menuHTML += `
                <div class="meal">
                    <h4>🍎 Frutta</h4>
                    <p>${dayMenu.frutta}</p>
                </div>
            </div>`;
    } else {
        menuHTML = '<p class="no-data-message">Dati menu non disponibili</p>';
    }
    
    // Create activities HTML
    let activitiesHTML = '';
    if (dayActivities && dayActivities.length > 0) {
        activitiesHTML = '<div class="favorite-activities-list">';
        for (let i = 0; i < dayActivities.length && i < ACTIVITY_MOMENTS.length; i++) {
            activitiesHTML += `
                <div class="activity-moment">
                    <div class="activity-moment-title">${ACTIVITY_MOMENTS[i]}</div>
                    <div class="activity-moment-content">${dayActivities[i]}</div>
                </div>`;
        }
        activitiesHTML += '</div>';
    } else {
        activitiesHTML = '<p class="no-data-message">Dati attività non disponibili</p>';
    }
    
    // Update content
    const contentDiv = document.getElementById(`day-content-${combinationId}`);
    if (contentDiv) {
        // Se è sabato, mostra solo attività (senza menu)
        if (displayDay === 'Sabato') {
            contentDiv.innerHTML = `
                <div class="favorite-activities-section" style="max-width: 800px; margin: 0 auto;">
                    <div class="favorite-section-title">
                        <span>🎨 Attività del Giorno</span>
                    </div>
                    ${activitiesHTML}
                </div>
            `;
        } else {
            // Altri giorni: mostra menu e attività
            contentDiv.innerHTML = `
                <div class="favorite-day-view">
                    <div class="favorite-menu-section">
                        <div class="favorite-section-title">
                            <span>🍽️ Menu del Giorno</span>
                        </div>
                        ${menuHTML}
                    </div>
                    <div class="favorite-activities-section">
                        <div class="favorite-section-title">
                            <span>🎨 Attività del Giorno</span>
                        </div>
                        ${activitiesHTML}
                    </div>
                </div>
            `;
        }
    }
}

// Toggle between today and tomorrow in favorites
function toggleFavoriteDay(combinationId, dayType) {
    // Update button states
    const card = document.querySelector(`#favorite-tab-${combinationId} .favorite-combination`);
    if (card) {
        const buttons = card.querySelectorAll('.day-toggle-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if ((dayType === 'today' && btn.textContent.includes('Oggi')) ||
                (dayType === 'tomorrow' && btn.textContent.includes('Domani'))) {
                btn.classList.add('active');
            }
        });
    }
    
    // Load content for selected day
    loadFavoriteDayContent(combinationId, dayType);
}

// Initialize app: load menu and display
async function initApp() {
    await loadWeekConfig();
    loadCombinations();
    await loadAllDataFiles();
    displayFavorites(); // Mostra preferiti invece di quick view
    
    // Display configured date in footer
    const configDateElement = document.getElementById('config-date');
    if (configDateElement) {
        const startDate = new Date(WEEK_1_MONDAY);
        const formattedDate = startDate.toLocaleDateString('it-IT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        configDateElement.textContent = formattedDate;
    }
    
    // Mark current week in timeline
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    markCurrentWeekInTimeline(currentWeek);
}

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', async function() {
            const tabName = this.getAttribute('data-tab');
            await switchTab(tabName);
        });
    });
    
    // Menu type selector
    document.querySelectorAll('#menu-section .selector-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const menuType = this.getAttribute('data-menu-type');
            selectMenuType(menuType);
        });
    });
    
    // Activity group selector
    document.querySelectorAll('#activities-section .selector-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const activityGroup = this.getAttribute('data-activity-group');
            selectActivityGroup(activityGroup);
        });
    });
    
    // All weeks button
    const btnAllWeeks = document.getElementById('btn-all-weeks');
    if (btnAllWeeks) {
        btnAllWeeks.addEventListener('click', toggleAllWeeks);
    }
    
    // Timeline navigation
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', function() {
            const weekNum = parseInt(this.getAttribute('data-week'));
            scrollToWeek(weekNum);
        });
    });
    
    // Combination form
    const form = document.getElementById('combination-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('combination-name').value.trim();
            const menuType = document.getElementById('combination-menu').value;
            const activityGroup = document.getElementById('combination-activity').value;
            
            if (editingCombinationId) {
                // Update existing combination
                const index = combinations.findIndex(c => c.id === editingCombinationId);
                if (index !== -1) {
                    combinations[index] = {
                        ...combinations[index],
                        name,
                        menuType,
                        activityGroup
                    };
                }
            } else {
                // Add new combination
                combinations.push({
                    id: generateId(),
                    name,
                    menuType,
                    activityGroup
                });
            }
            
            saveCombinations();
            closeCombinationModal();
            
            // Update favorites if visible
            if (currentTab === 'favorites') {
                displayFavorites();
            }
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-btn.cancel').forEach(btn => {
        btn.addEventListener('click', closeCombinationModal);
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('combination-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeCombinationModal();
            }
        });
    }
    
    // Start app
    initApp();
});