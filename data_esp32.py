from flask import Flask, request, jsonify, Response
import numpy as np
from tensorflow.keras.models import load_model
import os

app = Flask(__name__)
all_samples = []
model = None

def load_als_model():
    """Load the ALSNet model"""
    global model
    try:
        model = load_model('ALSNet3.hdf5')
        print("✅ ALSNet model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

@app.route('/emg', methods=['POST'])
def receive_emg():
    global all_samples
    data = request.get_json()
    if not data or 'emg' not in data:
        return jsonify({"status": "error", "message": "Missing 'emg' key"}), 400

    batch = data['emg']
    all_samples.extend(batch)
    print(f"📊 Received batch of {len(batch)} samples. Total: {len(all_samples)}")
    return jsonify({"status": "success", "received": len(batch), "total": len(all_samples)})

@app.route('/analyze', methods=['POST'])
def analyze_emg():
    """Analyze the most recent 23437 samples using ALSNet model"""
    global all_samples, model
    
    if model is None:
        return jsonify({
            "status": "error", 
            "message": "Model not loaded. Please ensure ALSNet3.hdf5 is available."
        }), 500
    
    if len(all_samples) < 23437:
        return jsonify({
            "status": "error", 
            "message": f"Insufficient samples. Need 23437, have {len(all_samples)}"
        }), 400
    
    try:
        # Get the most recent 23437 samples
        recent_samples = all_samples[-23437:]
        
        # Convert to numpy array and reshape for the model
        input_signal = np.array(recent_samples).reshape(1, 23437, 1)
        
        # Run inference
        yhat_prob = model.predict(input_signal, verbose=0)
        yhat_class = (yhat_prob >= 0.5).astype(int)
        
        probability = float(yhat_prob[0][0])
        predicted_class = int(yhat_class[0][0])
        
        # Determine condition based on prediction
        condition = "ALS Positive" if predicted_class == 1 else "Healthy"
        confidence = probability if predicted_class == 1 else (1 - probability)
        
        return jsonify({
            "status": "success",
            "analysis": {
                "probability": probability,
                "predicted_class": predicted_class,
                "condition": condition,
                "confidence": confidence,
                "samples_analyzed": 23437,
                "total_samples": len(all_samples)
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Analysis failed: {str(e)}"
        }), 500

@app.route('/show', methods=['GET'])
def show_samples():
    return jsonify({
        "total_samples": len(all_samples),
        "samples": all_samples[-100:] if len(all_samples) > 100 else all_samples,  # Show last 100 for performance
        "ready_for_analysis": len(all_samples) >= 23437
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Get current system status"""
    return jsonify({
        "total_samples": len(all_samples),
        "ready_for_analysis": len(all_samples) >= 23437,
        "model_loaded": model is not None,
        "samples_needed": max(0, 23437 - len(all_samples))
    })

@app.route('/clear', methods=['POST'])
def clear_samples():
    """Clear all collected samples"""
    global all_samples
    all_samples = []
    return jsonify({"status": "success", "message": "All samples cleared"})

@app.route('/view', methods=['GET'])
def view_page():
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ALSNet Neural Analysis Platform</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                text-align: center;
                margin-bottom: 40px;
                color: white;
            }

            .header h1 {
                font-size: 3.5rem;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .header p {
                font-size: 1.3rem;
                opacity: 0.9;
                font-weight: 300;
            }

            .dashboard {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 40px;
            }

            .card {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                transition: transform 0.3s ease;
            }

            .card:hover {
                transform: translateY(-5px);
            }

            .card h2 {
                font-size: 1.8rem;
                margin-bottom: 20px;
                color: #4a5568;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .status-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }

            .status-item {
                padding: 15px;
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 12px;
                text-align: center;
                border-left: 4px solid #667eea;
            }

            .status-value {
                font-size: 2rem;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 5px;
            }

            .status-label {
                color: #718096;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .progress-container {
                margin-bottom: 25px;
            }

            .progress-bar {
                width: 100%;
                height: 12px;
                background: #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 10px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                transition: width 0.5s ease;
                border-radius: 6px;
            }

            .btn {
                padding: 15px 30px;
                border: none;
                border-radius: 12px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 10px;
                position: relative;
                overflow: hidden;
            }

            .btn:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }

            .btn:hover:before {
                left: 100%;
            }

            .btn-primary {
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                box-shadow: 0 10px 20px rgba(72,187,120,0.3);
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 25px rgba(72,187,120,0.4);
            }

            .btn-primary:disabled {
                background: #a0aec0;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .btn-secondary {
                background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
                color: white;
                box-shadow: 0 10px 20px rgba(237,137,54,0.3);
            }

            .btn-danger {
                background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
                color: white;
                box-shadow: 0 10px 20px rgba(245,101,101,0.3);
            }

            .result-card {
                margin-top: 30px;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                display: none;
            }

            .result-positive {
                background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                border-left: 5px solid #e53e3e;
                color: #742a2a;
            }

            .result-negative {
                background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
                border-left: 5px solid #38a169;
                color: #1a365d;
            }

            .result-title {
                font-size: 1.5rem;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .confidence-meter {
                width: 100%;
                height: 20px;
                background: #e2e8f0;
                border-radius: 10px;
                margin: 15px 0;
                overflow: hidden;
            }

            .confidence-fill {
                height: 100%;
                border-radius: 10px;
                transition: width 0.8s ease;
            }

            .loading {
                display: none;
                text-align: center;
                padding: 20px;
            }

            .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .icon {
                font-size: 1.5rem;
            }

            .alert {
                padding: 15px;
                border-radius: 10px;
                margin: 15px 0;
                display: none;
            }

            .alert-error {
                background: #fed7d7;
                color: #742a2a;
                border-left: 4px solid #e53e3e;
            }

            .full-width {
                grid-column: 1 / -1;
            }

            @media (max-width: 768px) {
                .dashboard {
                    grid-template-columns: 1fr;
                }
                
                .header h1 {
                    font-size: 2.5rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧠 ALSNet Neural Analysis Platform</h1>
                <p>Advanced EMG Signal Processing & ALS Detection System</p>
            </div>

            <div class="dashboard">
                <div class="card">
                    <h2><span class="icon">📊</span> Data Collection Status</h2>
                    
                    <div class="status-grid">
                        <div class="status-item">
                            <div class="status-value" id="total-samples">0</div>
                            <div class="status-label">Total Samples</div>
                        </div>
                        <div class="status-item">
                            <div class="status-value" id="samples-needed">23437</div>
                            <div class="status-label">Samples Needed</div>
                        </div>
                    </div>

                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                        </div>
                        <div style="text-align: center; color: #718096; font-size: 0.9rem;">
                            <span id="progress-text">0% Complete</span>
                        </div>
                    </div>

                    <div style="text-align: center;">
                        <button class="btn btn-secondary" onclick="refreshData()">🔄 Refresh Data</button>
                        <button class="btn btn-danger" onclick="clearData()">🗑️ Clear All</button>
                    </div>
                </div>

                <div class="card">
                    <h2><span class="icon">🔬</span> Neural Analysis</h2>
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div id="ready-status" style="padding: 15px; border-radius: 10px; margin-bottom: 15px; background: #fed7d7; color: #742a2a;">
                            ⏳ Collecting samples...
                        </div>
                        <button class="btn btn-primary" id="analyze-btn" onclick="runAnalysis()" disabled>
                            🧠 Deep Neural Analysis
                        </button>
                    </div>

                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p>Processing neural network inference...</p>
                    </div>

                    <div class="alert alert-error" id="error-alert"></div>

                    <div class="result-card" id="result-card">
                        <div class="result-title" id="result-title"></div>
                        <div id="result-details"></div>
                        <div class="confidence-meter">
                            <div class="confidence-fill" id="confidence-fill"></div>
                        </div>
                        <div id="confidence-text"></div>
                    </div>
                </div>

                <div class="card full-width">
                    <h2><span class="icon">📈</span> Recent EMG Signal Data</h2>
                    <div style="background: #1a202c; color: #e2e8f0; padding: 20px; border-radius: 10px; font-family: 'Courier New', monospace; max-height: 300px; overflow-y: auto;" id="sample-data">
                        Loading signal data...
                    </div>
                </div>
            </div>
        </div>

        <script>
            let updateInterval;

            function updateStatus() {
                fetch('/status')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('total-samples').textContent = data.total_samples.toLocaleString();
                        document.getElementById('samples-needed').textContent = data.samples_needed.toLocaleString();
                        
                        const progress = Math.min(100, (data.total_samples / 23437) * 100);
                        document.getElementById('progress-fill').style.width = progress + '%';
                        document.getElementById('progress-text').textContent = progress.toFixed(1) + '% Complete';
                        
                        const analyzeBtn = document.getElementById('analyze-btn');
                        const readyStatus = document.getElementById('ready-status');
                        
                        if (data.ready_for_analysis && data.model_loaded) {
                            analyzeBtn.disabled = false;
                            readyStatus.innerHTML = '✅ Ready for analysis!';
                            readyStatus.className = 'ready-positive';
                            readyStatus.style.background = '#c6f6d5';
                            readyStatus.style.color = '#1a365d';
                        } else if (!data.model_loaded) {
                            analyzeBtn.disabled = true;
                            readyStatus.innerHTML = '❌ Model not loaded';
                            readyStatus.style.background = '#fed7d7';
                            readyStatus.style.color = '#742a2a';
                        } else {
                            analyzeBtn.disabled = true;
                            readyStatus.innerHTML = `⏳ Need ${data.samples_needed.toLocaleString()} more samples`;
                            readyStatus.style.background = '#fed7d7';
                            readyStatus.style.color = '#742a2a';
                        }
                    })
                    .catch(err => {
                        console.error('Status update failed:', err);
                    });
            }

            function updateSampleData() {
                fetch('/show')
                    .then(response => response.json())
                    .then(data => {
                        const sampleData = document.getElementById('sample-data');
                        if (data.samples && data.samples.length > 0) {
                            const recentSamples = data.samples.slice(-50);
                            sampleData.textContent = 'Recent samples: [' + recentSamples.join(', ') + ']';
                        } else {
                            sampleData.textContent = 'No samples received yet...';
                        }
                    })
                    .catch(err => {
                        document.getElementById('sample-data').textContent = 'Failed to load sample data.';
                        console.error(err);
                    });
            }

            function runAnalysis() {
                const loadingDiv = document.getElementById('loading');
                const resultCard = document.getElementById('result-card');
                const errorAlert = document.getElementById('error-alert');
                const analyzeBtn = document.getElementById('analyze-btn');

                loadingDiv.style.display = 'block';
                resultCard.style.display = 'none';
                errorAlert.style.display = 'none';
                analyzeBtn.disabled = true;

                fetch('/analyze', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        loadingDiv.style.display = 'none';
                        analyzeBtn.disabled = false;

                        if (data.status === 'success') {
                            const analysis = data.analysis;
                            const isPositive = analysis.predicted_class === 1;
                            
                            resultCard.className = 'result-card ' + (isPositive ? 'result-positive' : 'result-negative');
                            resultCard.style.display = 'block';
                            
                            document.getElementById('result-title').textContent = 
                                isPositive ? '⚠️ ALS Indicators Detected' : '✅ Healthy Neural Patterns';
                            
                            document.getElementById('result-details').innerHTML = `
                                <p><strong>Prediction:</strong> ${analysis.condition}</p>
                                <p><strong>Neural Network Confidence:</strong> ${(analysis.confidence * 100).toFixed(2)}%</p>
                                <p><strong>Raw Probability:</strong> ${analysis.probability.toFixed(4)}</p>
                                <p><strong>Samples Analyzed:</strong> ${analysis.samples_analyzed.toLocaleString()}</p>
                            `;
                            
                            const confidenceFill = document.getElementById('confidence-fill');
                            confidenceFill.style.width = (analysis.confidence * 100) + '%';
                            confidenceFill.style.background = isPositive ? 
                                'linear-gradient(90deg, #f56565, #e53e3e)' : 
                                'linear-gradient(90deg, #48bb78, #38a169)';
                            
                            document.getElementById('confidence-text').textContent = 
                                `Confidence: ${(analysis.confidence * 100).toFixed(1)}%`;
                        } else {
                            errorAlert.textContent = data.message;
                            errorAlert.style.display = 'block';
                        }
                    })
                    .catch(err => {
                        loadingDiv.style.display = 'none';
                        analyzeBtn.disabled = false;
                        errorAlert.textContent = 'Analysis failed: ' + err.message;
                        errorAlert.style.display = 'block';
                        console.error('Analysis failed:', err);
                    });
            }

            function refreshData() {
                updateStatus();
                updateSampleData();
            }

            function clearData() {
                if (confirm('Are you sure you want to clear all collected samples? This cannot be undone.')) {
                    fetch('/clear', { method: 'POST' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                refreshData();
                                document.getElementById('result-card').style.display = 'none';
                            }
                        })
                        .catch(err => console.error('Clear failed:', err));
                }
            }

            // Initialize and start auto-updates
            refreshData();
            updateInterval = setInterval(refreshData, 2000);
        </script>
    </body>
    </html>
    """
    return Response(html, mimetype='text/html')

def run_server():
    print("🚀 Starting ALSNet Analysis Server...")
    print("📊 Loading neural network model...")
    
    if load_als_model():
        print("✅ Server ready!")
        print("🌐 Access the interface at: http://localhost:5000/view")
    else:
        print("⚠️  Server starting without model. Place ALSNet3.hdf5 in the same directory.")
    
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    run_server()