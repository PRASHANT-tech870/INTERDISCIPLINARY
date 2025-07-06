import serial
import numpy as np
from collections import deque

# Serial connection
SERIAL_PORT = '/dev/ttyACM0'  # Check using `ls /dev/tty*`
BAUDRATE = 230400
ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)

# Circular buffer for latest N samples
BUFFER_SIZE = 23437  # ~1 second at 24kHz
signal_buffer = deque(maxlen=BUFFER_SIZE)

print("Receiving EMG data from Arduino...")

try:
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        print("Raw:", line)
        
        if line.isdigit():
            signal_buffer.append(int(line))

        # Optional: trigger inference every second
        if len(signal_buffer) == BUFFER_SIZE:
            emg_array = np.array(signal_buffer, dtype=np.float32)

            # Normalize
            emg_array = (emg_array - np.mean(emg_array)) / np.std(emg_array)
            emg_array = emg_array.reshape(1, BUFFER_SIZE, 1)

            # Example placeholder for model inference
            # from tensorflow.keras.models import load_model
            # model = load_model('ALSNet3.hdf5')
            # yhat = model.predict(emg_array)
            # print("Prediction:", yhat)

            # Clear buffer if not overlapping
            signal_buffer.clear()

except KeyboardInterrupt:
    print("Stopped by user")
    ser.close()
