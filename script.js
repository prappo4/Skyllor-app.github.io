// Telegram Web App initialization
let tg = window.Telegram.WebApp;
tg.expand();

// User data structure
let userData = {
    userId: tg.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000000),
    username: tg.initDataUnsafe?.user?.username || 'User',
    firstName: tg.initDataUnsafe?.user?.first_name || 'User',
    spinsToday: 0,
    totalSpins: 0,
    balance: 0,
    totalWithdrawn: 0,
    referrals: 0,
    lastSpinDate: null,
    spinCooldown: null,
    withdrawalHistory: [],
    lastResetDate: new Date().toDateString()
};

// Load user data from localStorage
function loadUserData() {
    const saved = localStorage.getItem('skyllorUserData');
    if (saved) {
        const savedData = JSON.parse(saved);
        userData = { ...userData, ...savedData };
        
        // Reset daily spins if it's a new day
        const today = new Date().toDateString();
        if (userData.lastResetDate !== today) {
            userData.spinsToday = 0;
            userData.lastResetDate = today;
            userData.spinCooldown = null;
        }
    }
    updateUI();
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('skyllorUserData', JSON.stringify(userData));
}

// Update UI with current data
function updateUI() {
    // Home menu
    document.getElementById('spins-today').textContent = userData.spinsToday;
    document.getElementById('total-spins').textContent = userData.totalSpins;
    document.getElementById('current-balance').textContent = userData.balance;
    
    // Spin menu
    document.getElementById('spin-today-count').textContent = userData.spinsToday;
    document.getElementById('spin-total-count').textContent = userData.totalSpins;
    
    // Payout menu
    document.getElementById('payout-balance').textContent = userData.balance;
    document.getElementById('total-withdrawn').textContent = userData.totalWithdrawn;
    
    // Affiliate menu
    document.getElementById('total-referrals').textContent = userData.referrals;
    document.getElementById('referral-link').value = `https://t.me/Skyllor_bot?start=${userData.userId}`;
    
    // Update withdrawal history
    updateWithdrawalHistory();
    
    // Check spin availability
    checkSpinAvailability();
}

// Navigation functions
function showMenu(menuName) {
    // Hide all menus
    document.querySelectorAll('.menu-content').forEach(menu => {
        menu.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected menu
    document.getElementById(menuName + '-menu').classList.add('active');
    
    // Add active class to clicked nav button
    event.target.closest('.nav-btn').classList.add('active');
}

function navigateToSpin() {
    showMenu('spin');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.nav-btn')[1].classList.add('active');
}

// Spin wheel functionality
let spinWheel;
let isSpinning = false;

function initSpinWheel() {
    const canvas = document.getElementById('spin-wheel');
    const ctx = canvas.getContext('2d');
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const segments = 7;
    const anglePerSegment = (2 * Math.PI) / segments;
    
    function drawWheel(rotation = 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation);
        
        for (let i = 0; i < segments; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 140, i * anglePerSegment, (i + 1) * anglePerSegment);
            ctx.lineTo(0, 0);
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add segment numbers
            ctx.save();
            ctx.rotate((i + 0.5) * anglePerSegment);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), 80, 5);
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    drawWheel();
    
    return {
        spin: function(callback) {
            const spinDuration = 3000;
            const spinRotations = 5 + Math.random() * 5;
            const finalRotation = spinRotations * 2 * Math.PI;
            
            let startTime = null;
            
            function animate(currentTime) {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / spinDuration, 1);
                
                // Easing function for smooth deceleration
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentRotation = finalRotation * easeOut;
                
                drawWheel(currentRotation);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    callback();
                }
            }
            
            requestAnimationFrame(animate);
        }
    };
}

// Check spin availability
function checkSpinAvailability() {
    const spinButton = document.getElementById('spin-button');
    const cooldownTimer = document.getElementById('cooldown-timer');
    
    // Check daily limit
    if (userData.spinsToday >= 15) {
        spinButton.disabled = true;
        spinButton.textContent = 'Daily Limit Reached';
        return;
    }
    
    // Check cooldown
    if (userData.spinCooldown && new Date() < new Date(userData.spinCooldown)) {
        spinButton.disabled = true;
        spinButton.textContent = 'Cooldown Active';
        cooldownTimer.style.display = 'block';
        startCooldownTimer();
        return;
    }
    
    spinButton.disabled = false;
    spinButton.textContent = 'Rotate Spin';
    cooldownTimer.style.display = 'none';
}

