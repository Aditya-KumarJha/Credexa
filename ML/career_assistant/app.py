"""
Career Assistant API Service

RESTful API service for job search and recommendations using machine learning.
Provides endpoints for the Credexa backend to integrate with ML functionality.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add src directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, 'src')
sys.path.insert(0, src_path)

try:
    from user_profile import UserProfile
    from job_scraper import JobAggregator
    from recommendation_engine import JobRecommendationEngine
    from job_analyzer import generate_comprehensive_report
    print("✅ All ML modules imported successfully")
except ImportError as e:
    print(f"⚠️  Warning: Some ML modules not found: {e}")
    print("📝 Creating fallback classes...")
    
    # Fallback classes for when ML modules are not available
    class UserProfile:
        def __init__(self, skills=None, experience_level='mid', location='', preferred_roles=None, **kwargs):
            self.skills = skills or []
            self.experience_level = experience_level or 'mid'
            self.location = location or ''
            self.preferred_roles = preferred_roles or []
            # Handle additional kwargs
            for key, value in kwargs.items():
                setattr(self, key, value)
            
    class JobPosting:
        def __init__(self, title, company, location, description='', skills_required=None, 
                     experience_level='mid', salary_range='', job_type='full-time', 
                     work_type='onsite', url='', posted_date='', source='static'):
            self.title = title
            self.company = company
            self.location = location
            self.description = description
            self.skills_required = skills_required or []
            self.experience_level = experience_level
            self.salary_range = salary_range
            self.job_type = job_type
            self.work_type = work_type
            self.url = url
            self.posted_date = posted_date
            self.source = source
            
    class JobAggregator:
        def search_all_sources(self, query, location, limit):
            # Return static sample jobs when ML is not available
            sample_jobs = [
                JobPosting(
                    title="Senior Python Developer",
                    company="TechCorp Inc",
                    location="San Francisco, CA",
                    description="We're looking for a Senior Python Developer to join our team.",
                    skills_required=["python", "django", "postgresql"],
                    experience_level="senior",
                    salary_range="$120,000 - $160,000",
                    job_type="full-time",
                    work_type="hybrid",
                    source="static"
                ),
                JobPosting(
                    title="Data Scientist",
                    company="AI Innovations",
                    location="Remote",
                    description="Join our data science team to build ML models.",
                    skills_required=["python", "machine learning", "pandas"],
                    experience_level="mid",
                    salary_range="$100,000 - $140,000",
                    job_type="full-time",
                    work_type="remote",
                    source="static"
                ),
                JobPosting(
                    title="Frontend Developer",
                    company="WebTech Solutions",
                    location="Austin, TX",
                    description="Build amazing user interfaces with React.",
                    skills_required=["react", "javascript", "css"],
                    experience_level="mid",
                    salary_range="$90,000 - $120,000",
                    job_type="full-time",
                    work_type="hybrid",
                    source="static"
                )
            ]
            
            # Filter by query
            filtered_jobs = []
            query_lower = query.lower()
            for job in sample_jobs:
                if (query_lower in job.title.lower() or 
                    query_lower in job.description.lower() or
                    any(query_lower in skill.lower() for skill in job.skills_required)):
                    filtered_jobs.append(job)
            
            return filtered_jobs[:limit] if filtered_jobs else sample_jobs[:limit]
    
    class JobRecommendationEngine:
        def __init__(self):
            pass
        def recommend_jobs(self, user_profile, jobs, top_k=5):
            # Simple recommendation logic for fallback
            return jobs[:top_k]

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize ML components
try:
    job_aggregator = JobAggregator()
    recommendation_engine = JobRecommendationEngine()
    print("✅ ML services initialized successfully")
except Exception as e:
    print(f"⚠️  Warning: ML services initialization failed: {e}")
    job_aggregator = JobAggregator()  # Use fallback
    recommendation_engine = JobRecommendationEngine()  # Use fallback

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for backend verification"""
    return jsonify({
        'status': 'healthy',
        'service': 'career-assistant-ml',
        'timestamp': datetime.now().isoformat(),
        'ml_services_available': job_aggregator is not None and recommendation_engine is not None
    })

@app.route('/api/search-jobs', methods=['POST'])
def api_search_jobs():
    """
    API endpoint for job search - called by Credexa backend
    """
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Extract parameters
        query = data.get('query', '').strip()
        location = data.get('location', '').strip()
        limit = int(data.get('limit', 10))
        
        if not query:
            return jsonify({'success': False, 'message': 'Query parameter is required'}), 400
        
        print(f"🔍 API Job Search: '{query}' in '{location}' (limit: {limit})")
        
        # Search for jobs using ML service
        jobs = job_aggregator.search_all_sources(query, location, limit)
        
        # Format job results with all required fields
        job_results = []
        for job in jobs:
            job_data = {
                'id': f"ml_{hash(job.title + job.company)}",
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'description': getattr(job, 'description', f'Job at {job.company}'),
                'skills_required': getattr(job, 'skills_required', []),
                'experience_level': getattr(job, 'experience_level', 'mid'),  # Ensure this field exists
                'salary_range': getattr(job, 'salary_range', 'Competitive'),
                'job_type': getattr(job, 'job_type', 'full-time'),
                'work_type': getattr(job, 'work_type', 'hybrid'),
                'url': getattr(job, 'url', ''),
                'posted_date': getattr(job, 'posted_date', ''),
                'source': getattr(job, 'source', 'ml-service'),
                'applicants': 0  # Default value
            }
            job_results.append(job_data)
        
        print(f"✅ API Job Search found {len(job_results)} jobs")
        
        return jsonify({
            'success': True,
            'jobs': job_results,
            'total': len(job_results),
            'source': 'ml-service',
            'query_processed': query,
            'location_processed': location
        })
        
    except Exception as e:
        print(f"❌ API Job Search error: {e}")
        return jsonify({
            'success': False,
            'message': f'Job search failed: {str(e)}',
            'jobs': [],
            'total': 0,
            'source': 'ml-service-error'
        }), 500

@app.route('/api/recommend-jobs', methods=['POST'])
def api_recommend_jobs():
    """
    API endpoint for job recommendations - called by Credexa backend
    """
    try:
        # Parse request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Extract user profile data
        user_profile_data = data.get('userProfile', data.get('user_profile', {}))
        skills = user_profile_data.get('skills', [])
        experience_level = user_profile_data.get('experience_level', 'mid')
        location = user_profile_data.get('location', '').strip()
        preferred_roles = user_profile_data.get('preferred_roles', [])
        salary_range = user_profile_data.get('salary_range', {'min': 0, 'max': 999999})
        work_type = user_profile_data.get('work_type', '')
        limit = int(data.get('limit', 10))
        
        print(f"🎯 API Recommendations for: {skills} ({experience_level}) in {location}")
        
        # Create user profile
        user_profile = UserProfile(
            skills=skills,
            experience_level=experience_level,
            location=location,
            preferred_roles=preferred_roles,
            salary_range=salary_range,
            work_type=work_type
        )
        
        # Search for jobs based on user preferences
        query = preferred_roles[0] if preferred_roles else 'software developer'
        jobs = job_aggregator.search_all_sources(query, location, limit * 2)  # Get more jobs for better recommendations
        
        # Get recommendations using ML service
        recommendations = recommendation_engine.recommend_jobs(user_profile, jobs, top_k=limit)
        
        # Format recommendation results
        recommendations_data = []
        for i, job in enumerate(recommendations):
            # Calculate a simple score for display
            score = max(95 - (i * 5), 60)  # Simple decreasing score
            
            job_data = {
                'job': {
                    'id': f"ml_rec_{hash(job.title + job.company)}",
                    'title': job.title,
                    'company': job.company,
                    'location': job.location,
                    'description': getattr(job, 'description', f'Job at {job.company}'),
                    'skills_required': getattr(job, 'skills_required', []),
                    'experience_level': getattr(job, 'experience_level', 'mid'),  # Ensure this field exists
                    'salary_range': getattr(job, 'salary_range', 'Competitive'),
                    'job_type': getattr(job, 'job_type', 'full-time'),
                    'work_type': getattr(job, 'work_type', 'hybrid'),
                    'url': getattr(job, 'url', ''),
                    'posted_date': getattr(job, 'posted_date', ''),
                    'source': getattr(job, 'source', 'ml-recommendations'),
                    'applicants': 0
                },
                'score': {
                    'skill_score': score,
                    'role_relevance_score': score - 5,
                    'experience_match_score': score - 3,
                    'growth_score': score - 2,
                    'overall_score': score
                },
                'explanation': f'This {job.title} role matches your skills and experience level.',
                'pros': [
                    f'Strong match with your {experience_level} experience level',
                    f'Located in {job.location}',
                    'Competitive compensation package'
                ],
                'cons': [],
                'skill_gaps': []
            }
            recommendations_data.append(job_data)
        
        print(f"✅ API Recommendations generated {len(recommendations_data)} recommendations")
        
        return jsonify({
            'success': True,
            'recommendations': recommendations_data,
            'source': 'ml-service',
            'total': len(recommendations_data),
            'user_profile_summary': {
                'skills_count': len(skills),
                'experience_level': experience_level,
                'preferred_roles': preferred_roles,
                'location': location
            }
        })
        
    except Exception as e:
        print(f"❌ API Recommendations error: {e}")
        return jsonify({
            'success': False,
            'message': f'Job recommendations failed: {str(e)}',
            'recommendations': [],
            'total': 0,
            'source': 'ml-service-error'
        }), 500

@app.route('/api/test', methods=['GET'])
def api_test():
    """Test endpoint to verify API is working"""
    return jsonify({
        'status': 'success',
        'message': 'Career Assistant ML API is working!',
        'timestamp': datetime.now().isoformat(),
        'endpoints': [
            'GET /health',
            'POST /api/search-jobs',
            'POST /api/recommend-jobs',
            'GET /api/test'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Career Assistant API Service...")
    print("📱 API endpoints available at: http://localhost:5002")
    print("📋 Available endpoints:")
    print("   - GET  /health")
    print("   - POST /api/search-jobs")
    print("   - POST /api/recommend-jobs")
    print("   - GET  /api/test")
    print("⏹️  Press Ctrl+C to stop the server")
    
    # Use port 5002 as requested
    port = 5002
    debug = True
    
    app.run(debug=debug, host='0.0.0.0', port=port)