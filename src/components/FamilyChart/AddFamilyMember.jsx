import React, { useState, useEffect } from 'react';
import { searchPeople, addNewPerson } from '../../api/apiService';
import { useNetwork } from '../../context/NetworkContext';
import './AddFamilyMember.css';

const AddFamilyMember = ({ onClose }) => {
    const { addPersonToNetwork } = useNetwork();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: 'M',
        location: '',
        work: '',
        nativePlace: '',
        email: '',
        phone: '',
        fatherId: '',
        motherId: '',
        spouseId: ''
    });

    // Search state
    const [searchType, setSearchType] = useState('father'); // 'father', 'mother', or 'spouse'
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Relation name display state
    const [relationNames, setRelationNames] = useState({
        father: '',
        mother: '',
        spouse: ''
    });

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Clear search results when search term is cleared
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
        }
    }, [searchTerm]);

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle search
    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchTerm.trim()) {
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const results = await searchPeople(searchTerm);

            // Filter results by gender based on search type
            let filteredResults = results;
            if (searchType === 'father') {
                filteredResults = results.filter(person => person.data.gender === 'M');
            } else if (searchType === 'mother') {
                filteredResults = results.filter(person => person.data.gender === 'F');
            }

            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search result selection
    const handleSelectPerson = (person) => {
        const personId = person.id;
        const firstName = person.data['first name'] || '';
        const lastName = person.data['last name'] || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Update form data with selected person ID
        setFormData({
            ...formData,
            [`${searchType}Id`]: personId
        });

        // Update relation name display
        setRelationNames({
            ...relationNames,
            [searchType]: fullName
        });

        // Clear search state
        setSearchTerm('');
        setSearchResults([]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            // Format the data for the API
            const personData = {
                personname: `${formData.firstName} ${formData.lastName}`,
                gender: formData.gender,
                currentlocation: formData.location || null,
                fatherid: formData.fatherId || null,
                motherid: formData.motherId || null,
                spouseid: formData.spouseId || null,
                worksat: formData.work || null,
                nativeplace: formData.nativePlace || null,
                mail_id: formData.email || null,
                phone: formData.phone || null,
                living: 'Y', // Default for new members

                // Include formatted data structure for network visualization
                data: {
                    'first name': formData.firstName,
                    'last name': formData.lastName,
                    gender: formData.gender,
                    location: formData.location,
                    work: formData.work,
                    contact: {
                        email: formData.email,
                        phone: formData.phone
                    },
                    nativePlace: formData.nativePlace,
                    avatar: "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg"
                },

                // Include relationship structure
                rels: {
                    father: formData.fatherId || null,
                    mother: formData.motherId || null,
                    spouses: formData.spouseId ? [formData.spouseId] : [],
                    children: []
                }
            };

            // Send to API
            const response = await addNewPerson(personData);

            // Add to network context
            if (response && response.id) {
                addPersonToNetwork({
                    id: response.id,
                    data: personData.data,
                    rels: personData.rels
                });

                setSuccess(true);

                // Reset form after a delay
                setTimeout(() => {
                    if (onClose) {
                        onClose();
                    }
                }, 2000);
            }
        } catch (err) {
            console.error('Error adding family member:', err);
            setError('Failed to add family member. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle relation search type change
    const handleSearchTypeChange = (type) => {
        setSearchType(type);
        setSearchTerm('');
        setSearchResults([]);
    };

    // Clear a selected relation
    const handleClearRelation = (relationType) => {
        setFormData({
            ...formData,
            [`${relationType}Id`]: ''
        });

        setRelationNames({
            ...relationNames,
            [relationType]: ''
        });
    };

    return (
        <div className="add-family-member">
            <div className="add-family-member-header">
                <h2>Add New Family Member</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            {success && (
                <div className="success-message">
                    Family member added successfully!
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-section">
                        <h3>Personal Information</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="work">Work</label>
                                <input
                                    type="text"
                                    id="work"
                                    name="work"
                                    value={formData.work}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="nativePlace">Native Place</label>
                                <input
                                    type="text"
                                    id="nativePlace"
                                    name="nativePlace"
                                    value={formData.nativePlace}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Family Relationships</h3>

                        <div className="relationship-tabs">
                            <button
                                type="button"
                                className={`relationship-tab ${searchType === 'father' ? 'active' : ''}`}
                                onClick={() => handleSearchTypeChange('father')}
                            >
                                Father
                            </button>
                            <button
                                type="button"
                                className={`relationship-tab ${searchType === 'mother' ? 'active' : ''}`}
                                onClick={() => handleSearchTypeChange('mother')}
                            >
                                Mother
                            </button>
                            <button
                                type="button"
                                className={`relationship-tab ${searchType === 'spouse' ? 'active' : ''}`}
                                onClick={() => handleSearchTypeChange('spouse')}
                            >
                                Spouse
                            </button>
                        </div>

                        <div className="relationship-content">
                            {/* Selected relation display */}
                            {relationNames[searchType] && (
                                <div className="selected-relation">
                                    <span>Selected {searchType}: {relationNames[searchType]}</span>
                                    <button
                                        type="button"
                                        className="clear-relation-btn"
                                        onClick={() => handleClearRelation(searchType)}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            {/* Search input */}
                            <div className="search-container">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Search for ${searchType}...`}
                                    className="search-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={isSearching || !searchTerm.trim()}
                                    className="search-button"
                                >
                                    {isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {/* Search results */}
                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    <h4>Select a {searchType}:</h4>
                                    <ul>
                                        {searchResults.map((person) => {
                                            const firstName = person.data['first name'] || '';
                                            const lastName = person.data['last name'] || '';
                                            const location = person.data.location || '';

                                            return (
                                                <li
                                                    key={person.id}
                                                    onClick={() => handleSelectPerson(person)}
                                                    className="search-result-item"
                                                >
                                                    <div className="result-avatar">
                                                        <img src={person.data.avatar} alt={`${firstName} ${lastName}`} />
                                                    </div>
                                                    <div className="result-info">
                                                        <strong>{firstName} {lastName}</strong>
                                                        {location && <span>{location}</span>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cancel-button"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Family Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddFamilyMember;