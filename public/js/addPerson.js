// addPerson.js

import { createNewPerson, updatePersonData } from './api.js';
import { updateChartData } from './chart.js';
import { searchByName } from './api.js';
import { chartData } from './app.js';

// Global state for selected relatives
let selectedRelatives = {
    father: null,
    mother: null,
    spouse: null,
    children: []
};

/**
 * Show the add person form
 */
function showAddPersonForm() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'add-person-modal';

    // Create form content with both basic info and relationships sections
    modal.innerHTML = createModalContent();

    document.body.appendChild(modal);

    // Add event listeners
    setupFormEventListeners(modal);

    // Add animation
    setTimeout(() => {
        backdrop.classList.add('visible');
        modal.classList.add('visible');
    }, 10);
}

/**
 * Create the modal content HTML
 */
function createModalContent() {
    return `
        <div class="add-person-header">
            <h2>Add New Person</h2>
            <button class="close-modal-btn">&times;</button>
        </div>
        
        <form id="add-person-form" class="add-person-form">
            <div class="form-tabs">
                <button type="button" class="tab-btn active" data-tab="basic-info">Basic Information</button>
                <button type="button" class="tab-btn" data-tab="relationships">Relationships</button>
            </div>
            
            <div class="tab-content">
                <!-- Basic Information Tab -->
                <div class="tab-pane active" id="basic-info-tab">
                    <div class="form-field">
                        <label>First Name <span class="required">*</span></label>
                        <input type="text" name="first-name" required>
                    </div>
                    
                    <div class="form-field">
                        <label>Last Name <span class="required">*</span></label>
                        <input type="text" name="last-name" required>
                    </div>
                    
                    <div class="form-field">
                        <label>Gender <span class="required">*</span></label>
                        <div class="radio-group">
                            <label><input type="radio" name="gender" value="M" checked> Male</label>
                            <label><input type="radio" name="gender" value="F"> Female</label>
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label>Birthday</label>
                        <input type="text" name="birthday" placeholder="YYYY-MM-DD">
                    </div>
                    
                    <div class="form-field">
                        <label>Location</label>
                        <input type="text" name="location">
                    </div>
                    
                    <div class="form-field">
                        <label>Work</label>
                        <input type="text" name="work">
                    </div>
                    
                    <div class="form-field">
                        <label>Avatar URL</label>
                        <input type="text" name="avatar" value="https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg">
                    </div>
                    
                    <div class="form-actions tab-nav">
                        <button type="button" class="next-tab-btn" data-next-tab="relationships">Next: Add Relationships</button>
                    </div>
                </div>
                
                <!-- Relationships Tab -->
                <div class="tab-pane" id="relationships-tab">
                    <div class="form-field">
                        <label>Father</label>
                        <div class="relationship-selector" id="father-selector">
                            <input type="text" class="relationship-search" data-rel-type="father" placeholder="Search for father...">
                            <div class="search-results" data-for="father"></div>
                            <div class="selected-relative" data-for="father">
                                <p class="no-selection">No father selected</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label>Mother</label>
                        <div class="relationship-selector" id="mother-selector">
                            <input type="text" class="relationship-search" data-rel-type="mother" placeholder="Search for mother...">
                            <div class="search-results" data-for="mother"></div>
                            <div class="selected-relative" data-for="mother">
                                <p class="no-selection">No mother selected</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label>Spouse</label>
                        <div class="relationship-selector" id="spouse-selector">
                            <input type="text" class="relationship-search" data-rel-type="spouse" placeholder="Search for spouse...">
                            <div class="search-results" data-for="spouse"></div>
                            <div class="selected-relative" data-for="spouse">
                                <p class="no-selection">No spouse selected</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-field">
                        <label>Children</label>
                        <div class="relationship-selector" id="children-selector">
                            <input type="text" class="relationship-search" data-rel-type="children" placeholder="Search for children...">
                            <div class="search-results" data-for="children"></div>
                            <div class="selected-relatives" data-for="children">
                                <p class="no-selection">No children selected</p>
                                <div class="selected-children-list"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions tab-nav">
                        <button type="button" class="prev-tab-btn" data-prev-tab="basic-info">Back to Basic Info</button>
                        <button type="submit" class="submit-btn">Create Person</button>
                    </div>
                </div>
            </div>
        </form>
    `;
}

/**
 * Set up event listeners for the add person form
 * @param {HTMLElement} modal - The modal container
 */
function setupFormEventListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', closeModal);

    // Tab navigation
    const tabBtns = modal.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Deactivate all tabs
            tabBtns.forEach(tb => tb.classList.remove('active'));

            // Hide all tab panes
            modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            // Activate clicked tab
            e.target.classList.add('active');

            // Show corresponding tab pane
            const tabId = e.target.dataset.tab;
            modal.querySelector(`#${tabId}-tab`).classList.add('active');
        });
    });

    // Next/Prev tab buttons
    modal.querySelectorAll('.next-tab-btn, .prev-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.nextTab || e.target.dataset.prevTab;
            modal.querySelector(`.tab-btn[data-tab="${targetTab}"]`).click();
        });
    });

    // Relationship search inputs
    const searchInputs = modal.querySelectorAll('.relationship-search');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(handleRelationshipSearch, 300));
    });

    // Form submission
    const form = modal.querySelector('#add-person-form');
    form.addEventListener('submit', handleAddPersonSubmit);

    // Close if clicking outside the modal
    const backdrop = document.querySelector('.modal-backdrop');
    backdrop.addEventListener('click', closeModal);
    modal.addEventListener('click', e => e.stopPropagation());
}

/**
 * Handle relationship search input
 * @param {Event} e - Input event
 */
async function handleRelationshipSearch(e) {
    const input = e.target;
    const searchTerm = input.value.trim();
    const relType = input.dataset.relType;
    const resultsContainer = input.parentNode.querySelector(`.search-results[data-for="${relType}"]`);

    // Clear previous results
    resultsContainer.innerHTML = '';

    if (searchTerm.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }

    try {
        // Show loading indicator
        resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
        resultsContainer.style.display = 'block';

        // Perform search
        const results = await searchByName(searchTerm);

        // Filter results based on relationship type
        let filteredResults = results;

        // For mother, only show females
        if (relType === 'mother') {
            filteredResults = results.filter(person => person.data.gender === 'F');
        }

        // For father, only show males
        if (relType === 'father') {
            filteredResults = results.filter(person => person.data.gender === 'M');
        }

        // For spouse, filter out already selected spouse
        if (relType === 'spouse' && selectedRelatives.spouse) {
            filteredResults = results.filter(person => person.id !== selectedRelatives.spouse.id);
        }

        // For children, filter out already selected children
        if (relType === 'children' && selectedRelatives.children.length > 0) {
            const selectedIds = selectedRelatives.children.map(child => child.id);
            filteredResults = results.filter(person => !selectedIds.includes(person.id));
        }

        // Clear loading and display results
        resultsContainer.innerHTML = '';

        if (filteredResults.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No matching people found</div>';
            return;
        }

        // Create result items
        filteredResults.forEach(person => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.personId = person.id;

            const fullName = `${person.data["first name"] || ''} ${person.data["last name"] || ''}`.trim();
            const location = person.data.location || 'Unknown location';
            const gender = person.data.gender === 'M' ? 'Male' : person.data.gender === 'F' ? 'Female' : 'Unknown';

            resultItem.innerHTML = `
                <div class="result-avatar">
                    <img src="${person.data.avatar || 'default-avatar.png'}" alt="${fullName}">
                </div>
                <div class="result-info">
                    <div class="result-name">${fullName}</div>
                    <div class="result-details">${gender} · ${location}</div>
                </div>
            `;

            // Add click handler
            resultItem.addEventListener('click', () => {
                selectRelative(person, relType);
                resultsContainer.style.display = 'none';
                input.value = ''; // Clear the input
            });

            resultsContainer.appendChild(resultItem);
        });

    } catch (error) {
        console.error('Error searching for relatives:', error);
        resultsContainer.innerHTML = '<div class="search-error">Error performing search</div>';
    }
}

/**
 * Select a relative and update the UI
 * @param {Object} person - The selected person
 * @param {string} relType - Relationship type
 */
function selectRelative(person, relType) {
    const fullName = `${person.data["first name"] || ''} ${person.data["last name"] || ''}`.trim();

    if (relType === 'children') {
        // Add to children array
        if (!selectedRelatives.children.some(child => child.id === person.id)) {
            selectedRelatives.children.push(person);
        }

        // Update children UI
        updateSelectedChildrenUI();
    } else {
        // For single-select relatives (father, mother, spouse)
        selectedRelatives[relType] = person;

        // Update UI
        const selectedContainer = document.querySelector(`.selected-relative[data-for="${relType}"]`);
        selectedContainer.innerHTML = `
            <div class="selected-person" data-person-id="${person.id}">
                <img src="${person.data.avatar || 'default-avatar.png'}" class="selected-avatar">
                <span class="selected-name">${fullName}</span>
                <button type="button" class="remove-relative-btn" data-rel-type="${relType}">&times;</button>
            </div>
        `;

        // Add event listener to remove button
        const removeBtn = selectedContainer.querySelector('.remove-relative-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeRelative(relType);
        });
    }
}

/**
 * Update the UI for selected children
 */
function updateSelectedChildrenUI() {
    const container = document.querySelector('.selected-relatives[data-for="children"]');
    const noSelectionText = container.querySelector('.no-selection');
    const childrenList = container.querySelector('.selected-children-list');

    if (selectedRelatives.children.length === 0) {
        noSelectionText.style.display = 'block';
        childrenList.innerHTML = '';
        return;
    }

    noSelectionText.style.display = 'none';
    childrenList.innerHTML = '';

    selectedRelatives.children.forEach(child => {
        const fullName = `${child.data["first name"] || ''} ${child.data["last name"] || ''}`.trim();

        const childItem = document.createElement('div');
        childItem.className = 'selected-child';
        childItem.dataset.personId = child.id;
        childItem.innerHTML = `
            <img src="${child.data.avatar || 'default-avatar.png'}" class="selected-avatar">
            <span class="selected-name">${fullName}</span>
            <button type="button" class="remove-child-btn" data-child-id="${child.id}">&times;</button>
        `;

        childrenList.appendChild(childItem);

        // Add event listener to remove button
        const removeBtn = childItem.querySelector('.remove-child-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeChild(child.id);
        });
    });
}

/**
 * Remove a selected relative
 * @param {string} relType - Relationship type
 */
function removeRelative(relType) {
    selectedRelatives[relType] = null;

    // Update UI
    const selectedContainer = document.querySelector(`.selected-relative[data-for="${relType}"]`);
    selectedContainer.innerHTML = `<p class="no-selection">No ${relType} selected</p>`;
}

/**
 * Remove a selected child
 * @param {string} childId - Child ID
 */
function removeChild(childId) {
    selectedRelatives.children = selectedRelatives.children.filter(child => child.id !== childId);
    updateSelectedChildrenUI();
}

/**
 * Handle form submission for adding a new person
 * @param {Event} e - Submit event
 */