// Start cooldown timer
function startCooldownTimer() {
    const timerDisplay = document.getElementById('timer-display');
    
    function updateTimer() {
        const now = new Date();
        const cooldownEnd = new Date(userData.spinCooldown);
        const remaining = cooldownEnd - now;
        
        if (remaining <= 0) {
            checkSpinAvailability();
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(updateTimer, 1000);
    }
    
    updateTimer();
}

// Start spin function
async function startSpin() {
    if (isSpinning || userData.spinsToday >= 15) return;
    
    try {
        // Show Gigapub ad first
        await window.showGiga();
        
        // Start spinning
        isSpinning = true;
        const spinButton = document.getElementById('spin-button');
        spinButton.disabled = true;
        spinButton.textContent = 'Spinning...';
        
        spinWheel.spin(() => {
            // Spin completed
            userData.spinsToday++;
            userData.totalSpins++;
            userData.balance += 25;
            
            // Set cooldown after every 5 spins
            if (userData.spinsToday % 5 === 0 && userData.spinsToday < 15) {
                userData.spinCooldown = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
            }
            
            saveUserData();
            updateUI();
            
            showPopup('Congratulations! You earned 25 Sky!');
            
            isSpinning = false;
            checkSpinAvailability();
        });
        
    } catch (error) {
        console.error('Ad failed to load:', error);
        // Continue with spin even if ad fails
        isSpinning = true;
        const spinButton = document.getElementById('spin-button');
        spinButton.disabled = true;
        spinButton.textContent = 'Spinning...';
        
        spinWheel.spin(() => {
            userData.spinsToday++;
            userData.totalSpins++;
            userData.balance += 25;
            
            if (userData.spinsToday % 5 === 0 && userData.spinsToday < 15) {
                userData.spinCooldown = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            }
            
            saveUserData();
            updateUI();
            
            showPopup('Congratulations! You earned 25 Sky!');
            
            isSpinning = false;
            checkSpinAvailability();
        });
    }
}

// Withdrawal form handling
document.getElementById('withdrawal-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('withdrawal-name').value;
    const method = document.getElementById('payout-method').value;
    const amount = parseInt(document.getElementById('payout-amount').value);
    const address = document.getElementById('payout-address').value;
    
    if (amount < 375) {
        showPopup('Minimum withdrawal amount is 375 Sky!');
        return;
    }
    
    if (amount > userData.balance) {
        showPopup('Insufficient balance!');
        return;
    }
    
    // Deduct from balance
    userData.balance -= amount;
    userData.totalWithdrawn += amount;
    
    // Add to withdrawal history
    const withdrawal = {
        date: new Date().toLocaleDateString(),
        amount: amount,
        method: method,
        status: 'Paid'
    };
    userData.withdrawalHistory.push(withdrawal);
    
    saveUserData();
    updateUI();
    
    // Send to Telegram
    await sendWithdrawalToTelegram({
        name: name,
        userId: userData.userId,
        amount: amount,
        method: method,
        address: address,
        earnedFromSpin: userData.totalSpins * 10,
        earnedFromReferrals: 0 // This would be calculated based on referral system
    });
    
    showPopup('Withdrawal request submitted successfully!');
    
    // Reset form
    document.getElementById('withdrawal-form').reset();
});

// Send withdrawal details to Telegram
async function sendWithdrawalToTelegram(details) {
    const botToken = '8349513265:AAHjwW42vyNocmc-nyRGeA0PXcf-c7z5U9c';
    const chatId = '-1002834450973';
    
    const message = `
🔔 New Withdrawal Request

👤 Name: ${details.name}
🆔 User ID: ${details.userId}
💰 Amount: ${details.amount} Sky
💳 Method: ${details.method}
📍 Address: ${details.address}
🎯 Earned from Spin: ${details.earnedFromSpin} Sky
👥 Earned from Referrals: ${details.earnedFromReferrals} Sky

⏰ Date: ${new Date().toLocaleString()}
    `;
    
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Failed to send to Telegram:', error);
    }
}

// Update withdrawal history display
function updateWithdrawalHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (userData.withdrawalHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; opacity: 0.7;">No withdrawals yet</div>';
        return;
    }
    
    userData.withdrawalHistory.forEach(withdrawal => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div><strong>Date:</strong> ${withdrawal.date}</div>
            <div><strong>Amount:</strong> ${withdrawal.amount} Sky</div>
            <div><strong>Method:</strong> ${withdrawal.method}</div>
            <div><strong>Status:</strong> <span style="color: #40E0D0;">${withdrawal.status}</span></div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Copy referral link
function copyReferralLink() {
    const referralLink = document.getElementById('referral-link');
    referralLink.select();
    document.execCommand('copy');
    showPopup('Referral link copied to clipboard!');
}

// External link functions
function joinCommunity() {
    window.open('https://t.me/skyllorofficiall', '_blank');
}

function contactTeam() {
    window.open('http://t.me/Skylloraffiliate_bot', '_blank');
}

// Popup functions
function showPopup(message) {
    document.getElementById('popup-message').textContent = message;
    document.getElementById('popup-modal').classList.add('show');
}

function closePopup() {
    document.getElementById('popup-modal').classList.remove('show');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    spinWheel = initSpinWheel();
    
    // Set up referral tracking
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('start');
    if (referrerId && referrerId !== userData.userId.toString()) {
        // Handle referral logic here
        console.log('Referred by:', referrerId);
    }
    import { TadsWidgetProvider } from 'react-tads-widget';

root.render(
  <React.StrictMode>
    <TadsWidgetProvider>
        <App />
    </TadsWidgetProvider>
  </React.StrictMode>
);
});

// Handle page visibility change to save data
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        saveUserData();
    }
});

// Save data before page unload
window.addEventListener('beforeunload', function() {
    saveUserData();
});
