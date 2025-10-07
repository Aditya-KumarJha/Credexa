# Forensics Model Setup

This project uses a machine learning model for certificate fraud detection. Due to the large file size (~516MB), the model files are not included in the repository.

## Setup Instructions

### 1. Download the Model
```bash
# Create the fraudCertificate directory
mkdir fraudCertificate
cd fraudCertificate

# Clone the original model repository
git clone https://github.com/mohitkumar1424/Certificate_Detection.git .

# Or download just the model weights
# wget https://drive.google.com/file/d/1scOAVxvqYSfRi4s7s0crk2Ieqn5Cm6r6/view?usp=sharing
```

### 2. Install Python Dependencies
```bash
cd fraudCertificate
pip install -r requirements.txt
```

### 3. Test the Model
```bash
python test.py
```

## Project Structure
```
Credexa/
├── backend/
│   └── src/controllers/fraudController.js  # Forensics API endpoint
├── frontend/
│   └── src/components/.../CredentialDetailsModal.tsx  # Forensics UI
└── fraudCertificate/  # Model files (not in repo)
    ├── detector_weights.pth  # ML model weights (~516MB)
    ├── run_predict_with_metrics.py  # Enhanced wrapper
    └── ...
```

## Attribution
The ML model is from: https://github.com/mohitkumar1424/Certificate_Detection
Please respect the original repository's licensing terms.