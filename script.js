// Enhanced Live Voice Word Counter
let recognition;
let isListening = false;
let wordCount = 0;
let targetWord = 'um';
let fullTranscript = '';
const detectionHistory = [];

// DOM Elements
const startBtn = document.getElementById('startBtn');
const counter = document.getElementById('counter');
const targetWordInput = document.getElementById('targetWord');
const statusBar = document.getElementById('statusBar');
const transcript = document.getElementById('transcript');
const historyList = document.getElementById('historyList');

// Check for browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    updateStatus('error', 'Speech recognition not supported in this browser');
    startBtn.disabled = true;
} else {
    initializeSpeechRecognition();
}

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        updateStatus('listening', 'Listening...');
        startBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Stop Listening</span>';
        startBtn.classList.add('listening');
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcriptPiece + ' ';
            } else {
                interimTranscript += transcriptPiece;
            }
        }
        
        // Update transcript display
        if (finalTranscript) {
            fullTranscript += finalTranscript;
            updateTranscript(fullTranscript);
            countWords(finalTranscript);
        }
        
        // Show interim results
        if (interimTranscript) {
            updateTranscript(fullTranscript + '<span class="interim">' + interimTranscript + '</span>');
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            updateStatus('warning', 'No speech detected. Keep talking!');
        } else if (event.error === 'not-allowed') {
            updateStatus('error', 'Microphone access denied');
            stopListening();
        } else {
            updateStatus('error', `Error: ${event.error}`);
        }
    };
    
    recognition.onend = () => {
        if (isListening) {
            // Automatically restart if still in listening mode
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to restart recognition:', e);
                stopListening();
            }
        }
    };
}

// Start/Stop button handler
startBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// Start listening
function startListening() {
    targetWord = targetWordInput.value.trim().toLowerCase();
    
    if (!targetWord) {
        alert('Please enter a target word first!');
        return;
    }
    
    wordCount = 0;
    fullTranscript = '';
    updateCounter(0);
    updateTranscript('Listening for "' + targetWord + '"...');
    
    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
        updateStatus('error', 'Failed to start microphone');
    }
}

// Stop listening
function stopListening() {
    isListening = false;
    recognition.stop();
    updateStatus('idle', 'Stopped');
    startBtn.innerHTML = '<span class="btn-icon">🎙️</span><span class="btn-text">Start Listening</span>';
    startBtn.classList.remove('listening');
}

// Count word occurrences
function countWords(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g);
    if (!words) return;
    
    words.forEach((word) => {
        if (word === targetWord) {
            wordCount++;
            updateCounter(wordCount);
            addToHistory(word);
            playDetectionAnimation();
        }
    });
}

// Update counter display
function updateCounter(count) {
    counter.textContent = count;
    counter.classList.add('pulse');
    setTimeout(() => counter.classList.remove('pulse'), 300);
}

// Update status bar
function updateStatus(type, message) {
    statusBar.className = 'status-bar status-' + type;
    statusBar.querySelector('.status-text').textContent = message;
}

// Update transcript display
function updateTranscript(text) {
    if (text.trim()) {
        transcript.innerHTML = '<p>' + text + '</p>';
        transcript.scrollTop = transcript.scrollHeight;
    }
}

// Add to detection history
function addToHistory(word) {
    const timestamp = new Date().toLocaleTimeString();
    const historyItem = {
        word: word,
        time: timestamp,
        count: wordCount
    };
    
    detectionHistory.unshift(historyItem);
    
    // Keep only last 20 detections
    if (detectionHistory.length > 20) {
        detectionHistory.pop();
    }
    
    renderHistory();
}

// Render history list
function renderHistory() {
    if (detectionHistory.length === 0) {
        historyList.innerHTML = '<p class="placeholder">No detections yet</p>';
        return;
    }
    
    let html = '';
    detectionHistory.forEach((item, index) => {
        html += `
            <div class="history-item fade-in">
                <span class="history-badge">#${item.count}</span>
                <span class="history-word">"${item.word}"</span>
                <span class="history-time">${item.time}</span>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

// Play detection animation
function playDetectionAnimation() {
    statusBar.classList.add('detected');
    setTimeout(() => statusBar.classList.remove('detected'), 500);
}

// Update target word on input
targetWordInput.addEventListener('input', (e) => {
    if (!isListening) {
        targetWord = e.target.value.trim().toLowerCase();
    }
});

// Prevent changing target word while listening
targetWordInput.addEventListener('focus', () => {
    if (isListening) {
        targetWordInput.blur();
        alert('Stop listening before changing the target word!');
    }
});

// Initialize
updateStatus('idle', 'Ready to start');
