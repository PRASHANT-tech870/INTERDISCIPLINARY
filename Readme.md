# NeuroMed AI - Combined Medical Analysis Platform

A comprehensive web application that combines medical text analysis and EMG signal processing for advanced MRI requirement prediction using Linear Opinion Pool methodology.

## 🌟 Features

### 1. **Welcome Page**
- Dark medical/neural network themed design
- Interactive animations and neural network background
- Project overview and technology stack presentation
- Smooth transitions and hover effects

### 2. **Medical Text Analysis** (91.8% Accuracy)
- Natural Language Processing for medical symptom extraction
- Symptom duration and organ mapping
- Professional LLM-powered analysis using Groq
- MRI requirement prediction based on symptom patterns

### 3. **EMG Signal Analysis** (97.6% Accuracy)
- Real-time EMG data collection from ESP32 sensors
- Deep neural network analysis using ALSNet model
- ALS detection with confidence scoring
- Progress tracking for 23,437 required samples

### 4. **Combined Analysis - Linear Opinion Pool**
- Intelligent fusion of both analysis methods
- Weighted combination: Text (91.8%) + EMG (97.6%)
- Formula: `p = (p1×0.918 + p2×0.976) / (0.918+0.976)`
- Final MRI recommendation with confidence level

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- All dependencies from your existing `requirements.txt`
- `ALSNet3.hdf5` model file (for EMG analysis)

### Installation

1. **Clone and navigate to your project directory**
   ```bash
   cd /path/to/your/IDP/project
   ```

2. **Install dependencies** (if not already installed)
   ```bash
   pip install -r requirements.txt
   ```

3. **Ensure ALSNet3.hdf5 is in the project root**
   ```bash
   ls ALSNet3.hdf5  # Should exist for EMG analysis
   ```

### Running the Application

1. **Start the combined server**
   ```bash
   python combined_app.py
   ```

2. **Access the application**
   - Open your browser and go to: `http://localhost:5002`
   - You'll see the welcome page with project overview

3. **Navigate to analysis**
   - Click "Enter Medical Analysis Platform" button
   - You'll be redirected to the main analysis interface

## 🔧 How to Use

### Step 1: Medical Text Analysis
1. **Enter medical text** in the left panel
   - Example: "Patient complains of severe headache for 3 days, blurred vision, and neck stiffness"
2. **Click "Analyze Text"**
3. **View results:**
   - MRI requirement prediction (probability 0-1)
   - Detected symptoms table
   - Professional LLM analysis

### Step 2: EMG Signal Collection
1. **Monitor EMG status** in the right panel
   - Total samples collected
   - Progress towards 23,437 samples
2. **Send EMG data** from ESP32 to endpoint:
   ```
   POST http://localhost:5002/emg
   Content-Type: application/json
   {
     "emg": [sample1, sample2, sample3, ...]
   }
   ```
3. **Click "Deep Neural Analysis"** when ready
4. **View EMG results:**
   - ALS detection probability
   - Confidence level
   - Health status

### Step 3: Combined Analysis
1. **Complete both analyses** above
2. **Combined section** appears automatically
3. **View fusion visualization:**
   - Text model probability
   - EMG model probability
   - Linear Opinion Pool formula
4. **Click "Combine Analysis"**
5. **Get final recommendation:**
   - Combined probability
   - Final MRI decision
   - Overall confidence

## 📊 API Endpoints

### Text Analysis
- `POST /analyze_text` - Analyze medical text
- `GET /` - Welcome page
- `GET /main` - Main analysis interface

### EMG Analysis
- `POST /emg` - Receive EMG samples from ESP32
- `POST /analyze_emg` - Analyze collected EMG data
- `GET /emg_status` - Get EMG collection status
- `POST /clear_emg` - Clear all EMG samples

### Combined Analysis
- `POST /combine_analysis` - Combine both analyses
- `POST /reset_analysis` - Reset all analysis results

## 🎨 Features & UI

### Dark Medical Theme
- Neural network background animations
- Gradient color schemes (blue/cyan/pink)
- Smooth transitions and hover effects
- Responsive design for all screen sizes

### Interactive Elements
- Real-time EMG progress tracking
- Dynamic result visualization
- Alert system for user feedback
- Keyboard shortcuts (Ctrl+Enter for text analysis)

### Professional Analysis
- LLM-powered medical insights
- Symptom-duration mapping
- Organ-specific analysis
- Confidence scoring for all predictions

## 🔬 Technical Details

### Linear Opinion Pool Formula
```
p = (p1 × a1 + p2 × a2) / (a1 + a2)
```
Where:
- `p1` = Text analysis probability
- `p2` = EMG analysis probability  
- `a1` = 0.918 (91.8% text model accuracy)
- `a2` = 0.976 (97.6% EMG model accuracy)
- `p` = Combined probability

### Decision Threshold
- If `p > 0.5` → **MRI Required**
- If `p ≤ 0.5` → **No MRI Required**

## 🗂️ File Structure

```
IDP/
├── combined_app.py           # Main Flask application
├── templates/
│   ├── welcome.html         # Welcome page template
│   └── main.html           # Main analysis interface
├── static/
│   ├── css/
│   │   ├── welcome.css     # Welcome page styles
│   │   └── main.css        # Main page styles
│   └── js/
│       ├── welcome.js      # Welcome page interactions
│       └── main.js         # Main page functionality
├── Utils/                  # Your existing utility modules
├── app.py                  # Original Streamlit app (unchanged)
├── data_esp32.py          # Original Flask EMG server (unchanged)
└── ALSNet3.hdf5           # EMG analysis model
```

## 🚨 Important Notes

1. **Model Dependencies**: Ensure `ALSNet3.hdf5` is present for EMG analysis
2. **Port Usage**: App runs on port 5002 (different from your existing apps)
3. **EMG Data**: Requires exactly 23,437 samples for analysis
4. **Browser Compatibility**: Works best in modern browsers (Chrome, Firefox, Safari)

## 🎯 ESP32 Integration

Send EMG data to the combined server:
```python
import requests
import json

# Send EMG batch
emg_data = {
    "emg": [sample1, sample2, sample3, ...]  # Your EMG samples
}

response = requests.post(
    "http://localhost:5002/emg",
    json=emg_data,
    headers={"Content-Type": "application/json"}
)
```

## 🐛 Troubleshooting

### Common Issues:
1. **Model not found**: Ensure `ALSNet3.hdf5` is in the project root
2. **Port conflicts**: Stop other Flask servers running on port 5002
3. **EMG analysis disabled**: Check TensorFlow installation
4. **Text analysis fails**: Verify Groq API key and Utils modules

### Debug Mode:
The app runs in debug mode by default. Check console for detailed error messages.

## 🎉 Success!

Your combined medical analysis platform is now ready! The application successfully integrates:
- ✅ Medical text analysis with NLP
- ✅ EMG signal processing with deep learning
- ✅ Linear Opinion Pool fusion methodology
- ✅ Beautiful dark medical UI theme
- ✅ Real-time data collection and analysis

Access your application at: **http://localhost:5002** 