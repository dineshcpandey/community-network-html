// Search functionality
import { searchByName, searchByLocation } from './api.js';
import { chartData } from './app.js';

// Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchError = document.getElementById('search-error');
const resultsCount = document.getElementById('results-count');
const personCards = document.getElementById('person-cards');

// Default options
let searchOptions = {
    onPersonSelect: null,
};

/**
 * Set up search functionality
 * @param {Object} options - Search options
 */
export function setupSearch(options = {}) {
    // Merge options
    searchOptions = { ...searchOptions, ...options };

    // Set up event listeners
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // Set up radio buttons
    const radioButtons = document.querySelectorAll('input[name="searchType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleSearchTypeChange);
    });

    console.log('Search component initialized');
}

/**
 * Handle search form submission
 * @param {Event} e - Form submit event
 */
async function handleSearch(e) {
    e.preventDefault();

    if (!searchInput || !searchButton || !searchError || !resultsCount || !personCards) {
        console.error('Search elements not found');
        return;
    }

    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }

    // Get search type
    const searchType = document.querySelector('input[name="searchType"]:checked').value;

    // Update UI state
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';
    searchError.style.display = 'none';
    personCards.innerHTML = '';
    resultsCount.style.display = 'none';

    try {
        // Perform search
        let results;
        if (searchType === 'name') {
            results = await searchByName(searchTerm);
        } else {
            results = await searchByLocation(searchTerm);
        }

        // Filter out people already in the chart
        const existingIds = new Set(chartData.map(person => person.id));
        const filteredResults = results.filter(person => !existingIds.has(person.id));

        // Display results
        if (filteredResults.length === 0) {
            if (results.length > 0 && results.length !== filteredResults.length) {
                showError(`All ${results.length} results are already in your chart`);
            } else {
                showError(`No results found for ${searchType}: "${searchTerm}"`);
            }
        } else {
            resultsCount.textContent = `Found ${filteredResults.length} ${filteredResults.length === 1 ? 'person' : 'people'}`;
            resultsCount.style.display = 'block';

            // Create person cards
            filteredResults.forEach(person => {
                const card = createPersonCard(person);
                personCards.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        showError(`Error searching: ${error.message}`);
    } finally {
        // Reset UI state
        searchButton.disabled = false;
        searchButton.textContent = 'Search';
    }
}

/**
 * Handle search type change
 * @param {Event} e - Radio button change event
 */
function handleSearchTypeChange(e) {
    const searchType = e.target.value;
    if (searchInput) {
        searchInput.placeholder = `Search by ${searchType}...`;
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
        resultsCount.style.display = 'none';
    }
}

/**
 * Create a person card element
 * @param {Object} person - Person data
 * @returns {HTMLElement} The card element
 */
function createPersonCard(person) {
    // Default avatar image if none is provided
    const defaultAvatar = "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg";

    // Format person details for display
    const fullName = `${person.data["first name"] || ''} ${person.data["last name"] || ''}`.trim();
    const location = person.data.location || 'Unknown location';
    const birthday = person.data.birthday || 'No birthday info';
    const gender = person.data.gender === 'M' ? 'Male' : person.data.gender === 'F' ? 'Female' : 'Not specified';

    // Create the card element
    const card = document.createElement('div');
    card.className = 'person-card';
    card.dataset.id = person.id;

    card.innerHTML = `
        <div class="person-card-avatar">
            <img 
                src="${person.data.avatar || defaultAvatar}" 
                alt="${fullName}" 
                class="avatar ${person.data.gender === 'M' ? 'male' : person.data.gender === 'F' ? 'female' : 'neutral'}"
            />
        </div>
        
        <div class="person-card-info">
            <h3 class="person-name">${fullName}</h3>
            
            <div class="person-details">
                <div class="detail">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${location}</span>
                </div>
                
                <div class="detail">
                    <span class="detail-label">Gender:</span>
                    <span class="detail-value">${gender}</span>
                </div>
                
                ${person.data.birthday ? `
                    <div class="detail">
                        <span class="detail-label">Birthday:</span>
                        <span class="detail-value">${birthday}</span>
                    </div>
                ` : ''}
                
                ${person.data.work ? `
                    <div class="detail">
                        <span class="detail-label">Work:</span>
                        <span class="detail-value">${person.data.work}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="person-card-action">
            <button class="add-to-tree-btn">Add to Tree</button>
        </div>
    `;

    // Add person selection handler
    function handlePersonSelection() {
        if (searchOptions.onPersonSelect) {
            // Add 'adding' class for styling
            card.classList.add('adding');

            // Replace card content with loading indicator
            card.innerHTML = `
                <div class="adding-indicator">
                    <div class="adding-spinner"></div>
                    <div>Adding to chart...</div>
                </div>
            `;

            // Make sure person has a rels object to prevent chart errors
            if (!person.rels) {
                person.rels = { "spouses": [], "children": [] };
            }

            // Call the selection handler after a short delay
            setTimeout(() => {
                searchOptions.onPersonSelect(person);

                // After adding person to the chart, hide all search results
                setTimeout(() => {
                    // Clear the search input
                    if (searchInput) {
                        searchInput.value = '';
                    }

                    // Hide the search results
                    if (personCards) {
                        personCards.innerHTML = '';
                    }

                    // Hide results count
                    if (resultsCount) {
                        resultsCount.style.display = 'none';
                    }

                    // Reset any error messages
                    if (searchError) {
                        searchError.style.display = 'none';
                    }
                }, 1000);
            }, 500);
        }
    }

    // Add click handler to the entire card
    card.addEventListener('click', (e) => {
        // Only respond to clicks outside buttons
        if (!e.target.closest('button')) {
            handlePersonSelection();
        }
    });

    // Add button click handler
    const addButton = card.querySelector('.add-to-tree-btn');
    if (addButton) {
        addButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            handlePersonSelection();
        });
    }

    return card;
}

/**
 * Clear search results with smooth animation
 */
export function clearSearchResults() {
    if (!personCards || !resultsCount || !searchError) return;

    // Apply hiding classes for smooth transition
    personCards.classList.add('hiding');
    resultsCount.classList.add('hiding');

    // Find the search component container
    const searchComponent = document.querySelector('.search-component');
    if (searchComponent) {
        searchComponent.classList.add('results-hidden');
    }

    // Hide error message immediately
    searchError.style.display = 'none';

    // After transition completes, fully clear the content
    setTimeout(() => {
        // Clear the content
        personCards.innerHTML = '';

        // Reset display properties
        resultsCount.style.display = 'none';

        // Remove transition classes
        personCards.classList.remove('hiding');
        resultsCount.classList.remove('hiding');

        // Clear the search input
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus(); // Optional: Return focus to search input
        }
    }, 500); // Match this timing with the CSS transition duration
}