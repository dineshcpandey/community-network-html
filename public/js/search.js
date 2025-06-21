// Search functionality updates for the new layout
import { searchByName, searchByLocation } from './api.js';
import { getChartInstance, openEditTree, clearCurrentEditPerson } from './chart.js';
import { showNotification } from './addPerson.js';
import { isUserAuthenticated, showLoginForm } from './auth.js';

import { chartData, handleNodeSelect, clearChartData } from './app.js';

// Elements
let searchForm;
let searchInput;
let searchButton;
let searchError;
let resultsCount;
let personCards;
let searchResultsDropdown;
let closeResultsBtn;

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

    // Get all elements (doing this at setup time to ensure DOM is ready)
    searchForm = document.getElementById('search-form') || document.querySelector('.search-container');
    searchInput = document.getElementById('search-input');
    searchButton = document.getElementById('search-button');
    searchError = document.getElementById('search-error');
    resultsCount = document.getElementById('results-count');
    personCards = document.getElementById('person-cards');
    searchResultsDropdown = document.querySelector('.search-results-dropdown');
    closeResultsBtn = document.querySelector('.close-results-btn');

    // Debug check
    console.log('Search elements found:', {
        searchForm: !!searchForm,
        searchInput: !!searchInput,
        searchButton: !!searchButton,
        searchError: !!searchError,
        resultsCount: !!resultsCount,
        personCards: !!personCards,
        searchResultsDropdown: !!searchResultsDropdown,
        closeResultsBtn: !!closeResultsBtn
    });

    // Set up event listeners
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
        console.log('Search button click handler attached');
    } else {
        console.error('Search button not found');
    }

    if (searchForm && searchForm.tagName === 'FORM') {
        searchForm.addEventListener('submit', handleSearch);
        console.log('Search form submit handler attached');
    }

    // Set up radio buttons
    const radioButtons = document.querySelectorAll('input[name="searchType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleSearchTypeChange);
    });

    // Set up close results button
    if (closeResultsBtn) {
        closeResultsBtn.addEventListener('click', clearSearchResults);
    }

    console.log('Search component initialized');
}

/**
 * Handle search form submission
 * @param {Event} e - Form submit event
 */
async function handleSearch(e) {
    e.preventDefault();
    console.log('Search handler triggered');

    // Re-get elements to ensure we have the latest references
    if (!searchInput) searchInput = document.getElementById('search-input');
    if (!searchButton) searchButton = document.getElementById('search-button');
    if (!searchError) searchError = document.getElementById('search-error');
    if (!resultsCount) resultsCount = document.getElementById('results-count');
    if (!personCards) personCards = document.getElementById('person-cards');
    if (!searchResultsDropdown) searchResultsDropdown = document.querySelector('.search-results-dropdown');

    if (!searchInput || !searchButton) {
        console.error('Critical search elements not found');
        return;
    }

    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showError('Please enter a search term');
        showSearchResults();
        return;
    }

    // Get search type
    const searchTypeRadio = document.querySelector('input[name="searchType"]:checked');
    const searchType = searchTypeRadio ? searchTypeRadio.value : 'name'; // Default to name search

    console.log(`Performing ${searchType} search for: "${searchTerm}"`);

    // Update UI state
    searchButton.disabled = true;
    searchButton.textContent = 'Searching...';

    if (searchError) searchError.style.display = 'none';
    if (personCards) personCards.innerHTML = '';
    if (resultsCount) resultsCount.style.display = 'none';

    try {
        // Perform search
        let results;
        if (searchType === 'name') {
            results = await searchByName(searchTerm);
        } else {
            results = await searchByLocation(searchTerm);
        }

        console.log(`Search returned ${results.length} results`);

        // Check existing chart IDs
        const existingIds = new Set(chartData.map(person => person.id));

        // Count people already in the chart
        const inChartCount = results.filter(person => existingIds.has(person.id)).length;

        // Count new people that can be added
        const newCount = results.length - inChartCount;

        // Display results
        if (results.length === 0) {
            showError(`No results found for ${searchType}: "${searchTerm}"`);
        } else {
            let statusText = '';

            if (inChartCount > 0 && newCount > 0) {
                statusText = `Found ${results.length} people: ${inChartCount} already in chart, ${newCount} can be added`;
            } else if (inChartCount > 0) {
                statusText = `Found ${inChartCount} ${inChartCount === 1 ? 'person' : 'people'} already in your chart`;
            } else {
                statusText = `Found ${newCount} ${newCount === 1 ? 'person' : 'people'} to add to your chart`;
            }

            resultsCount.textContent = statusText;
            resultsCount.style.display = 'block';

            // Create person cards for all results
            results.forEach(person => {
                const card = createPersonCard(person, existingIds.has(person.id));
                personCards.appendChild(card);
            });
        }

        // Show search results dropdown
        showSearchResults();
    } catch (error) {
        console.error('Search error:', error);
        showError(`Error searching: ${error.message}`);
        showSearchResults();
    } finally {
        // Reset UI state
        searchButton.disabled = false;
        searchButton.textContent = 'Search';
    }
}

/**
 * Show the search results dropdown
 */
function showSearchResults() {
    if (!searchResultsDropdown) {
        searchResultsDropdown = document.querySelector('.search-results-dropdown');
    }

    if (searchResultsDropdown) {
        searchResultsDropdown.style.display = 'flex';
    } else {
        console.error('Search results dropdown not found');
    }
}

/**
 * Handle search type change
 * @param {Event} e - Radio button change event
 */
function handleSearchTypeChange(e) {
    const searchType = e.target.value;
    if (!searchInput) searchInput = document.getElementById('search-input');

    if (searchInput) {
        searchInput.placeholder = `Search by ${searchType}...`;
    }
}

/**
 * Show search error
 * @param {string} message - Error message
 */
function showError(message) {
    if (!searchError) searchError = document.getElementById('search-error');
    if (!resultsCount) resultsCount = document.getElementById('results-count');

    if (searchError) {
        searchError.textContent = message;
        searchError.style.display = 'block';

        if (resultsCount) {
            resultsCount.style.display = 'none';
        }
    }

    console.error('Search error:', message);
}

/**
 * Create a person card element
 * @param {Object} person - Person data
 * @returns {HTMLElement} The card element
 */
function createPersonCard(person, isInChart) {
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

    // Add a class if the person is already in chart
    if (isInChart) {
        card.classList.add('in-chart');
    }

    // Determine if Add button should be auth-restricted
    const addBtnAuthRequired = !isInChart && !isUserAuthenticated() ? 'data-auth-required="true"' : '';

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
            <button class="${isInChart ? 'locate-in-tree-btn' : 'add-to-tree-btn'}" ${addBtnAuthRequired}>
                ${isInChart ? 'Show in Tree' : 'Add to Tree'}
            </button>
        </div>
    `;

    // Add click handler to the entire card
    card.addEventListener('click', (e) => {
        // Only respond to clicks outside buttons
        if (!e.target.closest('button')) {
            handlePersonSelection(person, isInChart);
        }
    });

    // Add button click handler
    const actionButton = card.querySelector(isInChart ? '.locate-in-tree-btn' : '.add-to-tree-btn');
    if (actionButton) {
        actionButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click

            // Check authentication for adding to tree
            if (!isInChart && !isUserAuthenticated()) {
                showAuthRequiredMessage('add family members to the chart');
                return;
            }

            handlePersonSelection(person, isInChart);
        });
    }

    return card;
}

/**
 * Show authentication required message
 * @param {string} action - The action requiring authentication
 */
function showAuthRequiredMessage(action) {
    showNotification(`You need to log in to ${action}`, 'error');

    // Prompt to login after a short delay
    setTimeout(() => {
        if (confirm(`Would you like to log in to ${action}?`)) {
            showLoginForm();
        }
    }, 1000);
}

/**
* Handle person selection from search results
* @param {Object} person - The selected person
* @param {boolean} isInChart - Whether the person is already in chart
*/
function handlePersonSelection(person, isInChart) {
    if (isInChart) {
        // If person is already in chart, focus and highlight them
        highlightPersonInChart(person);
    } else {
        // For adding to chart, check authentication
        if (!isUserAuthenticated()) {
            showAuthRequiredMessage('add family members to the chart');
            return;
        }

        // Visually update the card to show loading
        const card = document.querySelector(`.person-card[data-id="${person.id}"]`);
        if (card) {
            card.classList.add('adding');
            card.innerHTML = `
                <div class="adding-indicator">
                    <div class="adding-spinner"></div>
                    <div>Adding to chart...</div>
                </div>
            `;
        }

        // Make sure person has a rels object
        if (!person.rels) {
            person.rels = { "spouses": [], "children": [] };
        }

        // Use the handler that properly fetches network data
        if (searchOptions.onPersonSelect) {
            searchOptions.onPersonSelect(person);
        }
    }
}

/**
 * Clear search results with smooth animation
 */
export function clearSearchResults() {
    if (!searchResultsDropdown) {
        searchResultsDropdown = document.querySelector('.search-results-dropdown');
    }

    if (!searchResultsDropdown) return;

    // Hide the dropdown
    searchResultsDropdown.style.display = 'none';

    // Reset the elements
    if (!personCards) personCards = document.getElementById('person-cards');
    if (personCards) {
        personCards.innerHTML = '';
    }

    if (!resultsCount) resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.style.display = 'none';
    }

    if (!searchError) searchError = document.getElementById('search-error');
    if (searchError) {
        searchError.style.display = 'none';
    }

    // Clear the search input
    if (!searchInput) searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
}


/**
 * Highlight a person in the family chart
 * @param {Object} person - The person to highlight
 */
function highlightPersonInChart(person) {
    // Get the chart instance
    const chartInstance = getChartInstance();
    if (!chartInstance || !chartInstance.chart) {
        console.error('Chart instance not found');
        showNotification('Error finding chart instance', 'error');
        return;
    }

    try {
        // Show a notification
        showNotification(`Showing ${person.data["first name"]} ${person.data["last name"]} in the chart`, 'info');

        // Clear search results
        clearSearchResults();

        // Set this as the main node
        chartInstance.chart.updateMainId(person.id);
        chartInstance.chart.updateTree({
            tree_position: 'fit',
            transition_time: 1000
        });

        // Select the node
        handleNodeSelect(person);
    } catch (error) {
        console.error('Error highlighting person in chart:', error);
        showNotification('Error highlighting person in chart', 'error');
    }
}