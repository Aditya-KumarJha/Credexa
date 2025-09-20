"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, Loader2, Plus, ChevronDown, CheckCircle, AlertCircle, X } from 'lucide-react';
import api from '@/utils/axios';
import toast from 'react-hot-toast';

interface College {
  aishe_code: string;
  name: string;
  state: string;
  district: string;
  university_name: string;
  displayName: string;
}

interface UserInstitute {
  aishe_code: string;
  name: string;
  state: string;
  district: string;
  university_name: string;
  addedAt: string;
  isVerified: boolean;
}

interface InstituteSelectorProps {
  onInstituteUpdate?: (institute: UserInstitute | null) => void;
}

export default function InstituteSelector({ onInstituteUpdate }: InstituteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [currentInstitute, setCurrentInstitute] = useState<UserInstitute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [error, setError] = useState('');
  
  // Manual form fields
  const [manualForm, setManualForm] = useState({
    name: '',
    state: '',
    district: '',
    university_name: '',
    reason: ''
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load current institute on component mount
  useEffect(() => {
    loadCurrentInstitute();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCurrentInstitute = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await api.get('/api/institute');

      if (response.data.success && response.data.institute) {
        setCurrentInstitute(response.data.institute);
        if (onInstituteUpdate) {
          onInstituteUpdate(response.data.institute);
        }
      }
    } catch (error) {
      console.error('Error loading current institute:', error);
    }
  };

  const searchColleges = async (query: string) => {
    if (query.length < 2) {
      setColleges([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/api/institute/search?query=${encodeURIComponent(query)}&limit=10`);
      
      setColleges(response.data);
    } catch (error) {
      console.error('Error searching colleges:', error);
      setColleges([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setError('');
    setSelectedCollege(null);
    setShowDropdown(true);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchColleges(value);
    }, 300);
  };

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    setSearchQuery(college.name);
    setShowDropdown(false);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedCollege) {
      setError('Please select a valid institute from the dropdown');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/institute', {
        aishe_code: selectedCollege.aishe_code,
        name: selectedCollege.name,
        state: selectedCollege.state,
        district: selectedCollege.district,
        university_name: selectedCollege.university_name
      });

      if (response.data.success) {
        setCurrentInstitute(response.data.institute);
        toast.success('Institute updated successfully!');
        if (onInstituteUpdate) {
          onInstituteUpdate(response.data.institute);
        }
        // Clear form
        setSearchQuery('');
        setSelectedCollege(null);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error updating institute';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualForm.name || !manualForm.state || !manualForm.district) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/institute/manual', manualForm);

      if (response.data.success) {
        setCurrentInstitute(response.data.institute);
        toast.success('Institute submitted for review!');
        if (onInstituteUpdate) {
          onInstituteUpdate(response.data.institute);
        }
        setShowManualForm(false);
        setManualForm({ name: '', state: '', district: '', university_name: '', reason: '' });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error submitting institute';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Current Institute Display */}
      {currentInstitute && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-cyan-500 text-white rounded-lg">
                <Building2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{currentInstitute.name}</h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MapPin size={14} className="mr-1" />
                  {currentInstitute.district}, {currentInstitute.state}
                </div>
                {currentInstitute.university_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    University: {currentInstitute.university_name}
                  </p>
                )}
                <div className="flex items-center mt-2">
                  {currentInstitute.isVerified ? (
                    <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <CheckCircle size={14} className="mr-1" />
                      Verified Institute
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle size={14} className="mr-1" />
                      Pending Admin Approval
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institute Selection Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="institute-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {currentInstitute ? 'Update Institute/College' : 'Institute/College'}
          </label>
          
          {/* Search Input */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                ref={searchRef}
                id="institute-search"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search for your institute/college..."
                className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                disabled={isSubmitting}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="animate-spin text-gray-400" size={18} />
                </div>
              )}
              {!isLoading && searchQuery && (
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && colleges.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {colleges.map((college) => (
                  <div
                    key={college.aishe_code}
                    onClick={() => handleCollegeSelect(college)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{college.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                      <MapPin size={12} className="mr-1" />
                      {college.district}, {college.state}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {showDropdown && searchQuery.length >= 2 && !isLoading && colleges.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <p>No institutes found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="mt-2 text-cyan-500 hover:text-cyan-600 text-sm flex items-center justify-center mx-auto"
                  >
                    <Plus size={14} className="mr-1" />
                    Add manually instead?
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle size={14} className="mr-1" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        {selectedCollege && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected: <span className="font-medium">{selectedCollege.displayName}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {isSubmitting ? 'Saving...' : 'Save Institute'}
            </button>
          </div>
        )}

        {/* Manual Add Link */}
        {!showManualForm && !selectedCollege && (
          <div className="text-center">
            <button
              onClick={() => setShowManualForm(true)}
              className="text-cyan-500 hover:text-cyan-600 text-sm flex items-center justify-center mx-auto"
            >
              <Plus size={14} className="mr-1" />
              Can't find your institute? Add manually
            </button>
          </div>
        )}
      </div>

      {/* Manual Institute Form */}
      {showManualForm && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              <Plus size={18} className="mr-2" />
              Add Institute Manually
            </h3>
            <button
              onClick={() => setShowManualForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Institute Name *
              </label>
              <input
                type="text"
                name="name"
                value={manualForm.name}
                onChange={handleManualFormChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter institute name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={manualForm.state}
                onChange={handleManualFormChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                District/City *
              </label>
              <input
                type="text"
                name="district"
                value={manualForm.district}
                onChange={handleManualFormChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter district or city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                University (Optional)
              </label>
              <input
                type="text"
                name="university_name"
                value={manualForm.university_name}
                onChange={handleManualFormChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter affiliated university"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for Manual Addition (Optional)
            </label>
            <textarea
              name="reason"
              value={manualForm.reason}
              onChange={handleManualFormChange}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              placeholder="Why couldn't you find your institute in our database?"
            />
          </div>

          <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-lg mb-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle size={14} className="inline mr-1" />
              Manual submissions require admin approval and may take 2-3 business days to verify.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting || !manualForm.name || !manualForm.state || !manualForm.district}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}