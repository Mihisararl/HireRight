import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { registerProvider } from '../api/provider';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
});

const ProviderRegistration = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Personal Information
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',

        // Step 2: Professional Details
        serviceCategory: '',
        yearsOfExperience: '',
        hourlyRate: '',
        professionalBio: '',
        portfolioPhoto: null,

        // Step 3: Location & Verification
        city: '',
        district: '',
        idDocument: null,
        agreedToBackgroundCheck: false,
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                portfolioPhoto: file
            }));
        }
    };

    const handleIdUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                idDocument: file
            }));
            // Clear error when file is selected
            if (errors.idDocument) {
                setErrors(prev => ({ ...prev, idDocument: '' }));
            }
        }
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        const phoneRegex = /^\+?1?\d{10,14}$/;
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!phoneRegex.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
            newErrors.phoneNumber = 'Please enter a valid phone number';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Must be at least 8 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.serviceCategory) newErrors.serviceCategory = 'Service category is required';
        if (!formData.yearsOfExperience) {
            newErrors.yearsOfExperience = 'Years of experience is required';
        } else if (formData.yearsOfExperience < 0) {
            newErrors.yearsOfExperience = 'Must be a positive number';
        }

        if (!formData.hourlyRate) {
            newErrors.hourlyRate = 'Hourly rate is required';
        } else if (formData.hourlyRate < 0) {
            newErrors.hourlyRate = 'Must be a positive number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.district.trim()) newErrors.district = 'District is required';
        if (!formData.idDocument) {
            newErrors.idDocument = 'ID document (NIC/Driving License) is required';
        }
        if (!formData.agreedToBackgroundCheck) {
            newErrors.agreedToBackgroundCheck = 'You must agree to the background check';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        let isValid = false;

        if (step === 1) {
            isValid = validateStep1();
        } else if (step === 2) {
            isValid = validateStep2();
        }

        if (isValid && step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        if (validateStep3()) {
            try {
                const payload = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    password: formData.password,
                    serviceCategory: formData.serviceCategory,
                    yearsOfExperience: Number(formData.yearsOfExperience),
                    hourlyRate: Number(formData.hourlyRate),
                    professionalBio: formData.professionalBio,
                    city: formData.city,
                    district: formData.district,
                    agreedToBackgroundCheck: formData.agreedToBackgroundCheck,
                    portfolioPhoto: formData.portfolioPhoto ? await fileToDataUrl(formData.portfolioPhoto) : '',
                    idDocument: formData.idDocument ? await fileToDataUrl(formData.idDocument) : ''
                };

                await registerProvider(payload);
                alert('Registration completed successfully! Admin review is pending.');
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to submit registration');
            }
        }
    };

    const serviceCategories = [
        'Home Cleaning',
        'Plumbing',
        'Electrical',
        'Carpentry',
        'Painting',
        'Landscaping',
        'HVAC',
        'Handyman',
        'Moving',
        'Other'
    ];

    const sriLankanDistricts = [
        'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
        'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
        'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
        'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
        'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Outfit', sans-serif;
        }
        
        .form-input {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .step-indicator {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .step-indicator.active {
          animation: pulse-blue 2s ease-in-out infinite;
        }
        
        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }
        
        .upload-area {
          transition: all 0.3s ease;
        }
        
        .upload-area:hover {
          border-color: #3b82f6;
          background-color: rgba(59, 130, 246, 0.02);
        }
        
        .button-primary {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .button-primary::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .button-primary:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3);
        }
        
        .card-enter {
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <div className="w-full max-w-2xl">
                {/* Progress Header */}
                <div className="bg-white rounded-2xl shadow-xl mb-6 p-6 card-enter">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-slate-800">Worker Registration</h1>
                        <span className="text-sm font-medium text-slate-500">Step {step} of 3</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>

                        {/* Step Indicators */}
                        <div className="flex justify-between mt-4">
                            {[1, 2, 3].map((stepNum) => (
                                <div key={stepNum} className="flex flex-col items-center">
                                    <div
                                        className={`step-indicator w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                      ${step >= stepNum
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-200 text-slate-400'
                                            } ${step === stepNum ? 'active' : ''}`}
                                    >
                                        {stepNum}
                                    </div>
                                    <span className="text-xs mt-2 text-slate-600 font-medium">
                                        {stepNum === 1 ? 'Personal' : stepNum === 2 ? 'Professional' : 'Location'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 card-enter">
                    {/* Step 1: Personal Information */}
                    {step === 1 && (
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Information</h2>
                                <p className="text-slate-500">Let's start with your basic details</p>
                            </div>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            placeholder="Kasun"
                                            className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                        ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        />
                                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            placeholder="Silva"
                                            className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                        ${errors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        />
                                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="you@example.com"
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="+94 77 123 4567"
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>
                            </div>

                            <button
                                onClick={handleContinue}
                                className="button-primary w-full mt-8 bg-blue-500 text-white font-semibold py-4 rounded-lg hover:bg-blue-600"
                            >
                                Continue to Professional Details
                            </button>
                        </div>
                    )}

                    {/* Step 2: Professional Details */}
                    {step === 2 && (
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Professional Details</h2>
                                <p className="text-slate-500">Tell us about your expertise</p>
                            </div>

                            <div className="space-y-5">

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Service Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="serviceCategory"
                                        value={formData.serviceCategory}
                                        onChange={handleInputChange}
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.serviceCategory ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    >
                                        <option value="">Select a category</option>
                                        {serviceCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                    {errors.serviceCategory && <p className="text-red-500 text-xs mt-1">{errors.serviceCategory}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Years of Experience <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="yearsOfExperience"
                                            value={formData.yearsOfExperience}
                                            onChange={handleInputChange}
                                            placeholder="5"
                                            min="0"
                                            className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                        ${errors.yearsOfExperience ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        />
                                        {errors.yearsOfExperience && <p className="text-red-500 text-xs mt-1">{errors.yearsOfExperience}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Hourly Rate (Rs.) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="hourlyRate"
                                            value={formData.hourlyRate}
                                            onChange={handleInputChange}
                                            placeholder="1200"
                                            min="0"
                                            className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                        ${errors.hourlyRate ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        />
                                        {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Professional Bio <span className="text-slate-400 text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="professionalBio"
                                        value={formData.professionalBio}
                                        onChange={handleInputChange}
                                        placeholder="Tell customers about your skills, experience, and what makes you great at what you do..."
                                        rows="4"
                                        className="form-input w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">This will be shown to potential customers</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Portfolio Photo <span className="text-slate-400 text-xs">(Optional)</span>
                                    </label>
                                    <div className="upload-area border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            id="portfolio-upload"
                                        />
                                        <label htmlFor="portfolio-upload" className="cursor-pointer">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                {formData.portfolioPhoto ? (
                                                    <p className="text-sm text-slate-700 font-medium">{formData.portfolioPhoto.name}</p>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-slate-600 font-medium mb-1">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-slate-400">PNG, JPG or JPEG (max 5MB each)</p>
                                                    </>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-4 rounded-lg hover:bg-slate-50 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleContinue}
                                    className="button-primary flex-1 bg-blue-500 text-white font-semibold py-4 rounded-lg hover:bg-blue-600"
                                >
                                    Continue to Location
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Location & Verification */}
                    {step === 3 && (
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Location & Verification</h2>
                                <p className="text-slate-500">Almost done! Just a few more details</p>
                            </div>

                            <div className="space-y-5">

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Colombo"
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.city ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    />
                                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        District <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        className={`form-input w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500
                      ${errors.district ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                    >
                                        <option value="">Select district</option>
                                        {sriLankanDistricts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                    {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                                </div>

                                {/* ID Document Upload Section */}
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-blue-900 mb-2">ID Verification Document <span className="text-red-500">*</span></h3>
                                            <p className="text-sm text-blue-800 mb-4">
                                                Please upload a clear photo of your NIC (National Identity Card) or Driving License for identity verification.
                                            </p>

                                            <div className={`upload-area border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-white
                                                ${errors.idDocument ? 'border-red-300' : 'border-blue-300'}`}>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                                                    onChange={handleIdUpload}
                                                    className="hidden"
                                                    id="id-upload"
                                                />
                                                <label htmlFor="id-upload" className="cursor-pointer">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="w-10 h-10 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        {formData.idDocument ? (
                                                            <p className="text-sm text-slate-700 font-medium">{formData.idDocument.name}</p>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-slate-600 font-medium mb-1">Click to upload ID document</p>
                                                                <p className="text-xs text-slate-400">NIC or Driving License (PNG, JPG, or PDF - max 5MB)</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                            {errors.idDocument && (
                                                <p className="text-red-500 text-xs mt-2">{errors.idDocument}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Background Check Section */}
                                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-green-900 mb-2">Background Check & Verification</h3>
                                            <p className="text-sm text-green-800 mb-4">
                                                To ensure the safety of our community, all workers must complete a background check.
                                                This process is handled by our trusted partner and takes 2-3 business days.
                                            </p>

                                            <div className={`flex items-start gap-3 p-3 bg-white rounded-lg border-2 
                        ${errors.agreedToBackgroundCheck ? 'border-red-300' : 'border-green-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    name="agreedToBackgroundCheck"
                                                    checked={formData.agreedToBackgroundCheck}
                                                    onChange={handleInputChange}
                                                    className="mt-1 w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                                                    id="background-check"
                                                />
                                                <label htmlFor="background-check" className="text-sm text-slate-700 cursor-pointer">
                                                    I consent to a background check and agree to the{' '}
                                                    <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a>
                                                    {' '}and{' '}
                                                    <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
                                                </label>
                                            </div>
                                            {errors.agreedToBackgroundCheck && (
                                                <p className="text-red-500 text-xs mt-2">{errors.agreedToBackgroundCheck}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 border-2 border-slate-300 text-slate-700 font-semibold py-4 rounded-lg hover:bg-slate-50 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="button-primary flex-1 bg-green-500 text-white font-semibold py-4 rounded-lg hover:bg-green-600"
                                >
                                    Complete Registration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProviderRegistration;