# Developer Setup Guide

## Prerequisites for ML Forensics Feature

### 1. Git LFS Installation
The forensics feature uses large ML model files (517MB) stored with Git LFS.

**Install Git LFS:**
```bash
# Windows (using Git for Windows)
git lfs install

# macOS
brew install git-lfs
git lfs install

# Ubuntu/Debian
sudo apt install git-lfs
git lfs install
```

### 2. Clone Repository
```bash
git clone https://github.com/Aditya-KumarJha/Credexa.git
cd Credexa

# Verify LFS files downloaded correctly
git lfs ls-files
# Should show: fraudCertificate/weights/detector_weights.pth
```

**If you cloned before LFS setup:**
```bash
git lfs pull  # Download the large files
```

### 3. Python Environment Setup
The forensics feature requires Python with specific ML dependencies.

**Install Python 3.8+ and dependencies:**
```bash
cd fraudCertificate
pip install -r requirements.txt
```

**Key dependencies:**
- PyTorch
- torchvision  
- PIL (Pillow)
- numpy
- opencv-python

### 4. Verify ML Model Setup
Test that the ML model works:
```bash
cd fraudCertificate
python run_predict_single.py
```

### 5. Backend Setup
```bash
cd backend
npm install
# Copy .env.example to .env and configure
npm run dev
```

### 6. Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### LFS Issues
**Problem:** "Pointer files" instead of actual model files
```bash
# Solution: Install Git LFS and pull files
git lfs install
git lfs pull
```

**Problem:** Large download on first clone
- **Expected:** 517MB download for ML model
- **One-time only:** Subsequent pulls are much smaller

### Python Issues
**Problem:** ModuleNotFoundError
```bash
# Solution: Install missing dependencies
pip install torch torchvision pillow numpy opencv-python
```

**Problem:** CUDA errors (GPU related)
- **Solution:** CPU-only mode works fine for development
- GPU acceleration optional for production

### Memory Issues
**Problem:** Out of memory during ML processing
- **Expected:** Model needs ~2GB RAM for processing
- **Solution:** Close other applications or use smaller test images

## Development Notes

### File Structure
```
fraudCertificate/
├── weights/
│   └── detector_weights.pth (517MB - Git LFS)
├── run_predict_with_metrics.py (Main wrapper)
├── requirements.txt
└── ...other ML files

backend/src/controllers/
└── fraudController.js (API endpoint)

frontend/src/components/dashboard/credentials/
└── CredentialDetailsModal.tsx (UI integration)
```

### API Endpoints
- `GET /api/credentials/:id/forensics` - Run fraud detection
- Requires authentication (JWT token)
- Role-based access (institute users or credential owners)

### Testing Forensics Locally
1. Start backend: `npm run dev` 
2. Start frontend: `npm run dev`
3. Login as institute user or credential owner
4. Click on any certificate → "Run Forensics Analysis"

## Production Considerations

### For Deployment
- Hosting service must support Git LFS
- Python 3.8+ must be installed on server
- Sufficient RAM (2GB+) for ML processing
- CPU processing time: ~30-60 seconds per certificate

### Environment Variables
```env
# No additional env vars needed for forensics
# Uses existing JWT authentication
```

## FAQ

**Q: Do I need GPU for development?**
A: No, CPU-only mode works fine for testing.

**Q: Why is my first clone so large?**
A: The ML model file is 517MB. This is a one-time download.

**Q: Can I skip the ML setup if I'm not working on forensics?**
A: Yes, but you'll get errors if you try to use the forensics feature.

**Q: How much bandwidth does LFS use?**
A: Only when downloading large files. Regular git operations are normal size.

---

Need help? Check the main README.md or contact the team.