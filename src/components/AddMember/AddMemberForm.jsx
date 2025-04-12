import React, { useState, useEffect } from 'react';
import { addNewPerson, searchPeople } from '../../api/apiService';
import { useNetwork } from '../../context/NetworkContext';
import './AddMemberForm.css';

const AddMemberForm = ({ onClose }) => {
    const [formState, setFormState] = useState({
        firstName: '',
        lastName: '',
        gender: 'M',
        birthdate: '',
        location: '',
        work: '',
        phone: '',
        email: '',
        nativePlace: '',
        fatherId: '',
        motherId: '',
        spouseId: ''
    });

    const [fatherSearchTerm, setFatherSearchTerm] = useState('');
    const [motherSearchTerm, setMotherSearchTerm] = useState('');
    const [spouseSearchTerm, setSpouseSearchTerm] = useState('');

    const [fatherResults, setFatherResults] = useState([]);
    const [motherResults, setMotherResults] = useState([]);
    const [spouseResults, setSpouseResults] = useState([]);

    const [isSearching, setIsSearching] = useState({
        father: false,
        mother: false,
        spouse: false
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const { addPersonToNetwork } = useNetwork();

    // Handler for input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handler for searching potential parents/spouse
    const handleSearch = async (type, term) => {
        if (!term.trim()) return;

        setIsSearching(prev => ({ ...prev, [type]: true }));

        try {
            const results = await searchPeople(term);

            if (type === 'father') {
                setFatherResults(results.filter(p => p.data.gender === 'M') || []);
            } else if (type === 'mother') {
                setMotherResults(results.filter(p => p.data.gender === 'F') || []);
            } else if (type === 'spouse') {
                setSpouseResults(results || []);
            }
        } catch (err) {
            console.error(`Error searching for ${type}:`, err);
        } finally {
            setIsSearching(prev => ({ ...prev, [type]: false }));
        }
    };

    // Handler for selecting a parent/spouse
    const handleSelect = (type, person) => {
        setFormState(prev => ({
            ...prev,
            [`${type}Id`]: person.id
        }));

        // Clear search results
        if (type === 'father') {
            setFatherResults([]);
            setFatherSearchTerm(getFullName(person));
        } else if (type === 'mother') {
            setMotherResults([]);
            setMotherSearchTerm(getFullName(person));
        } else if (type === 'spouse') {
            setSpouseResults([]);
            setSpouseSearchTerm(getFullName(person));
        }
    };

    // Helper to get full name
    const getFullName = (person) => {
        const firstName = person.data['first name'] || '';
        const lastName = person.data['last name'] || '';
        return `${firstName} ${lastName}`.trim();
    };

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitting(true);
        setError(null);

        try {
            // Prepare data for API
            const newPersonData = {
                personname: `${formState.firstName} ${formState.lastName}`,
                birthdate: formState.birthdate || null,
                gender: formState.gender,
                currentlocation: formState.location || null,
                fatherid: formState.fatherId || null,
                motherid: formState.motherId || null,
                spouseid: formState.spouseId || null,
                worksat: formState.work || null,
                nativeplace: formState.nativePlace || null,
                phone: formState.phone || null,
                mail_id: formState.email || null,
                // Additional fields based on your schema
                living: 'Y', // Default for new member
                // Format the data to match your API structure
                data: {
                    'first name': formState.firstName,
                    'last name': formState.lastName,
                    gender: formState.gender,
                    location: formState.location,
                    work: formState.work,
                    contact: {
                        email: formState.email,
                        phone: formState.phone
                    },
                    nativePlace: formState.nativePlace,
                    // Default avatar
                    avatar: "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg"
                },
                rels: {
                    father: formState.fatherId || null,
                    mother: formState.motherId || null,
                    spouses: formState.spouseId ? [formState.spouseId] : [],
                    children: []
                }
            };

            // Call API to add person
            const response = await addNewPerson(newPersonData);

            // Add to local network state
            if (response && response.id) {
                addPersonToNetwork({
                    id: response.id,
                    data: newPersonData.data,
                    rels: newPersonData.rels
                });

                setSuccess(true);

                // Reset form after success
                setTimeout(() => {
                    setFormState({
                        firstName: '',
                        lastName: '',
                        gender: 'M',
                        birthdate: '',
                        location: '',
                        work: '',
                        phone: '',
                        email: '',
                        nativePlace: '',
                        fatherId: '',
                        motherId: '',
                        spouseId: ''
                    });
                    setFatherSearchTerm('');
                    setMotherSearchTerm('');
                    setSpouseSearchTerm('');
                    setSuccess(false);

                    if (onClose) onClose();
                }, 2000);
            }
        } catch (err) {
            setError('Failed to add new member. Please try again.');
            console.error('Error adding new member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="add-member-container">
            <h2>Add New Community Member</h2>

            {success && (
                <div className="form-success-message">
                    Member added successfully!
                </div>
            )}

            {error && (
                <div className="form-error-message">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="add-member-form">
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formState.firstName}
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
                        value={formState.lastName}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                        id="gender"
                        name="gender"
                        value={formState.gender}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="birthdate">Date of Birth</label>
                    <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        value={formState.birthdate}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="location">Current Location</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formState.location}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="work">Works At</label>
                    <input
                        type="text"
                        id="work"
                        name="work"
                        value={formState.work}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="nativePlace">Native Place</label>
                    <input
                        type="text"
                        id="nativePlace"
                        name="nativePlace"
                        value={formState.nativePlace}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formState.phone}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-section">
                    <h3>Family Relations</h3>

                    {/* Father Search */}
                    <div className="form-group relation-search">
                        <label>Father</label>
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search for father"
                                value={fatherSearchTerm}
                                onChange={(e) => setFatherSearchTerm(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handleSearch('father', fatherSearchTerm)}
                                disabled={isSearching.father}
                            >
                                {isSearching.father ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {fatherResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {fatherResults.map((person) => (
                                    <div
                                        key={person.id}
                                        className="search-result-item"
                                        onClick={() => handleSelect('father', person)}
                                    >
                                        <img src={person.data.avatar} alt={getFullName(person)} />
                                        <div>
                                            <strong>{getFullName(person)}</strong>
                                            {person.data.location && <span>{person.data.location}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Mother Search */}
                    <div className="form-group relation-search">
                        <label>Mother</label>
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search for mother"
                                value={motherSearchTerm}
                                onChange={(e) => setMotherSearchTerm(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handleSearch('mother', motherSearchTerm)}
                                disabled={isSearching.mother}
                            >
                                {isSearching.mother ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {motherResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {motherResults.map((person) => (
                                    <div
                                        key={person.id}
                                        className="search-result-item"
                                        onClick={() => handleSelect('mother', person)}
                                    >
                                        <img src={person.data.avatar} alt={getFullName(person)} />
                                        <div>
                                            <strong>{getFullName(person)}</strong>
                                            {person.data.location && <span>{person.data.location}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Spouse Search */}
                    <div className="form-group relation-search">
                        <label>Spouse</label>
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search for spouse"
                                value={spouseSearchTerm}
                                onChange={(e) => setSpouseSearchTerm(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handleSearch('spouse', spouseSearchTerm)}
                                disabled={isSearching.spouse}
                            >
                                {isSearching.spouse ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {spouseResults.length > 0 && (
                            <div className="search-results-dropdown">
                                {spouseResults.map((person) => (
                                    <div
                                        key={person.id}
                                        className="search-result-item"
                                        onClick={() => handleSelect('spouse', person)}
                                    >
                                        <img src={person.data.avatar} alt={getFullName(person)} />
                                        <div>
                                            <strong>{getFullName(person)}</strong>
                                            {person.data.location && <span>{person.data.location}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Adding...' : 'Add Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMemberForm;