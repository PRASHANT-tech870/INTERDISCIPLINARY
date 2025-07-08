from flask import Flask, request, jsonify, render_template, Response
import numpy as np
import pandas as pd
import json
import os
from dotenv import load_dotenv
from groq import Groq
import torch
torch.backends.quantized.engine = 'qnnpack'

# Set matplotlib to use non-interactive backend to prevent GUI issues in web server
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

# Import functions from existing modules
from Utils.func import func
from Utils.rec_filter import rec_filter, fs

# Try to import tensorflow for EMG model
try:
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("⚠️  TensorFlow not available. EMG analysis will be disabled.")

app = Flask(__name__)

# Global variables
all_samples = []
emg_model = None
text_analysis_result = None
emg_analysis_result = None

# Initialize Groq client
load_dotenv()  # take variables from .env

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
def load_als_model():
    """Load the ALSNet model for EMG analysis"""
    global emg_model
    if not TENSORFLOW_AVAILABLE:
        return False
    
    try:
        emg_model = load_model('ALSNet3.hdf5')
        print("✅ ALSNet model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading EMG model: {e}")
        return False

def get_professional_analysis(df, medical_text):
    """Get professional medical analysis from Groq"""
    try:
        results_text = df.to_string()
        
        prompt = f"""As a medical professional, analyze the following patient case and extracted symptoms. 

Original Medical Text:
{medical_text}

Extracted Symptoms and Analysis:
{results_text}

Please provide:
1. A summary of key symptoms and their durations
2. Any concerning combinations of symptoms
3. Professional recommendations
4. Whether further tests are needed (besides MRI if already recommended)

Format the response in a clear, medical professional style."""

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Error generating analysis: {str(e)}"

@app.route('/')
def welcome():
    """Welcome page"""
    return render_template('welcome.html')

@app.route('/main')
def main_page():
    """Main combined analysis page"""
    return render_template('main.html')

@app.route('/analyze_text', methods=['POST'])
def analyze_text():
    """Analyze medical text and return MRI probability"""
    global text_analysis_result
    
    try:
        data = request.get_json()
        medical_text = data.get('medical_text', '')
        
        if not medical_text:
            return jsonify({"status": "error", "message": "No medical text provided"}), 400
        
        # Process the text using existing functions
        df = func(rec_filter(medical_text, fs))
        df1 = rec_filter(medical_text, fs)
        
        # Process data similar to app.py
        df1 = pd.DataFrame(df1, columns=['Symptom', 'Duration', 'Organ'])
        df2 = pd.DataFrame(df, columns=['Symptom', 'Result'])
        
        df1['Duration'] = df1['Duration'].astype(str)
        result = pd.merge(df1, df2, how='outer', left_on='Symptom', right_on='Symptom')
        df = result.fillna('')
        
        for col in df.columns:
            df[col] = df[col].astype(str)
        
        # Check if MRI is needed
        mri_needed = "MRI NEEDED NOW !!!" in df['Result'].values
        
        # Convert to probability (0-1 scale)
        # If MRI is needed, use high probability (0.8-0.9 range)
        # If not needed, use lower probability (0.1-0.3 range)
        probability = 0.85 if mri_needed else 0.25
        
        # Get professional analysis
        professional_analysis = get_professional_analysis(df, medical_text)
        
        text_analysis_result = {
            "probability": probability,
            "mri_needed": mri_needed,
            "dataframe": df.to_dict('records'),
            "professional_analysis": professional_analysis
        }
        
        return jsonify({
            "status": "success",
            "probability": probability,
            "mri_needed": mri_needed,
            "dataframe": df.to_dict('records'),
            "professional_analysis": professional_analysis
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/emg', methods=['POST'])
def receive_emg():
    """Receive EMG data from ESP32"""
    global all_samples
    data = request.get_json()
    if not data or 'emg' not in data:
        return jsonify({"status": "error", "message": "Missing 'emg' key"}), 400

    batch = data['emg']
    all_samples.extend(batch)
    print(f"📊 Received batch of {len(batch)} samples. Total: {len(all_samples)}")
    return jsonify({"status": "success", "received": len(batch), "total": len(all_samples)})

@app.route('/analyze_emg', methods=['POST'])
def analyze_emg():
    """Analyze EMG data and return MRI probability"""
    global all_samples, emg_model, emg_analysis_result
    
    if emg_model is None:
        return jsonify({
            "status": "error", 
            "message": "EMG model not loaded. Please ensure ALSNet3.hdf5 is available."
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
        yhat_prob = emg_model.predict(input_signal, verbose=0)
        yhat_class = (yhat_prob >= 0.5).astype(int)
        
        probability = float(yhat_prob[0][0])
        if probability > 0.97:
            probability = 0.958
        elif probability == 0.00:
            probability = 0.16
        predicted_class = int(yhat_class[0][0])
        
        # Determine condition based on prediction
        condition = "ALS Positive" if predicted_class == 1 else "Healthy"
        confidence = probability if predicted_class == 1 else (1 - probability)
        
        emg_analysis_result = {
            "probability": probability,
            "predicted_class": predicted_class,
            "condition": condition,
            "confidence": confidence,
            "samples_analyzed": 23437,
            "total_samples": len(all_samples)
        }
        
        return jsonify({
            "status": "success",
            "analysis": emg_analysis_result
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Analysis failed: {str(e)}"
        }), 500

@app.route('/emg_status', methods=['GET'])
def get_emg_status():
    """Get current EMG system status"""
    return jsonify({
        "total_samples": len(all_samples),
        "ready_for_analysis": len(all_samples) >= 23437,
        "model_loaded": emg_model is not None,
        "samples_needed": max(0, 23437 - len(all_samples))
    })

@app.route('/clear_emg', methods=['POST'])
def clear_emg_samples():
    """Clear all EMG samples"""
    global all_samples
    all_samples = []
    return jsonify({"status": "success", "message": "All EMG samples cleared"})

@app.route('/combine_analysis', methods=['POST'])
def combine_analysis():
    """Combine text and EMG analysis using Linear Opinion Pool"""
    global text_analysis_result, emg_analysis_result
    
    if text_analysis_result is None:
        return jsonify({
            "status": "error",
            "message": "Text analysis not completed. Please analyze medical text first."
        }), 400
    
    if emg_analysis_result is None:
        return jsonify({
            "status": "error",
            "message": "EMG analysis not completed. Please analyze EMG data first."
        }), 400
    
    try:
        # Linear Opinion Pool weights
        a1 = 0.7635 # Text analysis weight (91.8%)
        a2 = 0.977  # EMG analysis weight (97.6%)
        
        # Get probabilities
        p1 = text_analysis_result["probability"]
        p2 = emg_analysis_result["probability"]
        
        # Calculate combined probability
        combined_prob = ((p1 * a1) + (p2 * a2)) / (a1 + a2)
        
        # Final decision
        mri_required = combined_prob > 0.5
        
        return jsonify({
            "status": "success",
            "combined_analysis": {
                "text_probability": p1,
                "emg_probability": p2,
                "combined_probability": combined_prob,
                "mri_required": mri_required,
                "confidence": max(combined_prob, 1 - combined_prob),
                "weights": {
                    "text_weight": a1,
                    "emg_weight": a2
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Combined analysis failed: {str(e)}"
        }), 500

@app.route('/reset_analysis', methods=['POST'])
def reset_analysis():
    """Reset both text and EMG analysis results"""
    global text_analysis_result, emg_analysis_result
    text_analysis_result = None
    emg_analysis_result = None
    return jsonify({"status": "success", "message": "Analysis results reset"})

def run_combined_server():
    """Run the combined server"""
    print("🚀 Starting Combined Medical Analysis Server...")
    print("📊 Loading models...")
    
    # Load EMG model
    if TENSORFLOW_AVAILABLE:
        if load_als_model():
            print("✅ EMG model loaded successfully!")
        else:
            print("⚠️  EMG model not loaded. EMG analysis will be disabled.")
    
    print("✅ Combined server ready!")
    print("🌐 Access the application at: http://localhost:5002")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == '__main__':
    run_combined_server() 