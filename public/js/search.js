// public/js/search.js - Updated search functionality
import { searchPeople, fetchLocationSuggestions } from './api-utils.js';
import { getChartInstance, openEditTree, clearCurrentEditPerson } from './chart.js';
import { showNotification } from './addPerson.js';
import { isUserAuthenticated, showLoginForm } from './auth.js';
import { chartData, handleNodeSelect, clearChartData } from './app.js';

// Search elements
let searchForm;
let nameInput;
let locationInput;
let locationSuggestions;
let searchButton;
let searchError;
let resultsCount;
let personCards;
let searchResultsDropdown;
let closeResultsBtn;

// Type-ahead state
let currentSuggestions = [];
let selectedSuggestionIndex = -1;
let debounceTimer = null;

// Default options
let searchOptions = {
    onPersonSelect: null,
};

/**
 * Set up search functionality with name and location fields
 * @param {Object} options - Search options
 */
export function setupSearch(options = {}) {
    // Merge options
    searchOptions = { ...searchOptions, ...options };

    // Get DOM elements
    searchForm = document.getElementById('search-form');
    nameInput = document.getElementById('name-input');
    locationInput = document.getElementById('location-input');
    locationSuggestions = document.getElementById('location-suggestions');
    searchButton = document.getElementById('search-button');
    searchError = document.getElementById('search-error');
    resultsCount = document.getElementById('results-count');
    personCards = document.getElementById('person-cards');
    searchResultsDropdown = document.querySelector('.search-results-dropdown');
    closeResultsBtn = document.querySelector('.close-results-btn');

    // Debug check
    console.log('Search elements found:', {
        searchForm: !!searchForm,
        nameInput: !!nameInput,
        locationInput: !!locationInput,
        locationSuggestions: !!locationSuggestions,
        searchButton: !!searchButton,
        searchError: !!searchError,
        resultsCount: !!resultsCount,
        personCards: !!personCards,
        searchResultsDropdown: !!searchResultsDropdown,
        closeResultsBtn: !!closeResultsBtn
    });

    // Set up event listeners
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
        console.log('Search form submit handler attached');
    }

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
        console.log('Search button click handler attached');
    }

    // Set up location type-ahead
    if (locationInput) {
        locationInput.addEventListener('input', handleLocationInput);
        locationInput.addEventListener('keydown', handleLocationKeydown);
        locationInput.addEventListener('blur', hideSuggestions);
        console.log('Location input handlers attached');
    }

    // Set up close results button
    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', clearSearchResults);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchResultsDropdown && searchResultsDropdown.style.display === 'flex') {
            clearSearchResults();
        }
    });

    // Close modal when clicking outside the container
    if (searchResultsDropdown) {
        searchResultsDropdown.addEventListener('click', (e) => {
            if (e.target === searchResultsDropdown) {
                clearSearchResults();
            }
        });
    }

    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
        if (locationInput && locationSuggestions &&
            !locationInput.contains(e.target) &&
            !locationSuggestions.contains(e.target)) {
            hideSuggestions();
        }
    });

    console.log('Search component initialized');
}

/**
 * Handle search form submission
 * @param {Event} e - Form submit event
 */
async function handleSearch(e) {
    e.preventDefault();
    console.log('Search handler triggered');

    // Check authentication
    if (!isUserAuthenticated()) {
        showLoginForm('search for people');
        return;
    }

    // Get search values
    const name = nameInput ? nameInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';

    // Validate input
    if (!name && !location) {
        showError('Please enter either a name or location to search');
        showSearchResults();
        return;
    }

    // Update UI
    if (searchButton) {
        searchButton.disabled = true;
        searchButton.textContent = 'Searching...';
    }

    // Clear previous results
    clearSearchResults();

    try {
        console.log(`Searching for name: "${name}", location: "${location}"`);

        const results = await searchPeople(name, location);
        console.log('Search results:', results);

        // Clear any previous errors
        if (searchError) {
            searchError.style.display = 'none';
        }

        // Display results
        if (results.length === 0) {
            if (resultsCount) {
                resultsCount.textContent = 'No people found matching your search criteria';
                resultsCount.style.display = 'block';
            }
        } else {
            // Check which people are already in the chart
            const existingIds = new Set(chartData.map(person => person.id));
            const newCount = results.filter(person => !existingIds.has(person.id)).length;

            let statusText;
            if (newCount === 0) {
                statusText = `Found ${results.length} ${results.length === 1 ? 'person' : 'people'} already in your chart`;
            } else {
                statusText = `Found ${newCount} ${newCount === 1 ? 'person' : 'people'} to add to your chart`;
            }

            if (resultsCount) {
                resultsCount.textContent = statusText;
                resultsCount.style.display = 'block';
            }

            // Create person cards for all results
            if (personCards) {
                personCards.innerHTML = '';
                results.forEach(person => {
                    const card = createPersonCard(person, existingIds.has(person.id));
                    personCards.appendChild(card);
                });
            }
        }

        // Show search results dropdown
        showSearchResults();
    } catch (error) {
        console.error('Search error:', error);
        showError(`Error searching: ${error.message}`);
        showSearchResults();
    } finally {
        // Reset UI state
        if (searchButton) {
            searchButton.disabled = false;
            searchButton.textContent = 'Search';
        }
    }
}

/**
 * Handle location input for type-ahead functionality
 * @param {Event} e - Input event
 */
async function handleLocationInput(e) {
    const query = e.target.value.trim();

    // Clear previous timer
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // Debounce the API call
    debounceTimer = setTimeout(async () => {
        if (query.length >= 2) {
            try {
                const suggestions = await fetchLocationSuggestions(query);
                showSuggestions(suggestions);
            } catch (error) {
                console.error('Location suggestions error:', error);
                hideSuggestions();
            }
        } else {
            hideSuggestions();
        }
    }, 300);
}

