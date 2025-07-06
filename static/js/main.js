// Main analysis page JavaScript
let textAnalysisComplete = false;
let emgAnalysisComplete = false;
let emgStatusInterval;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize neural network background
    initializeNeuralNetwork();
    
    // Initialize the page
    initializePage();
    
    // Start EMG status monitoring
    startEMGStatusMonitoring();
    
    console.log('🧠 NeuroMed AI Analysis Platform Loaded Successfully!');
});

// Neural Network Initialization
function initializeNeuralNetwork() {
    const neuralBackground = document.querySelector('.neural-background');
    if (!neuralBackground) return;
    
    // Clear existing nodes and connections
    neuralBackground.innerHTML = '';
    
    // Network configuration (smaller for main page)
    const nodeCount = 20;
    const connectionProbability = 0.25;
    const nodes = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        const nodeType = Math.random() < 0.08 ? 'hub' : (Math.random() < 0.25 ? 'large' : '');
        node.className = `neural-node ${nodeType}`;
        
        // Position nodes
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        node.style.left = x + '%';
        node.style.top = y + '%';
        
        // Add random delay to animation
        node.style.animationDelay = Math.random() * 4 + 's';
        
        neuralBackground.appendChild(node);
        nodes.push({ element: node, x, y });
    }
    
    // Create connections between nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const distance = Math.sqrt(
                Math.pow(nodes[i].x - nodes[j].x, 2) + 
                Math.pow(nodes[i].y - nodes[j].y, 2)
            );
            
            // Only connect nearby nodes
            if (distance < 35 && Math.random() < connectionProbability) {
                createConnection(nodes[i], nodes[j], neuralBackground);
            }
        }
    }
    
    // Add data packets periodically
    setInterval(() => {
        if (Math.random() < 0.25) {
            createDataPacket(neuralBackground);
        }
    }, 3000);
}

function createConnection(nodeA, nodeB, container) {
    const connection = document.createElement('div');
    const connectionType = Math.random() < 0.15 ? 'active' : (Math.random() < 0.35 ? 'secondary' : '');
    connection.className = `neural-connection ${connectionType}`;
    
    // Calculate connection geometry
    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Position and style the connection
    connection.style.left = nodeA.x + '%';
    connection.style.top = nodeA.y + '%';
    connection.style.width = distance + '%';
    connection.style.transform = `rotate(${angle}deg)`;
    connection.style.transformOrigin = '0 50%';
    
    // Add random animation delay
    connection.style.animationDelay = Math.random() * 8 + 's';
    
    container.appendChild(connection);
}

function createDataPacket(container) {
    const connections = container.querySelectorAll('.neural-connection');
    if (connections.length === 0) return;
    
    const randomConnection = connections[Math.floor(Math.random() * connections.length)];
    const packet = document.createElement('div');
    packet.className = 'data-packet';
    
    // Position packet at the start of the connection
    packet.style.left = randomConnection.style.left;
    packet.style.top = randomConnection.style.top;
    packet.style.transform = randomConnection.style.transform;
    packet.style.transformOrigin = '0 50%';
    
    // Add random delay
    packet.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(packet);
    
    // Remove packet after animation
    setTimeout(() => {
        if (packet.parentNode) {
            packet.parentNode.removeChild(packet);
        }
    }, 4000);
}

// Resize handler to regenerate network
window.addEventListener('resize', function() {
    setTimeout(initializeNeuralNetwork, 100);
});

function initializePage() {
    // Add event listeners
    setupEventListeners();
    
    // Initialize UI states
    updateCombinedSectionVisibility();
    
    // Add loading animations
    addLoadingAnimations();
}

function setupEventListeners() {
    // Text analysis
    const textAnalyzeBtn = document.getElementById('text-analyze-btn');
    if (textAnalyzeBtn) {
        textAnalyzeBtn.addEventListener('click', analyzeText);
    }
    
    // EMG analysis
    const emgAnalyzeBtn = document.getElementById('emg-analyze-btn');
    if (emgAnalyzeBtn) {
        emgAnalyzeBtn.addEventListener('click', analyzeEMG);
    }
    
    // Combined analysis
    const combineBtn = document.getElementById('combine-btn');
    if (combineBtn) {
        combineBtn.addEventListener('click', combineAnalysis);
    }
    
    // Clear EMG samples
    const clearEMGBtn = document.querySelector('[onclick="clearEMG()"]');
    if (clearEMGBtn) {
        clearEMGBtn.addEventListener('click', clearEMG);
    }
    
    // Reset analysis
    const resetBtn = document.querySelector('[onclick="resetAnalysis()"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnalysis);
    }
}

function addLoadingAnimations() {
    // Add hover effects to analysis sections
    const analysisSections = document.querySelectorAll('.analysis-section');
    analysisSections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 25px 50px rgba(0, 212, 255, 0.15)';
        });
        
        section.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.1)';
        });
    });
}

async function analyzeText() {
    const textInput = document.getElementById('medical-text');
    const analyzeBtn = document.getElementById('text-analyze-btn');
    const loader = document.getElementById('text-loader');
    const resultsArea = document.getElementById('text-results');
    
    const medicalText = textInput.value.trim();
    
    if (!medicalText) {
        showAlert('Please enter medical text to analyze.', 'error');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    loader.classList.add('active');
    
    try {
        const response = await fetch('/analyze_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ medical_text: medicalText })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayTextResults(data);
            textAnalysisComplete = true;
            showAlert('Text analysis completed successfully!', 'success');
            updateCombinedSectionVisibility();
        } else {
            showAlert(data.message || 'Text analysis failed.', 'error');
        }
    } catch (error) {
        console.error('Text analysis error:', error);
        showAlert('Text analysis failed. Please try again.', 'error');
    } finally {
        // Hide loading state
        analyzeBtn.disabled = false;
        loader.classList.remove('active');
    }
}

function displayTextResults(data) {
    const resultsArea = document.getElementById('text-results');
    const probValue = document.getElementById('text-prob-value');
    const mriStatus = document.getElementById('text-mri-status');
    const statusIcon = document.getElementById('text-status-icon');
    const statusText = document.getElementById('text-status-text');
    const symptomsTable = document.getElementById('symptoms-tbody');
    const analysisContent = document.getElementById('analysis-content');
    
    // Update probability
    probValue.textContent = data.probability.toFixed(3);
    
    // Update MRI status
    if (data.mri_needed) {
        mriStatus.classList.add('warning');
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'MRI Required';
    } else {
        mriStatus.classList.remove('warning');
        statusIcon.textContent = '✓';
        statusText.textContent = 'No MRI Required';
    }
    
    // Update symptoms table
    symptomsTable.innerHTML = '';
    data.dataframe.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Symptom}</td>
            <td>${getDurationLabel(row.Duration)}</td>
            <td>${row.Organ}</td>
            <td>${row.Result}</td>
        `;
        symptomsTable.appendChild(tr);
    });
    
    // Update professional analysis
    analysisContent.innerHTML = formatProfessionalAnalysis(data.professional_analysis);
    
    // Show results
    resultsArea.style.display = 'block';
    resultsArea.scrollIntoView({ behavior: 'smooth' });
}

function getDurationLabel(duration) {
    const durationMap = {
        '1': 'Hours',
        '2': 'Days',
        '3': 'Months',
        '4': 'Year',
        '5': 'Seconds',
        '6': 'Minutes',
        '7': 'Years',
        '8': 'No duration specified'
    };
    return durationMap[duration] || duration;
}

function formatProfessionalAnalysis(analysis) {
    // Simple formatting for professional analysis
    return analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function startEMGStatusMonitoring() {
    // Monitor EMG status every 2 seconds
    emgStatusInterval = setInterval(updateEMGStatus, 2000);
    updateEMGStatus(); // Initial update
}

async function updateEMGStatus() {
    try {
        const response = await fetch('/emg_status');
        const data = await response.json();
        
        // Update status display
        document.getElementById('total-samples').textContent = data.total_samples.toLocaleString();
        document.getElementById('samples-needed').textContent = data.samples_needed.toLocaleString();
        
        // Update progress
        const progress = Math.min(100, (data.total_samples / 23437) * 100);
        document.getElementById('emg-progress-fill').style.width = progress + '%';
        document.getElementById('emg-progress-text').textContent = progress.toFixed(1) + '% Complete';
        
        // Update analyze button state
        const analyzeBtn = document.getElementById('emg-analyze-btn');
        if (data.ready_for_analysis && data.model_loaded) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('disabled');
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('disabled');
        }
        
    } catch (error) {
        console.error('EMG status update error:', error);
    }
}

async function analyzeEMG() {
    const analyzeBtn = document.getElementById('emg-analyze-btn');
    const loader = document.getElementById('emg-loader');
    const resultsArea = document.getElementById('emg-results');
    
    // Show loading state
    analyzeBtn.disabled = true;
    loader.classList.add('active');
    
    try {
        const response = await fetch('/analyze_emg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayEMGResults(data.analysis);
            emgAnalysisComplete = true;
            showAlert('EMG analysis completed successfully!', 'success');
            updateCombinedSectionVisibility();
        } else {
            showAlert(data.message || 'EMG analysis failed.', 'error');
        }
    } catch (error) {
        console.error('EMG analysis error:', error);
        showAlert('EMG analysis failed. Please try again.', 'error');
    } finally {
        // Hide loading state
        analyzeBtn.disabled = false;
        loader.classList.remove('active');
    }
}

function displayEMGResults(analysis) {
    const resultsArea = document.getElementById('emg-results');
    const probValue = document.getElementById('emg-prob-value');
    const mriStatus = document.getElementById('emg-mri-status');
    const statusIcon = document.getElementById('emg-status-icon');
    const statusText = document.getElementById('emg-status-text');
    const confidenceFill = document.getElementById('emg-confidence-fill');
    const confidenceText = document.getElementById('emg-confidence-text');
    
    // Update probability
    probValue.textContent = analysis.probability.toFixed(3);
    
    // Update MRI status
    if (analysis.predicted_class === 1) {
        mriStatus.classList.add('warning');
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'ALS Positive';
    } else {
        mriStatus.classList.remove('warning');
        statusIcon.textContent = '✓';
        statusText.textContent = 'Healthy';
    }
    
    // Update confidence meter
    const confidencePercent = analysis.confidence * 100;
    confidenceFill.style.width = confidencePercent + '%';
    confidenceText.textContent = confidencePercent.toFixed(1) + '%';
    
    // Show results
    resultsArea.style.display = 'block';
    resultsArea.scrollIntoView({ behavior: 'smooth' });
}

function updateCombinedSectionVisibility() {
    const combinedSection = document.getElementById('combined-section');
    
    if (textAnalysisComplete && emgAnalysisComplete) {
        combinedSection.style.display = 'block';
        combinedSection.scrollIntoView({ behavior: 'smooth' });
        
        // Update fusion visual with probabilities
        updateFusionVisual();
    } else {
        combinedSection.style.display = 'none';
    }
}

function updateFusionVisual() {
    const textProb = document.getElementById('text-prob-value').textContent;
    const emgProb = document.getElementById('emg-prob-value').textContent;
    
    document.getElementById('fusion-text-prob').textContent = textProb;
    document.getElementById('fusion-emg-prob').textContent = emgProb;
}

async function combineAnalysis() {
    const combineBtn = document.getElementById('combine-btn');
    const loader = document.getElementById('combine-loader');
    const finalResults = document.getElementById('final-results');
    
    // Show loading state
    combineBtn.disabled = true;
    loader.classList.add('active');
    
    try {
        const response = await fetch('/combine_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            displayCombinedResults(data.combined_analysis);
            showAlert('Combined analysis completed successfully!', 'success');
        } else {
            showAlert(data.message || 'Combined analysis failed.', 'error');
        }
    } catch (error) {
        console.error('Combined analysis error:', error);
        showAlert('Combined analysis failed. Please try again.', 'error');
    } finally {
        // Hide loading state
        combineBtn.disabled = false;
        loader.classList.remove('active');
    }
}

function displayCombinedResults(analysis) {
    const finalResults = document.getElementById('final-results');
    const combinedProbValue = document.getElementById('combined-prob-value');
    const finalDecision = document.getElementById('final-decision');
    const decisionIcon = document.getElementById('decision-icon');
    const decisionText = document.getElementById('decision-text');
    const decisionConfidence = document.getElementById('decision-confidence');
    
    // Update combined probability
    combinedProbValue.textContent = analysis.combined_probability.toFixed(3);
    
    // Update final decision
    if (analysis.mri_required) {
        finalDecision.classList.add('warning');
        decisionIcon.textContent = '⚠️';
        decisionText.textContent = 'MRI Required';
    } else {
        finalDecision.classList.remove('warning');
        decisionIcon.textContent = '✓';
        decisionText.textContent = 'No MRI Required';
    }
    
    // Update confidence
    const confidencePercent = analysis.confidence * 100;
    decisionConfidence.textContent = `Confidence: ${confidencePercent.toFixed(1)}%`;
    
    // Show results
    finalResults.style.display = 'block';
    finalResults.scrollIntoView({ behavior: 'smooth' });
}

async function clearEMG() {
    if (!confirm('Are you sure you want to clear all EMG samples? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/clear_emg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Hide EMG results
            document.getElementById('emg-results').style.display = 'none';
            emgAnalysisComplete = false;
            updateCombinedSectionVisibility();
            showAlert('EMG samples cleared successfully!', 'success');
        } else {
            showAlert(data.message || 'Failed to clear EMG samples.', 'error');
        }
    } catch (error) {
        console.error('Clear EMG error:', error);
        showAlert('Failed to clear EMG samples. Please try again.', 'error');
    }
}

async function resetAnalysis() {
    if (!confirm('Are you sure you want to reset all analysis results? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/reset_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Reset UI states
            textAnalysisComplete = false;
            emgAnalysisComplete = false;
            
            // Hide results areas
            document.getElementById('text-results').style.display = 'none';
            document.getElementById('emg-results').style.display = 'none';
            document.getElementById('final-results').style.display = 'none';
            
            // Clear text input
            document.getElementById('medical-text').value = '';
            
            // Update combined section visibility
            updateCombinedSectionVisibility();
            
            showAlert('Analysis reset successfully!', 'success');
        } else {
            showAlert(data.message || 'Failed to reset analysis.', 'error');
        }
    } catch (error) {
        console.error('Reset analysis error:', error);
        showAlert('Failed to reset analysis. Please try again.', 'error');
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.alert-container');
    const alertId = `alert-${Date.now()}`;
    
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }
    }, 5000);
    
    // Allow manual dismissal
    alertElement.addEventListener('click', () => {
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    });
}

// Cleanup function
window.addEventListener('beforeunload', function() {
    if (emgStatusInterval) {
        clearInterval(emgStatusInterval);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to analyze text
    if (e.ctrlKey && e.key === 'Enter') {
        const textInput = document.getElementById('medical-text');
        if (textInput === document.activeElement) {
            analyzeText();
        }
    }
    
    // Escape to clear alerts
    if (e.key === 'Escape') {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.click();
        });
    }
});

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add visual feedback for button interactions
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
}); 