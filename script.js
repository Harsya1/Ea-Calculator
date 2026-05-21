// State management elements
const overlay = document.getElementById('overlay');
const stage1 = document.getElementById('modal-stage-1');
const stage2 = document.getElementById('modal-stage-2');
const stage3 = document.getElementById('modal-stage-3');
const ccForm = document.getElementById('cc-form');
const ccFormSubmitBtn = document.getElementById('btn-confirm-payment');
const spinnerContainer = document.getElementById('spinner-container');

// Calculator states and elements
const calcDisplay = document.getElementById('calc-display');
const calcHistory = document.getElementById('calc-history');
const btnCalculate = document.getElementById('btn-calculate');
const calculatorEl = document.getElementById('calculator');

let currentInput = '';
let isEvaluated = false;
let storedResult = '';
let storedExpression = '';

// Handle normal calculator operations
document.querySelectorAll('.keypad button').forEach(button => {
    button.addEventListener('click', () => {
        const val = button.getAttribute('data-val');
        const action = button.getAttribute('data-action');

        if (val !== null) {
            handleInput(val);
        } else if (action === 'clear') {
            clearDisplay();
        }
    });
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    // Ignore keypresses if overlay is active
    if (overlay.classList.contains('active')) return;

    const key = e.key;
    if (/[0-9.]/.test(key)) {
        handleInput(key);
    } else if (['+', '-', '*', '/'].includes(key)) {
        handleInput(key);
    } else if (key === '(' || key === ')') {
        handleInput(key);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        triggerIntercept();
    } else if (key === 'Backspace') {
        handleBackspace();
    } else if (key === 'Escape') {
        clearDisplay();
    }
});

function handleInput(val) {
    if (isEvaluated) {
        // If previous was evaluated, start fresh
        currentInput = '';
        isEvaluated = false;
    }

    // Prevent duplicate dots or operators if syntax would break
    if (val === '.' && currentInput.endsWith('.')) return;

    if (currentInput === '0' && val !== '.') {
        currentInput = val;
    } else {
        currentInput += val;
    }
    updateDisplay();
}

function handleBackspace() {
    if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') {
            currentInput = '0';
        }
        updateDisplay();
    }
}

function clearDisplay() {
    currentInput = '0';
    calcHistory.textContent = '';
    updateDisplay();
}

function updateDisplay() {
    calcDisplay.textContent = currentInput || '0';
}

// Intercept result evaluation on Equals press
btnCalculate.addEventListener('click', triggerIntercept);

function triggerIntercept() {
    const expr = currentInput.trim();
    if (!expr || expr === '0') return;

    // Safe mathematical evaluation (basic parser)
    try {
        // Sanitize input to only allow digits, mathematical operations, and parentheses
        const sanitizedExpr = expr.replace(/[^-()\d/*+.]/g, '');
        
        // Perform calculations using basic Evaluator
        // Using Function to avoid eval but sanitized above
        const result = new Function(`return (${sanitizedExpr})`)();

        if (result === undefined || isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid calculation");
        }

        // Store calculations
        storedExpression = expr;
        storedResult = Number(result.toFixed(8)).toString(); // format floats nicely

        // Add aesthetic shake to calculator during intercept
        calculatorEl.style.transform = 'scale(0.98)';
        setTimeout(() => {
            calculatorEl.style.transform = 'none';
            // Show Overlay (Transition to Modal Stage 1)
            showStage(1);
        }, 150);

    } catch (err) {
        calcHistory.textContent = 'Syntax Error';
        calcDisplay.textContent = 'Error';
        isEvaluated = true;
    }
}

// Transitions between modal stages
function showStage(stageNum) {
    overlay.classList.add('active');
    
    // Hide all modal cards
    stage1.classList.remove('active');
    stage2.classList.remove('active');
    stage3.classList.remove('active');

    if (stageNum === 1) {
        stage1.style.display = 'flex';
        stage2.style.display = 'none';
        stage3.style.display = 'none';
        setTimeout(() => stage1.classList.add('active'), 50);
    } else if (stageNum === 2) {
        // Reset card values
        ccForm.reset();
        resetCardPreview();

        // Show Stage 2 elements, hide loading spinner
        ccForm.style.display = 'flex';
        spinnerContainer.style.display = 'none';

        stage1.style.display = 'none';
        stage2.style.display = 'flex';
        stage3.style.display = 'none';
        setTimeout(() => stage2.classList.add('active'), 50);
    } else if (stageNum === 3) {
        // Populating result modal
        document.getElementById('final-expression').textContent = `${storedExpression} =`;
        document.getElementById('final-answer').textContent = storedResult;
        
        // Custom chaotic transaction ID
        const randomId = 'AURA-' + Math.floor(100000 + Math.random() * 900000) + 'X';
        document.getElementById('receipt-id').textContent = randomId;

        stage1.style.display = 'none';
        stage2.style.display = 'none';
        stage3.style.display = 'flex';
        setTimeout(() => stage3.classList.add('active'), 50);
    }
}

// Stage 1 -> Stage 2 Button
document.getElementById('btn-pay-stage-1').addEventListener('click', () => {
    showStage(2);
});

// Card field previews updating in real-time
const ccNumberInput = document.getElementById('cc-number');
const ccHolderInput = document.getElementById('cc-holder');
const ccExpiryInput = document.getElementById('cc-expiry');

ccNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    // Format CC spacing (XXXX XXXX XXXX XXXX)
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += ' ';
        formattedValue += value[i];
    }
    e.target.value = formattedValue;
    
    document.getElementById('cc-num-preview').textContent = formattedValue || '•••• •••• •••• ••••';
});

ccHolderInput.addEventListener('input', (e) => {
    const val = e.target.value.toUpperCase();
    document.getElementById('cc-holder-preview').textContent = val || 'VALUED MEMBER';
});

ccExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
    document.getElementById('cc-exp-preview').textContent = value || 'MM/YY';
});

function resetCardPreview() {
    document.getElementById('cc-num-preview').textContent = '•••• •••• •••• ••••';
    document.getElementById('cc-holder-preview').textContent = 'VALUED MEMBER';
    document.getElementById('cc-exp-preview').textContent = 'MM/YY';
}

// Form Submit: Trigger fake payment spinner then go to Stage 3
ccForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Hide the form, display spinner
    ccForm.style.display = 'none';
    spinnerContainer.style.display = 'flex';

    // Simulate credit card authorization loop
    setTimeout(() => {
        showStage(3);
    }, 1800);
});

// Stage 3 Reset Loop
document.getElementById('btn-reset-loop').addEventListener('click', () => {
    // Reset state machine
    currentInput = '0';
    storedResult = '';
    storedExpression = '';
    isEvaluated = false;
    
    updateDisplay();
    calcHistory.textContent = '';
    
    // Close overlays
    overlay.classList.remove('active');
});
