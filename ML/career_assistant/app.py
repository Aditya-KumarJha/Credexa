"""
Web UI for Career Assistant using Flask

A web-based interface that allows users to input their profile information
and receive job recommendations through a clean, modern web interface.
"""

from flask import Flask, render_template, request, jsonify, send_file
import os
import sys
import json
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
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

# Load environment variables
try:
    from dotenv import load_dotenv
    # Load .env file from parent directory
    env_path = os.path.join(os.path.dirname(current_dir), '.env')
    load_dotenv(env_path)
except ImportError:
    # If python-dotenv is not installed, try to load manually
    env_path = os.path.join(os.path.dirname(current_dir), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

app = Flask(__name__)
app.secret_key = 'career_assistant_secret_key_2025'

# Global instances
job_aggregator = JobAggregator()
recommendation_engine = JobRecommendationEngine()

@app.route('/')
def index():
    """Main page with the user input form."""
    return render_template('index.html')

@app.route('/search_jobs', methods=['POST'])
def search_jobs():
    """Process job search request and return recommendations."""
    try:
        # Get form data
        data = request.get_json()
        
        # Extract user profile data
        skills = [skill.strip() for skill in data.get('skills', '').split(',') if skill.strip()]
        experience_level = data.get('experience_level', 'mid')
        preferred_roles = [role.strip() for role in data.get('preferred_roles', '').split(',') if role.strip()]
        location = data.get('location', '').strip()
        work_type = data.get('work_type', '')
        
        # Salary range
        salary_min = data.get('salary_min')
        salary_max = data.get('salary_max')
        salary_range = None
        if salary_min and salary_max:
            try:
                salary_range = {"min": int(salary_min), "max": int(salary_max)}
            except ValueError:
                pass
        
        # Job search parameters - Enhanced skill-based search strategy
        job_query = data.get('job_query', '').strip()
        if not job_query and preferred_roles:
            job_query = preferred_roles[0]
        elif not job_query and not preferred_roles:
            # Create intelligent search query from all skills
            if len(skills) <= 3:
                # Use all skills if 3 or fewer
                job_query = ' '.join(skills)
            else:
                # For more than 3 skills, create multiple search strategies
                # Strategy 1: Use all skills (primary search)
                job_query = ' '.join(skills)
                
                # Strategy 2: Also prepare a focused search with top skills
                # This will be used in multiple search passes
                focused_query = ' '.join(skills[:3])  # Top 3 for focused search
                
                print(f"🔍 Multi-strategy search: Full query with {len(skills)} skills, focused backup with top 3")
        
        search_location = data.get('search_location', '').strip()
        if not search_location:
            search_location = location
            
        job_limit = int(data.get('job_limit', 25))
        
        # Validate required fields - only skills are now required
        if not skills:
            return jsonify({'error': 'Please enter at least one skill'}), 400
        
        # Create user profile
        user_profile = UserProfile(
            skills=skills,
            experience_level=experience_level,
            preferred_roles=preferred_roles if preferred_roles else [],
            location=location,
            salary_range=salary_range,
            work_type=work_type if work_type != 'any' else None
        )
        
        # Enhanced multi-strategy job search for comprehensive skill coverage
        print(f"🎯 Starting comprehensive job search with {len(skills)} skills: {', '.join(skills)}")
        
        all_jobs = []
        
        # Primary search: Use all skills
        try:
            jobs = job_aggregator.search_all_sources(job_query, search_location, job_limit)
            all_jobs.extend(jobs)
            print(f"📊 Primary search (all skills) found: {len(jobs)} jobs")
        except Exception as e:
            print(f"⚠️ Primary search failed: {e}")
        
        # If we have many skills and limited results, try individual skill searches
        if len(skills) > 3 and len(all_jobs) < 10:
            print("🔄 Running individual skill searches for better coverage...")
            
            for i, skill in enumerate(skills[:5]):  # Search top 5 skills individually
                try:
                    skill_jobs = job_aggregator.search_all_sources(skill, search_location, max(5, job_limit//len(skills)))
                    # Filter out duplicates by URL
                    existing_urls = {job.url for job in all_jobs if job.url}
                    new_jobs = [job for job in skill_jobs if job.url not in existing_urls]
                    all_jobs.extend(new_jobs)
                    print(f"  ✓ '{skill}' search added {len(new_jobs)} new jobs")
                except Exception as e:
                    print(f"  ⚠️ '{skill}' search failed: {e}")
        
        # Remove duplicates based on URL and title+company combination
        seen_jobs = set()
        unique_jobs = []
        for job in all_jobs:
            # Create unique identifier
            job_id = (job.url, job.title.lower().strip(), job.company.lower().strip())
            if job_id not in seen_jobs:
                seen_jobs.add(job_id)
                unique_jobs.append(job)
        
        print(f"🎉 Total unique jobs found: {len(unique_jobs)} (removed {len(all_jobs) - len(unique_jobs)} duplicates)")
        
        # Get recommendations (show all jobs instead of limiting to top 5)
        recommendations = recommendation_engine.recommend_jobs(user_profile, unique_jobs, top_k=len(unique_jobs) if unique_jobs else 0)
        
        # Format response with enhanced search information
        response_data = {
            'success': True,
            'search_info': {
                'skills_searched': skills,
                'total_skills': len(skills),
                'search_strategy': 'multi-strategy' if len(skills) > 3 else 'single-query',
                'search_query': job_query,
                'search_location': search_location
            },
            'user_profile': {
                'skills': user_profile.skills,
                'experience_level': user_profile.experience_level,
                'preferred_roles': user_profile.preferred_roles,
                'location': user_profile.location,
                'work_type': user_profile.work_type
            },
            'total_jobs_found': len(unique_jobs),
            'recommendations': []
        }
        
        for i, rec in enumerate(recommendations, 1):
            job = rec.job
            score = rec.score
            
            recommendation_data = {
                'rank': i,
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'salary_range': job.salary_range,
                'work_type': job.work_type,
                'source': job.source,
                'overall_score': round(score.overall_score, 1),
                'score_breakdown': {
                    'skill_match': round(score.skill_score, 1),
                    'role_relevance': round(score.role_relevance_score, 1),
                    'experience_fit': round(score.experience_match_score, 1),
                    'growth_potential': round(score.growth_score, 1),
                    'location_match': round(score.location_score, 1),
                    'salary_match': round(score.salary_score, 1)
                },
                'explanation': rec.explanation,
                'pros': rec.pros,
                'cons': rec.cons,
                'skill_gaps': rec.skill_gaps,
                'learning_suggestions': rec.learning_suggestions,
                'skill_coverage': round(rec.skill_analysis.coverage_percentage, 1),
                'matched_skills': len(rec.skill_analysis.matched_skills),
                'total_required_skills': rec.skill_analysis.total_job_skills
            }
            
            response_data['recommendations'].append(recommendation_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error processing job search: {e}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/download_report', methods=['POST'])
def download_report():
    """Generate and download a comprehensive report."""
    try:
        data = request.get_json()
        
        # Recreate user profile and recommendations from the data
        # This is a simplified version - in production, you might store this in a session
        user_data = data.get('user_profile', {})
        recommendations_data = data.get('recommendations', [])
        
        # Create a timestamp for the report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create data directory if it doesn't exist
        data_dir = os.path.join(current_dir, 'data')
        os.makedirs(data_dir, exist_ok=True)
        
        # Generate report filename
        report_filename = f"career_report_{timestamp}.txt"
        report_path = os.path.join(data_dir, report_filename)
        
        # Create a simple text report
        report_content = f"""
🎯 CAREER ASSISTANT RECOMMENDATION REPORT
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
========================================================

USER PROFILE:
- Experience Level: {user_data.get('experience_level', 'N/A')}
- Skills: {', '.join(user_data.get('skills', []))}
- Preferred Roles: {', '.join(user_data.get('preferred_roles', []))}
- Location: {user_data.get('location', 'N/A')}
- Work Type: {user_data.get('work_type', 'N/A')}

EXECUTIVE SUMMARY:
- Found {len(recommendations_data)} high-quality job matches
- Average compatibility score: {sum(rec.get('overall_score', 0) for rec in recommendations_data) / len(recommendations_data) if recommendations_data else 0:.1f}/100

JOB RECOMMENDATIONS:
========================================================
"""
        
        for i, rec in enumerate(recommendations_data, 1):
            report_content += f"""
{i}. {rec.get('title', 'N/A')}
   Company: {rec.get('company', 'N/A')}
   Location: {rec.get('location', 'N/A')}
   Salary: {rec.get('salary_range', 'Not specified')}
   Overall Score: {rec.get('overall_score', 0)}/100
   
   Score Breakdown:
   - Skill Match: {rec.get('score_breakdown', {}).get('skill_match', 0)}/100
   - Role Relevance: {rec.get('score_breakdown', {}).get('role_relevance', 0)}/100
   - Experience Fit: {rec.get('score_breakdown', {}).get('experience_fit', 0)}/100
   - Growth Potential: {rec.get('score_breakdown', {}).get('growth_potential', 0)}/100
   
   Why this job fits:
   {rec.get('explanation', 'N/A')}
   
   Strengths:
   {chr(10).join(f'   • {pro}' for pro in rec.get('pros', []))}
   
   Skills to develop:
   {', '.join(rec.get('skill_gaps', [])) if rec.get('skill_gaps') else 'None'}
   
   {'='*60}
"""
        
        # Write report to file
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        return send_file(report_path, as_attachment=True, download_name=report_filename)
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500


@app.route('/api/skill-search', methods=['POST'])
def skill_search():
    """Test individual skill searches for debugging"""
    try:
        data = request.get_json()
        skill = data.get('skill', '').strip()
        location = data.get('location', '').strip()
        limit = int(data.get('limit', 10))
        
        if not skill:
            return jsonify({'error': 'Skill parameter is required'}), 400
        
        print(f"🔍 Testing individual skill search: '{skill}'")
        
        # Search for jobs with single skill
        jobs = job_aggregator.search_all_sources(skill, location, limit)
        
        # Format results
        job_results = []
        for job in jobs:
            job_results.append({
                'title': job.title,
                'company': job.company,
                'location': job.location,
                'source': job.source,
                'url': job.url,
                'salary_range': job.salary_range,
                'posted_date': job.posted_date
            })
        
        return jsonify({
            'success': True,
            'skill_searched': skill,
            'location_searched': location,
            'total_jobs': len(jobs),
            'jobs': job_results
        })
        
    except Exception as e:
        print(f"Error in skill search: {e}")
        return jsonify({'error': f'Skill search failed: {str(e)}'}), 500


if __name__ == '__main__':
    print("🚀 Starting Career Assistant Web UI...")
    print("📱 Open your browser and go to: http://localhost:5000")
    print("⏹️  Press Ctrl+C to stop the server")
    
    app.run(debug=True, host='0.0.0.0', port=5000)