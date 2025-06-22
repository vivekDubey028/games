class SlotMachine {
    constructor() {
        this.symbols = [
            { type: 'seven-red', display: '7', value: 500, weight: 1 },
            { type: 'seven-blue', display: '7', value: 250, weight: 2 },
            { type: 'bar', display: 'BAR', value: 100, weight: 3 },
            { type: 'bell', display: '🔔', value: 50, weight: 7 },
            { type: 'grape', display: '🍇', value: 30, weight: 9 },
            { type: 'orange', display: '🍊', value: 25, weight: 10 },
            { type: 'lemon', display: '🍋', value: 20, weight: 12 },
            { type: 'apple', display: '🍎', value: 15, weight: 14 },
            { type: 'cherry', display: '🍒', value: 10, weight: 16 },
            { type: 'wild', display: '⭐', value: 0, weight: 2 }
        ];
        
        this.paylines = [
            [1, 1, 1], // Line 1: Middle row
            [0, 0, 0], // Line 2: Top row
            [2, 2, 2], // Line 3: Bottom row
            [0, 1, 2], // Line 4: Diagonal top-left to bottom-right
            [2, 1, 0], // Line 5: Diagonal bottom-left to top-right
            [1, 0, 1], // Line 6: V shape
            [1, 2, 1], // Line 7: Inverted V shape
            [0, 0, 1], // Line 8: L shape
            [2, 2, 1], // Line 9: Inverted L shape
            [0, 2, 2]  // Line 10: Step up
        ];
        
        this.reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        
        this.spinBtn = document.getElementById('spinBtn');
        this.fastBtn = document.getElementById('fastBtn');
        this.paylineItems = document.querySelectorAll('.payline-item');
        this.winAmount = document.getElementById('winAmount');
        this.coinCount = document.getElementById('coinCount');
        this.jackpotAmount = document.getElementById('jackpotAmount');
        this.linesNumber = document.getElementById('linesNumber');
        this.totalBet = document.getElementById('totalBet');
        this.lineBet = document.getElementById('lineBet');
        this.winningCoins = document.getElementById('winningCoins');
        
        this.isSpinning = false;
        this.credits = 1250;
        this.jackpot = 5250;
        this.currentTotalBet = 50;
        this.currentLineBet = 10;
        this.activeLines = 5;
        this.fastMode = false;
        this.autoPlay = false;
        this.autoPlayCount = 0;
        
        this.currentReelSymbols = [[], [], []];
        this.symbolsPerReel = 20; // Number of symbols per reel for smooth scrolling
        
        // Initialize sounds
        this.sounds = {
            spin: new Audio('sounds/audiomass-output.mp3'),
            win: new Audio('sounds/you-win-sequence-1-183948.mp3'),
            jackpot: new Audio('sounds/jackpot-slot-machine-coin-loop-13-216267.mp3'),
            buttonClick: new Audio('sounds/721503__baggonotes__button_click2.wav')
        };
        
        // Set sound volumes
        this.sounds.spin.volume = 0.5;
        this.sounds.win.volume = 0.6;
        this.sounds.jackpot.volume = 0.8;
        this.sounds.buttonClick.volume = 0.3;
        
        // Ensure spin sound loops
        this.sounds.spin.loop = true;
        
        this.initializeEvents();
        this.generateInitialSymbols();
        this.showLoader();
    }
    
    showLoader() {
        const loader = document.getElementById('screenLoader');
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 3000);
    }
    
    initializeEvents() {
        // Spin button
        this.spinBtn.addEventListener('click', () => {
            this.sounds.buttonClick.play();
            this.handleSpin();
        });
        
        // Fast button
        this.fastBtn.addEventListener('click', () => {
            this.sounds.buttonClick.play();
            this.toggleFastMode();
        });
        
        // Payline selection
        this.paylineItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.sounds.buttonClick.play();
                this.togglePayline(index + 1);
            });
        });
        
        // Control buttons
        const controlBtns = document.querySelectorAll('.control-btn');
        controlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sounds.buttonClick.play();
                this.handleControlClick(e);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.sounds.buttonClick.play();
                this.handleSpin();
            }
        });
        
        // Update jackpot periodically
        setInterval(() => {
            this.jackpot += Math.floor(Math.random() * 5) + 1;
            this.updateJackpotDisplay();
        }, 5000);
    }
    
    generateInitialSymbols() {
        this.reels.forEach((reel, reelIndex) => {
            const reelInner = document.createElement('div');
            reelInner.className = 'reel-inner';
            reel.innerHTML = '';
            reel.appendChild(reelInner);
            
            this.currentReelSymbols[reelIndex] = [];
            
            // Generate symbolsPerReel symbols for smooth scrolling
            for (let i = 0; i < this.symbolsPerReel; i++) {
                const symbol = this.getRandomSymbol();
                const symbolBox = document.createElement('div');
                symbolBox.className = 'symbol-box';
                symbolBox.setAttribute('data-position', i % 3); // Map to 0, 1, 2 for paylines
                const symbolElement = document.createElement('div');
                symbolElement.className = `symbol ${symbol.type}`;
                symbolElement.textContent = symbol.display;
                symbolBox.appendChild(symbolElement);
                reelInner.appendChild(symbolBox);
                
                // Store only the last 3 symbols for payline checking
                if (i >= this.symbolsPerReel - 3) {
                    this.currentReelSymbols[reelIndex].unshift(symbol);
                }
            }
        });
    }
    
    getRandomSymbol() {
        const totalWeight = this.symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const symbol of this.symbols) {
            random -= symbol.weight;
            if (random <= 0) {
                return { ...symbol };
            }
        }
        
        return { ...this.symbols[this.symbols.length - 1] };
    }
    
    async handleSpin() {
        if (this.isSpinning) return;
        
        if (this.autoPlay) {
            this.autoPlayCount--;
            if (this.autoPlayCount <= 0) {
                this.toggleAutoPlay();
            }
        }
        
        await this.spin();
        
        if (this.autoPlay && this.autoPlayCount > 0) {
            setTimeout(() => this.handleSpin(), this.fastMode ? 1000 : 2000);
        }
    }
    
    async spin() {
        if (this.isSpinning) return;
        
        // Check if player has enough credits
        if (this.credits < this.currentTotalBet) {
            this.showMessage('Insufficient credits!');
            return;
        }
        
        this.isSpinning = true;
        this.credits -= this.currentTotalBet;
        this.updateCreditsDisplay();
        
        // Play spin sound
        this.sounds.spin.currentTime = 0;
        this.sounds.spin.play();
        
        // Clear previous wins
        this.clearWinningEffects();
        
        // Update spin button
        this.spinBtn.classList.add('spinning');
        this.spinBtn.querySelector('.spin-text').textContent = 'SPINNING...';
        this.spinBtn.disabled = true;
        
        // Start spinning animation
        const spinDuration = this.fastMode ? 1000 : 2000;
        const reelStopDelays = this.fastMode ? [300, 600, 900] : [500, 1000, 1500];
        
        this.reels.forEach((reel, index) => {
            reel.classList.add('spinning');
            setTimeout(() => {
                this.stopReel(reel, index);
            }, reelStopDelays[index]);
        });
        
        // Wait for all reels to finish
        await this.waitForSpinComplete(spinDuration);
        
        // Check for wins
        const winResults = this.checkWins();
        if (winResults.totalWin > 0) {
            this.credits += winResults.totalWin;
            this.updateCreditsDisplay();
            await this.animateWin(winResults);
        }
        
        // Reset spin button
        this.spinBtn.classList.remove('spinning');
        this.spinBtn.querySelector('.spin-text').textContent = this.autoPlay ? 'AUTO' : 'SPIN';
        this.spinBtn.disabled = false;
        this.isSpinning = false;
    }
    
    stopReel(reel, reelIndex) {
        reel.classList.remove('spinning');
        
        // Generate new symbols for the bottom of the reel
        const reelInner = reel.querySelector('.reel-inner');
        this.currentReelSymbols[reelIndex] = [];
        
        // Add 3 new symbols to the bottom
        for (let i = 0; i < 3; i++) {
            const symbol = this.getRandomSymbol();
            const symbolBox = document.createElement('div');
            symbolBox.className = 'symbol-box';
            symbolBox.setAttribute('data-position', i);
            const symbolElement = document.createElement('div');
            symbolElement.className = `symbol ${symbol.type}`;
            symbolElement.textContent = symbol.display;
            symbolBox.appendChild(symbolElement);
            reelInner.appendChild(symbolBox);
            
            this.currentReelSymbols[reelIndex].unshift(symbol);
        }
        
        // Remove top 3 symbols to keep reel length constant
        for (let i = 0; i < 3; i++) {
            reelInner.removeChild(reelInner.firstChild);
        }
        
        // Reset transform to avoid overflow
        reelInner.style.transform = 'translateY(0)';
    }
    
    async waitForSpinComplete(duration) {
        await new Promise(resolve => setTimeout(resolve, duration));
        this.sounds.spin.pause();
        this.sounds.spin.currentTime = 0;
    }
    
    checkWins() {
        const winResults = {
            totalWin: 0,
            winningLines: [],
            winningSymbols: []
        };
        
        // Check each active payline
        for (let lineIndex = 0; lineIndex < this.activeLines; lineIndex++) {
            const payline = this.paylines[lineIndex];
            const lineSymbols = [
                this.currentReelSymbols[0][payline[0]],
                this.currentReelSymbols[1][payline[1]],
                this.currentReelSymbols[2][payline[2]]
            ];
            
            const winAmount = this.calculateLineWin(lineSymbols);
            if (winAmount > 0) {
                winResults.totalWin += winAmount;
                winResults.winningLines.push({
                    lineNumber: lineIndex + 1,
                    symbols: lineSymbols,
                    positions: payline,
                    winAmount: winAmount
                });
                
                // Mark winning symbol positions
                payline.forEach((position, reelIndex) => {
                    winResults.winningSymbols.push({ reel: reelIndex, position: position });
                });
            }
        }
        
        // Check for jackpot
        if (this.isJackpotWin(winResults.winningLines)) {
            winResults.totalWin += this.jackpot;
            this.jackpot = 1000;
            this.updateJackpotDisplay();
            this.sounds.jackpot.currentTime = 0;
            this.sounds.jackpot.play();
        } else if (winResults.totalWin > 0) {
            this.sounds.win.currentTime = 0;
            this.sounds.win.play();
        }
        
        return winResults;
    }
    
    calculateLineWin(symbols) {
        // Handle wild symbols
        const effectiveSymbols = symbols.map(symbol => {
            if (symbol.type === 'wild') {
                if (symbols.every(s => s.type === 'seven-red' || s.type === 'wild')) {
                    return symbol;
                }
                const firstNonWild = symbols.find(s => s.type !== 'wild');
                return firstNonWild ? { ...firstNonWild } : symbol;
            }
            return symbol;
        });
        
        // Check for three matching symbols
        if (effectiveSymbols[0].type === effectiveSymbols[1].type && 
            effectiveSymbols[1].type === effectiveSymbols[2].type) {
            return effectiveSymbols[0].value * this.currentLineBet;
        }
        
        return 0;
    }
    
    isJackpotWin(winningLines) {
        return winningLines.some(line => 
            line.symbols.every(symbol => symbol.type === 'seven-red')
        );
    }
    
    async animateWin(winResults) {
        // Show win amount
        this.winAmount.textContent = winResults.totalWin.toFixed(2);
        const winDisplay = this.winAmount.parentElement;
        winDisplay.classList.add('winning');
        
        // Highlight winning symbols
        winResults.winningSymbols.forEach(({ reel, position }) => {
            const reelInner = this.reels[reel].querySelector('.reel-inner');
            const symbolBox = reelInner.children[2 - position].querySelector('.symbol-box');
            if (symbolBox) {
                symbolBox.classList.add('winning');
            }
        });
        
        // Show winning paylines
        winResults.winningLines.forEach(line => {
            const paylineElement = document.querySelector(`.payline-${line.lineNumber}`);
            if (paylineElement) {
                paylineElement.classList.add('winning');
                if (line.lineNumber === 4 || line.lineNumber === 5) {
                    paylineElement.classList.add('diagonal');
                }
            }
        });
        
        // Animate coins
        this.animateCoins(winResults.totalWin);
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clear win effects
        setTimeout(() => {
            this.clearWinningEffects();
        }, 3000);
    }
    
    clearWinningEffects() {
        // Clear win display
        this.winAmount.textContent = '0.00';
        const winDisplay = this.winAmount.parentElement;
        winDisplay.classList.remove('winning');
        
        // Clear winning symbols
        document.querySelectorAll('.symbol-box.winning').forEach(box => {
            box.classList.remove('winning');
        });
        
        // Clear winning paylines
        document.querySelectorAll('.payline.winning').forEach(line => {
            line.classList.remove('winning');
            line.classList.remove('diagonal');
        });
        
        // Clear coins
        this.winningCoins.innerHTML = '';
    }
    
    animateCoins(winAmount) {
        const coinCount = Math.min(Math.floor(winAmount / 10), 20);
        
        for (let i = 0; i < coinCount; i++) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'coin-particle';
                coin.textContent = '$';
                coin.style.left = Math.random() * 100 + '%';
                coin.style.animationDelay = Math.random() * 0.5 + 's';
                this.winningCoins.appendChild(coin);
                
                setTimeout(() => {
                    if (coin.parentNode) {
                        coin.parentNode.removeChild(coin);
                    }
                }, 2000);
            }, i * 100);
        }
    }
    
    togglePayline(lineNumber) {
        const paylineItem = document.querySelector(`[data-line="${lineNumber}"]`);
        const isActive = paylineItem.classList.contains('active');
        
        if (isActive && this.activeLines > 1) {
            paylineItem.classList.remove('active');
            this.activeLines--;
        } else if (!isActive && this.activeLines < 10) {
            paylineItem.classList.add('active');
            this.activeLines++;
        }
        
        // Update displays
        this.linesNumber.textContent = this.activeLines;
        this.currentTotalBet = this.activeLines * this.currentLineBet;
        this.totalBet.textContent = this.currentTotalBet.toFixed(2);
        
        // Update payline bet displays
        document.querySelectorAll('.payline-item .line-bet').forEach(element => {
            element.textContent = this.currentLineBet;
        });
    }
    
    handleControlClick(e) {
        const button = e.target;
        const action = button.getAttribute('data-action');
        
        switch (action) {
            case 'total-bet-up':
                if (this.currentLineBet < 50) {
                    this.currentLineBet += 5;
                    this.updateBetDisplays();
                }
                break;
            case 'total-bet-down':
                if (this.currentLineBet > 5) {
                    this.currentLineBet -= 5;
                    this.updateBetDisplays();
                }
                break;
            case 'line-bet-up':
                if (this.currentLineBet < 50) {
                    this.currentLineBet += 5;
                    this.updateBetDisplays();
                }
                break;
            case 'line-bet-down':
                if (this.currentLineBet > 5) {
                    this.currentLineBet -= 5;
                    this.updateBetDisplays();
                }
                break;
        }
    }
    
    toggleFastMode() {
        this.fastMode = !this.fastMode;
        this.fastBtn.classList.toggle('active', this.fastMode);
    }
    
    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        
        if (this.autoPlay) {
            this.autoPlayCount = 10;
            this.spinBtn.querySelector('.spin-text').textContent = 'AUTO';
            this.spinBtn.classList.add('autoplay');
            if (!this.isSpinning) {
                this.handleSpin();
            }
        } else {
            this.autoPlayCount = 0;
            this.spinBtn.querySelector('.spin-text').textContent = 'SPIN';
            this.spinBtn.classList.remove('autoplay');
        }
    }
    
    updateCreditsDisplay() {
        this.coinCount.textContent = this.credits.toLocaleString();
    }
    
    updateJackpotDisplay() {
        this.jackpotAmount.textContent = '$' + this.jackpot.toLocaleString();
    }
    
    showMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, var(--panel-light), var(--panel-dark));
            border: 2px solid var(--border-cyan);
            border-radius: 10px;
            padding: 20px 30px;
            color: var(--text-yellow);
            font-weight: 900;
            font-size: 18px;
            text-shadow: 0 0 10px rgba(255, 221, 0, 0.8);
            box-shadow: 0 0 20px rgba(0, 255, 204, 0.5);
            z-index: 10001;
            animation: notificationPulse 0.5s ease-in-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    updateBetDisplays() {
        this.currentTotalBet = this.activeLines * this.currentLineBet;
        this.totalBet.textContent = this.currentTotalBet.toFixed(2);
        this.lineBet.textContent = this.currentLineBet.toFixed(2);
        document.querySelectorAll('.payline-item .line-bet').forEach(element => {
            element.textContent = this.currentLineBet;
        });
    }
}

// Add notification animation
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes notificationPulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    .spin-btn.autoplay {
        background: linear-gradient(145deg, #ffaa44, #ff8822);
        animation: autoplayPulse 1.5s ease-in-out infinite;
    }
    
    @keyframes autoplayPulse {
        0%, 100% { box-shadow: 0 0 15px rgba(255, 170, 68, 0.5); }
        50% { box-shadow: 0 0 25px rgba(255, 170, 68, 0.8); }
    }
`;
document.head.appendChild(notificationStyle);

// Initialize the slot machine when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SlotMachine();
});

// Add touch support for mobile
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, { passive: true });
}

// Add vibration support for mobile wins
function vibrateOnWin() {
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
}