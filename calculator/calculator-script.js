class PremiumCalculator {
    constructor() {
        this.display = document.getElementById('display');
        this.expressionPreview = document.getElementById('expressionPreview');
        this.historyList = document.getElementById('historyList');
        this.memoryIndicator = document.getElementById('memoryIndicator');
        this.loader = document.getElementById('loader');
        this.themeToggle = document.getElementById('themeToggle');

        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.memory = 0;
        this.history = [];
        this.isDarkTheme = true;

        this.initializeEventListeners();
        this.loadHistory();
        this.loadMemory();
        this.hideLoader();
    }

    initializeEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', () => this.appendNumber(btn.dataset.number));
        });

        // Operator buttons
        document.querySelectorAll('.operator-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleOperator(btn.dataset.operator));
        });

        // Special buttons
        document.getElementById('equalsBtn').addEventListener('click', () => this.calculate());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('deleteBtn').addEventListener('click', () => this.delete());

        // Memory buttons
        document.getElementById('memClear').addEventListener('click', () => this.memoryClear());
        document.getElementById('memRecall').addEventListener('click', () => this.memoryRecall());
        document.getElementById('memAdd').addEventListener('click', () => this.memoryAdd());
        document.getElementById('memSubtract').addEventListener('click', () => this.memorySubtract());

        // History
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Update display on input
        this.display.addEventListener('input', () => this.updateDisplay());
    }

    appendNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentValue = num;
            this.shouldResetDisplay = false;
        } else {
            if (this.currentValue === '0' && num !== '.') {
                this.currentValue = num;
            } else if (num === '.' && this.currentValue.includes('.')) {
                return;
            } else {
                this.currentValue += num;
            }
        }
        this.updateDisplay();
    }

    handleOperator(op) {
        if (op === '.') {
            if (this.currentValue.includes('.')) {
                return;
            }
            this.currentValue += op;
            this.updateDisplay();
            return;
        }

        if (this.operation !== null && !this.shouldResetDisplay) {
            this.calculate();
        }

        this.previousValue = this.currentValue;
        this.operation = op;
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }


    calculate() {
        if (this.operation === null || this.shouldResetDisplay) {
            return;
        }

        try {
            let result;
            const prev = parseFloat(this.previousValue);
            const current = parseFloat(this.currentValue);

            switch (this.operation) {
                case '+':
                    result = prev + current;
                    break;
                case '-':
                    result = prev - current;
                    break;
                case '*':
                    result = prev * current;
                    break;
                case '/':
                    if (current === 0) throw new Error('Division by zero');
                    result = prev / current;
                    break;
                case '%':
                    result = prev % current;
                    break;
                default:
                    return;
            }

            result = this.roundResult(result);
            const expression = `${this.previousValue} ${this.operation} ${this.currentValue} = ${result}`;
            this.addToHistory(expression);

            this.currentValue = String(result);
            this.previousValue = '';
            this.operation = null;
            this.shouldResetDisplay = true;
            this.updateDisplay();
        } catch (error) {
            this.showError(error.message);
        }
    }

    clear() {
        this.currentValue = '0';
        this.updateDisplay();
    }

    clearAll() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }

    delete() {
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    memoryClear() {
        this.memory = 0;
        this.saveMemory();
        this.updateMemoryIndicator();
    }

    memoryRecall() {
        this.currentValue = String(this.memory);
        this.shouldResetDisplay = true;
        this.updateDisplay();
    }

    memoryAdd() {
        this.memory += parseFloat(this.currentValue);
        this.saveMemory();
        this.updateMemoryIndicator();
        this.shouldResetDisplay = true;
    }

    memorySubtract() {
        this.memory -= parseFloat(this.currentValue);
        this.saveMemory();
        this.updateMemoryIndicator();
        this.shouldResetDisplay = true;
    }

    updateMemoryIndicator() {
        this.memoryIndicator.textContent = `M: ${this.memory.toFixed(2)}`;
    }

    saveMemory() {
        localStorage.setItem('calculatorMemory', this.memory);
    }

    loadMemory() {
        const saved = localStorage.getItem('calculatorMemory');
        if (saved) {
            this.memory = parseFloat(saved);
            this.updateMemoryIndicator();
        }
    }

    addToHistory(expression) {
        this.history.unshift(expression);
        if (this.history.length > 50) {
            this.history.pop();
        }
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">No calculations yet</p>';
            return;
        }

        this.historyList.innerHTML = this.history
            .map((item, index) => `
                <div class="history-item" data-index="${index}">
                    ${item}
                </div>
            `)
            .join('');

        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const result = item.textContent.split('=')[1].trim();
                this.currentValue = result;
                this.shouldResetDisplay = true;
                this.updateDisplay();
            });
        });
    }

    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.renderHistory();
        }
    }

    updateDisplay() {
        this.display.value = this.currentValue;
        this.updateExpressionPreview();
    }

    updateExpressionPreview() {
        if (this.operation) {
            this.expressionPreview.textContent = `${this.previousValue} ${this.operation}`;
        } else {
            this.expressionPreview.textContent = '';
        }
    }

    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9') {
            this.appendNumber(e.key);
        } else if (e.key === '.') {
            this.appendNumber('.');
        } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
            e.preventDefault();
            this.handleOperator(e.key);
        } else if (e.key === '%') {
            e.preventDefault();
            this.handleOperator('%');
        } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.calculate();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.delete();
        } else if (e.key === 'Escape') {
            this.clearAll();
        } else if (e.key === 'c' || e.key === 'C') {
            this.clear();
        }
    }

    showError(message) {
        this.display.classList.add('error');
        this.display.value = message;
        setTimeout(() => {
            this.display.classList.remove('error');
            this.currentValue = '0';
            this.updateDisplay();
        }, 1500);
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('light-theme');
        localStorage.setItem('calculatorTheme', this.isDarkTheme ? 'dark' : 'light');
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('i');
        if (this.isDarkTheme) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    loadTheme() {
        const saved = localStorage.getItem('calculatorTheme');
        if (saved === 'light') {
            this.isDarkTheme = false;
            document.body.classList.add('light-theme');
            this.updateThemeIcon();
        }
    }

    hideLoader() {
        setTimeout(() => {
            this.loader.style.display = 'none';
        }, 1500);
    }


    roundResult(value) {
        return Math.round(value * 100000000) / 100000000;
    }
}

// Initialize calculator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new PremiumCalculator();
    calculator.loadTheme();
});