async function handleAddPersonSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');

    try {
        // Disable submit button and show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        // Gather form data
        const firstName = form.querySelector('input[name="first-name"]').value;
        const lastName = form.querySelector('input[name="last-name"]').value;
        const gender = form.querySelector('input[name="gender"]:checked').value;
        const birthday = form.querySelector('input[name="birthday"]').value || null;
        const location = form.querySelector('input[name="location"]').value || '';
        const work = form.querySelector('input[name="work"]').value || '';
        const avatar = form.querySelector('input[name="avatar"]').value || 'https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg';

        // Build person data object
        const personData = {
            personname: `${firstName} ${lastName}`,
            birthdate: birthday,
            gender: gender,
            currentlocation: location,
            fatherid: selectedRelatives.father ? selectedRelatives.father.id : null,
            motherid: selectedRelatives.mother ? selectedRelatives.mother.id : null,
            spouseid: selectedRelatives.spouse ? selectedRelatives.spouse.id : null,
            worksat: work,
            nativeplace: '',
            phone: null,
            mail_id: null,
            living: "Y",
            data: {
                "first name": firstName,
                "last name": lastName,
                "gender": gender,
                "birthday": birthday,
                "location": location,
                "work": work,
                "avatar": avatar,
                "contact": {
                    "email": "",
                    "phone": ""
                },
                "nativePlace": ""
            },
            rels: {
                father: selectedRelatives.father ? selectedRelatives.father.id : null,
                mother: selectedRelatives.mother ? selectedRelatives.mother.id : null,
                spouses: selectedRelatives.spouse ? [selectedRelatives.spouse.id] : [],
                children: selectedRelatives.children.map(child => child.id)
            }
        };

        // Create new person
        const response = await createNewPerson(personData);

        // Extract the permanent ID
        const newPersonId = response.id;

        // Create complete person object with permanent ID
        const newPerson = {
            id: newPersonId,
            data: personData.data,
            rels: personData.rels
        };

        // Update relationships of connected people
        await updateConnectedPeopleRelationships(newPersonId);

        // Update chart data
        await updateChartData([newPerson]);

        // Show success notification
        showNotification('Person added successfully!', 'success');

        // Close the modal
        closeModal();

    } catch (error) {
        console.error('Error adding person:', error);

        // Show error notification
        showNotification(`Error adding person: ${error.message}`, 'error');

        // Reset submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Person';
    }
}

/**
 * Update relationships of connected people
 * @param {string} newPersonId - New person ID
 */
async function updateConnectedPeopleRelationships(newPersonId) {
    const updatePromises = [];

    // Update father if selected
    if (selectedRelatives.father) {
        const fatherUpdate = updatePersonRelationship(
            selectedRelatives.father,
            'children',
            newPersonId
        );
        updatePromises.push(fatherUpdate);
    }

    // Update mother if selected
    if (selectedRelatives.mother) {
        const motherUpdate = updatePersonRelationship(
            selectedRelatives.mother,
            'children',
            newPersonId
        );
        updatePromises.push(motherUpdate);
    }

    // Update spouse if selected
    if (selectedRelatives.spouse) {
        const spouseUpdate = updatePersonRelationship(
            selectedRelatives.spouse,
            'spouses',
            newPersonId
        );
        updatePromises.push(spouseUpdate);
    }

    // Update children if selected
    for (const child of selectedRelatives.children) {
        const childUpdate = updatePersonRelationship(
            child,
            child.data.gender === 'M' ? 'father' : 'mother',
            newPersonId,
            true // Single value, not array
        );
        updatePromises.push(childUpdate);
    }

    // Wait for all updates to complete
    await Promise.all(updatePromises);
}

/**
 * Update a specific relationship for a person
 * @param {Object} person - Person to update
 * @param {string} relType - Relationship type
 * @param {string} newPersonId - New person ID
 * @param {boolean} isSingleValue - Whether this is a single value (not array)
 */
async function updatePersonRelationship(person, relType, newPersonId, isSingleValue = false) {
    // Clone the person to avoid mutations
    const updatedPerson = JSON.parse(JSON.stringify(person));

    if (isSingleValue) {
        // For single-value relationships (father, mother)
        updatedPerson.rels[relType] = newPersonId;
    } else {
        // For array relationships (children, spouses)
        if (!updatedPerson.rels[relType]) {
            updatedPerson.rels[relType] = [];
        }

        if (!updatedPerson.rels[relType].includes(newPersonId)) {
            updatedPerson.rels[relType].push(newPersonId);
        }
    }

    // Update person in the backend
    return updatePersonData(person.id, updatedPerson);
}

/**
 * Close the modal
 */
function closeModal() {
    const backdrop = document.querySelector('.modal-backdrop');
    const modal = document.querySelector('.add-person-modal');

    if (backdrop && modal) {
        // Add closing animation
        backdrop.classList.remove('visible');
        modal.classList.remove('visible');

        // Remove elements after animation completes
        setTimeout(() => {
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            if (modal.parentNode) modal.parentNode.removeChild(modal);

            // Reset selected relatives
            selectedRelatives = {
                father: null,
                mother: null,
                spouse: null,
                children: []
            };
        }, 300);
    }
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - Notification type ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after animation duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Export necessary functions
export {
    showAddPersonForm,
    closeModal,
    showNotification
};