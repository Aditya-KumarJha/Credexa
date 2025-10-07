# Production Deployment Guide - Render.com

## ML Forensics Feature Setup

### 1. Environment Configuration

Add these environment variables in Render dashboard:

```bash
# Python Configuration
PYTHON_VERSION=3.11.0
```

### 2. Build Command

Update your Render build command to install Python dependencies:

```bash
# In Render dashboard -> Settings -> Build Command:
cd backend && npm install && cd ../fraudCertificate && pip install -r requirements.txt
```

### 3. Start Command

Your start command should remain:
```bash
cd backend && npm start
```

### 4. Git LFS Setup in Render

Render supports Git LFS by default, but you need to ensure the files are downloaded:

1. Go to Render Dashboard
2. Settings → Environment
3. Add: `GIT_LFS_SKIP_SMUDGE=0`

### 5. System Dependencies

Create a `render.yaml` file in your root directory:

```yaml
services:
  - type: web
    name: credexa
    env: node
    plan: starter
    buildCommand: |
      cd backend && npm install && 
      cd ../fraudCertificate && pip install -r requirements.txt
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: GIT_LFS_SKIP_SMUDGE
        value: "0"
```

### 6. Memory Requirements

⚠️ **Important**: The ML model requires **~2GB RAM**. 

- **Starter Plan (512MB)**: Will likely fail with memory errors
- **Standard Plan (2GB+)**: Required for forensics feature
- **Alternative**: Disable forensics in production if using starter plan

### 7. Testing Deployment

After deployment, test the forensics system:

1. Check health: `GET https://your-app.onrender.com/api/credentials/forensics/health`
2. Test forensics: `GET https://your-app.onrender.com/api/credentials/{id}/forensics`

### 8. Troubleshooting

**Common Issues:**

1. **Python not found**
   - Solution: Ensure build command installs Python dependencies
   - Check logs for Python installation errors

2. **Model file not found**
   - Solution: Verify Git LFS is working (`GIT_LFS_SKIP_SMUDGE=0`)
   - Check if `fraudCertificate/weights/detector_weights.pth` exists

3. **Memory errors**
   - Solution: Upgrade to Standard plan (2GB+ RAM)
   - Or disable forensics feature temporarily

4. **Timeout errors**
   - ML processing takes 30-60 seconds
   - Ensure frontend has proper timeout handling

### 9. Graceful Degradation

The system is designed to gracefully handle missing ML setup:

- Health check endpoint reports system status
- Clear error messages for users
- Forensics feature can be disabled without breaking the app

### 10. Cost Considerations

**Render Plans:**
- **Starter ($7/month)**: 512MB RAM - forensics will fail
- **Standard ($25/month)**: 2GB RAM - forensics will work
- **Pro ($85/month)**: 4GB RAM - faster forensics processing

**Recommendation**: Start with Standard plan for full functionality.

---

## Quick Deployment Checklist

- [ ] Update build command to install Python deps
- [ ] Set `GIT_LFS_SKIP_SMUDGE=0` environment variable
- [ ] Ensure plan has 2GB+ RAM
- [ ] Test health endpoint after deployment
- [ ] Monitor logs during first forensics request

## Emergency Rollback

If forensics causes issues, you can disable it by:

1. Comment out forensics routes in `credentialRoutes.js`
2. Remove forensics UI button in frontend
3. Redeploy without ML dependencies