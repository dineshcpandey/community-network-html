import React, { useState } from 'react';
import { searchPeople, searchByLocation } from '../../api/apiService';
import { useNetwork } from '../../context/NetworkContext';
import './SearchComponent.css';

const SearchComponent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name'); // 'name' or 'location'
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { setSelectedPerson, loadPersonDetails } = useNetwork();

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            let results;
            if (searchType === 'name') {
                results = await searchPeople(searchTerm);
            } else {
                results = await searchByLocation(searchTerm);
            }

            setSearchResults(results || []);
        } catch (err) {
            setError('Failed to search. Please try again.');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePersonSelect = (personId) => {
        loadPersonDetails(personId);
        // Clear search results after selection
        setSearchResults([]);
        setSearchTerm('');
    };

    const getFullName = (person) => {
        const firstName = person.data['first name'] || '';
        const lastName = person.data['last name'] || '';
        return `${firstName} ${lastName}`.trim();
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-type-selector">
                    <label>
                        <input
                            type="radio"
                            value="name"
                            checked={searchType === 'name'}
                            onChange={() => setSearchType('name')}
                        />
                        Search by Name
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="location"
                            checked={searchType === 'location'}
                            onChange={() => setSearchType('location')}
                        />
                        Search by Location
                    </label>
                </div>

                <div className="search-input-group">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Enter ${searchType === 'name' ? 'name' : 'location'}`}
                        className="search-input"
                    />
                    <button type="submit" className="search-button" disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && <div className="search-error">{error}</div>}

            {searchResults.length > 0 && (
                <div className="search-results">
                    <h3>Search Results</h3>
                    <ul className="results-list">
                        {searchResults.map((person) => (
                            <li key={person.id} className="result-item">
                                <div className="result-avatar">
                                    <img src={person.data.avatar} alt={getFullName(person)} />
                                </div>
                                <div className="result-info">
                                    <h4>{getFullName(person)}</h4>
                                    <p>
                                        {person.data.location && <span>Location: {person.data.location}</span>}
                                        {person.data.work && <span>Works at: {person.data.work}</span>}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handlePersonSelect(person.id)}
                                    className="select-person-btn"
                                >
                                    View Network
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchComponent;