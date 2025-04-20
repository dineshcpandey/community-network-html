// Search functionality
import { searchByName, searchByLocation } from './api.js';

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

        // Display results
        if (results.length === 0) {
            showError(`No results found for ${searchType}: "${searchTerm}"`);
        } else {
            resultsCount.textContent = `Found ${results.length} ${results.length === 1 ? 'person' : 'people'}`;
            resultsCount.style.display = 'block';

            // Create person cards
            results.forEach(person => {
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

    // Add click handler
    card.addEventListener('click', () => {
        if (searchOptions.onPersonSelect) {
            searchOptions.onPersonSelect(person);
        }
    });

    // Add button click handler
    const addButton = card.querySelector('.add-to-tree-btn');
    if (addButton) {
        addButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            if (searchOptions.onPersonSelect) {
                searchOptions.onPersonSelect(person);
            }
        });
    }

    return card;
}