/**
 * Handle keyboard navigation in location suggestions
 * @param {Event} e - Keydown event
 */
function handleLocationKeydown(e) {
    if (!currentSuggestions.length) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
            updateSuggestionSelection();
            break;

        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionSelection();
            break;

        case 'Enter':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
                selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
            }
            break;

        case 'Escape':
            hideSuggestions();
            break;
    }
}

/**
 * Show location suggestions
 * @param {Array} suggestions - Array of location strings
 */
function showSuggestions(suggestions) {
    if (!locationSuggestions) return;

    currentSuggestions = suggestions;
    selectedSuggestionIndex = -1;

    if (suggestions.length === 0) {
        locationSuggestions.innerHTML = '<div class="no-suggestions">No locations found</div>';
        locationSuggestions.style.display = 'block';
        return;
    }

    locationSuggestions.innerHTML = suggestions.map((suggestion, index) =>
        `<div class="location-suggestion" data-index="${index}">${suggestion}</div>`
    ).join('');

    // Add click handlers to suggestions
    locationSuggestions.querySelectorAll('.location-suggestion').forEach((el, index) => {
        el.addEventListener('click', () => selectSuggestion(suggestions[index]));
    });

    locationSuggestions.style.display = 'block';
}

/**
 * Hide location suggestions
 */
function hideSuggestions() {
    setTimeout(() => {
        if (locationSuggestions) {
            locationSuggestions.style.display = 'none';
        }
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
    }, 200);
}

/**
 * Update suggestion selection highlighting
 */
function updateSuggestionSelection() {
    if (!locationSuggestions) return;

    const suggestionElements = locationSuggestions.querySelectorAll('.location-suggestion');
    suggestionElements.forEach((el, index) => {
        el.classList.toggle('selected', index === selectedSuggestionIndex);
    });
}

/**
 * Select a location suggestion
 * @param {string} suggestion - Selected location
 */
function selectSuggestion(suggestion) {
    if (locationInput) {
        locationInput.value = suggestion;
        locationInput.focus();
    }
    hideSuggestions();
}

/**
 * Show the search results dropdown
 */
function showSearchResults() {
    if (searchResultsDropdown) {
        searchResultsDropdown.style.display = 'flex';
        // Prevent body scroll when modal is open
        document.body.classList.add('modal-open');

        // Focus management for accessibility
        const closeBtn = searchResultsDropdown.querySelector('.close-results-btn');
        if (closeBtn) {
            closeBtn.focus();
        }
    }
}

/**
 * Clear search results
 */
export function clearSearchResults() {
    if (searchResultsDropdown) {
        searchResultsDropdown.style.display = 'none';
        // Re-enable body scroll
        document.body.classList.remove('modal-open');
    }

    if (searchError) {
        searchError.style.display = 'none';
    }

    if (resultsCount) {
        resultsCount.style.display = 'none';
    }

    if (personCards) {
        personCards.innerHTML = '';
    }
}

/**
 * Show search error
 * @param {string} message - Error message
 */
function showError(message) {
    if (searchError) {
        searchError.textContent = message;
        searchError.style.display = 'block';
    }

    if (resultsCount) {
        resultsCount.style.display = 'none';
    }

    console.error('Search error:', message);
}

/**
 * Create a person card element
 * @param {Object} person - Person data
 * @param {boolean} isInChart - Whether person is already in chart
 * @returns {HTMLElement} The card element
 */
function createPersonCard(person, isInChart) {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.dataset.personId = person.id;

    // Format person details
    const name = person.personname || 'Unknown';
    const currentLocation = person.currentlocation || '';
    const nativePlace = person.nativeplace || '';
    const gender = person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Unknown';
    const birthDate = person.birthdate ? new Date(person.birthdate).toLocaleDateString() : '';

    card.innerHTML = `
        <div class="person-header">
            <h3>${name}</h3>
            ${isInChart ? '<span class="in-chart-badge">In Chart</span>' : ''}
        </div>
        <div class="person-details">
            ${gender ? `<div><strong>Gender:</strong> ${gender}</div>` : ''}
            ${currentLocation ? `<div><strong>Current Location:</strong> ${currentLocation}</div>` : ''}
            ${nativePlace ? `<div><strong>Native Place:</strong> ${nativePlace}</div>` : ''}
            ${birthDate ? `<div><strong>Birth Date:</strong> ${birthDate}</div>` : ''}
            ${person.phone ? `<div><strong>Phone:</strong> ${person.phone}</div>` : ''}
            ${person.mail_id ? `<div><strong>Email:</strong> ${person.mail_id}</div>` : ''}
        </div>
        <div class="person-actions">
            ${!isInChart ? `<button class="add-to-chart-btn" data-person-id="${person.id}">Add to Chart</button>` : ''}
            <button class="view-details-btn" data-person-id="${person.id}">View Details</button>
        </div>
    `;

    // Add event listeners
    const addToChartBtn = card.querySelector('.add-to-chart-btn');
    const viewDetailsBtn = card.querySelector('.view-details-btn');

    if (addToChartBtn) {
        addToChartBtn.addEventListener('click', () => {
            if (searchOptions.onPersonSelect) {
                searchOptions.onPersonSelect(person);
            } else {
                handleNodeSelect(person);
            }
        });
    }

    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => {
            // Handle view details - you can integrate with your existing chart functionality
            console.log('View details for person:', person.id);
        });
    }

    return card;
}

/**
 * Clear search inputs
 */
export function clearSearch() {
    if (nameInput) nameInput.value = '';
    if (locationInput) locationInput.value = '';
    clearSearchResults();
    hideSuggestions();
}

// Export for use in other modules
export { searchPeople, fetchLocationSuggestions };