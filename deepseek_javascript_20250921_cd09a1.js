document.addEventListener('DOMContentLoaded', function() {
    // Calendar elements
    const calendarEl = document.getElementById('calendar');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const currencySelect = document.getElementById('currency-select');
    const updateBtn = document.getElementById('update-btn');
    const exportBtn = document.getElementById('export-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveBtn = document.getElementById('save-btn');
    const modalTitle = document.getElementById('modal-title');
    const dateLabel = document.getElementById('date-label');
    const plInput = document.getElementById('pl-input');
    
    // Currency data (exchange rates relative to USD)
    const exchangeRates = {
        USD: { rate: 1, symbol: '$', code: 'USD' },
        EUR: { rate: 0.93, symbol: '€', code: 'EUR' },
        GBP: { rate: 0.80, symbol: '£', code: 'GBP' },
        JPY: { rate: 151.86, symbol: '¥', code: 'JPY' },
        CAD: { rate: 1.36, symbol: 'C$', code: 'CAD' },
        AUD: { rate: 1.53, symbol: 'A$', code: 'AUD' },
        CHF: { rate: 0.90, symbol: 'Fr', code: 'CHF' },
        CNY: { rate: 7.23, symbol: '¥', code: 'CNY' },
        INR: { rate: 83.33, symbol: '₹', code: 'INR' }
    };
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('tradingCalendarCurrentUser'));
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Load user data
    let plData = JSON.parse(localStorage.getItem(`tradingPlData_${currentUser.email}`)) || {};
    let currentDateKey = '';
    let currentCurrency = 'USD';
    
    // Initialize with current month
    const now = new Date();
    monthSelect.value = now.getMonth();
    yearSelect.value = now.getFullYear();
    
    generateCalendar(now.getMonth(), now.getFullYear());
    
    // Update calendar when button is clicked
    updateBtn.addEventListener('click', function() {
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        generateCalendar(month, year);
    });
    
    // Change currency when selector changes
    currencySelect.addEventListener('change', function() {
        currentCurrency = currencySelect.value;
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearSelect.value);
        generateCalendar(month, year);
    });
    
    // Export data when button is clicked
    exportBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(plData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'trading-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('tradingCalendarCurrentUser');
        window.location.href = 'index.html';
    });
    
    // Close modal events
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Save value from modal
    saveBtn.addEventListener('click', function() {
        const inputValue = plInput.value.trim();
        if (inputValue) {
            // Parse the input value
            const newValue = parseFloat(inputValue);
            if(!isNaN(newValue)) {
                plData[currentDateKey] = newValue;
                localStorage.setItem(`tradingPlData_${currentUser.email}`, JSON.stringify(plData));
                
                // Update the display
                const month = parseInt(monthSelect.value);
                const year = parseInt(yearSelect.value);
                generateCalendar(month, year);
                updateSummary();
                
                closeModal();
            } else {
                alert('Please enter a valid number');
            }
        }
    });
    
    // Close modal when clicking outside
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    function generateCalendar(month, year) {
        // Clear existing calendar cells (excluding headers)
        while(calendarEl.childNodes.length > 7) {
            calendarEl.removeChild(calendarEl.lastChild);
        }
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Create empty cells for days before the first day of the month
        for(let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('calendar-cell', 'empty');
            calendarEl.appendChild(emptyCell);
        }
        
        // Create cells for each day of the month
        for(let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.classList.add('calendar-cell');
            
            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            cell.appendChild(dayNumber);
            
            // Check if we have P&L data for this day
            const dateKey = `${year}-${month}-${day}`;
            if(plData[dateKey] !== undefined) {
                addPlValue(cell, dateKey, plData[dateKey]);
            }
            
            // Make cell clickable to open modal
            cell.addEventListener('click', function() {
                openModal(dateKey, day, month, year);
            });
            
            calendarEl.appendChild(cell);
        }
        
        // Update summary
        updateSummary();
    }
    
    function addPlValue(cell, dateKey, value) {
        const plValue = document.createElement('div');
        plValue.classList.add('pl-value');
        
        // Convert value to selected currency
        const convertedValue = value * exchangeRates[currentCurrency].rate;
        const absValue = Math.abs(convertedValue);
        const symbol = exchangeRates[currentCurrency].symbol;
        
        if(value > 0) {
            plValue.classList.add('positive');
            plValue.textContent = `+${symbol}${formatCurrency(absValue)}`;
            cell.classList.add('profit-box');
        } else if(value < 0) {
            plValue.classList.add('negative');
            plValue.textContent = `-${symbol}${formatCurrency(absValue)}`;
            cell.classList.add('loss-box');
        } else {
            plValue.classList.add('neutral');
            plValue.textContent = `${symbol}0.00`;
        }
        
        cell.appendChild(plValue);
    }
    
    function formatCurrency(value) {
        // Format number with appropriate decimal places
        if (currentCurrency === 'JPY' || currentCurrency === 'INR') {
            return value.toFixed(0); // No decimal places for these currencies
        } else {
            return value.toFixed(2); // Two decimal places for others
        }
    }
    
    function openModal(dateKey, day, month, year) {
        currentDateKey = dateKey;
        
        // Format date for display
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        const dateStr = `${monthNames[month]} ${day}, ${year}`;
        
        // Update modal content
        modalTitle.textContent = `Edit P&L Value`;
        dateLabel.textContent = `Date: ${dateStr}`;
        
        // Set current value if exists
        const currentValue = plData[dateKey];
        plInput.value = currentValue !== undefined ? currentValue : '';
        plInput.focus();
        
        // Show modal
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
    }
    
    function updateSummary() {
        let totalProfit = 0;
        let totalLoss = 0;
        let tradingDays = 0;
        
        // Calculate totals from all data
        for(const dateKey in plData) {
            const value = plData[dateKey];
            if(value > 0) {
                totalProfit += value;
                tradingDays++;
            } else if(value < 0) {
                totalLoss += Math.abs(value);
                tradingDays++;
            }
        }
        
        // Convert to selected currency
        const convertedProfit = totalProfit * exchangeRates[currentCurrency].rate;
        const convertedLoss = totalLoss * exchangeRates[currentCurrency].rate;
        const convertedNet = convertedProfit - convertedLoss;
        
        const symbol = exchangeRates[currentCurrency].symbol;
        
        document.getElementById('total-profit').textContent = `+${symbol}${formatCurrency(convertedProfit)}`;
        document.getElementById('total-loss').textContent = `-${symbol}${formatCurrency(convertedLoss)}`;
        document.getElementById('net-pl').textContent = `${symbol}${formatCurrency(convertedNet)}`;
        document.getElementById('trading-days').textContent = tradingDays;
        
        // Color net P&L based on value
        const netEl = document.getElementById('net-pl');
        netEl.classList.remove('profit', 'loss');
        if(convertedNet > 0) {
            netEl.classList.add('profit');
        } else if(convertedNet < 0) {
            netEl.classList.add('loss');
        }
    }
});