// addPerson.js

import { createNewPerson, updatePersonData } from './api.js';
import { updateChartData } from './chart.js';
import { searchByName } from './api.js';
import { chartData } from './app.js';
import { isUserAuthenticated, showLoginForm } from './auth.js';
import { ImageUpload } from './imageUpload.js';
import { ImageUtils } from './imageUtils.js';

// Global state for selected relatives
let selectedRelatives = {
    father: null,
    mother: null,
    spouse: null,
    children: []
};
let personImageUpload = null;
let uploadedImageData = null;

/**
 * Show the add person form
 */
function showAddPersonForm() {
    // Check if user is authenticated
    if (!isUserAuthenticated()) {
        showAuthRequired('add new family members');
        return;
    }

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

    setTimeout(() => {
        initializeImageUploadForModal(modal);
    }, 100);

    // Add animation
    setTimeout(() => {
        backdrop.classList.add('visible');
        modal.classList.add('visible');
    }, 10);
}


// ADD this new function:
function initializeImageUploadForModal(modal) {
    console.log('Initializing image upload for modal...');

    // Set up the image tab click handler
    const imageTabBtn = modal.querySelector('.tab-btn[data-tab="image"]');
    if (imageTabBtn) {
        imageTabBtn.addEventListener('click', (e) => {
            // Deactivate all tabs
            modal.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
            // Hide all tab panes  
            modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            // Activate clicked tab
            e.target.classList.add('active');
            // Show image tab pane
            const imageTabPane = modal.querySelector('#image-tab');
            if (imageTabPane) {
                imageTabPane.classList.add('active');
            }
        });
    }

    // Initialize the image upload component
    setTimeout(() => {
        const container = document.getElementById('person-image-upload-container');
        if (container) {
            personImageUpload = new ImageUpload('person-image-upload-container', {
                maxSize: 10 * 1024 * 1024,
                previewSize: 120,
                onFileSelect: (file) => console.log('File selected:', file.name),
                onUploadSuccess: (imageData) => {
                    uploadedImageData = imageData;
                    showNotification('Image uploaded successfully!', 'success');
                },
                onUploadError: (error) => {
                    showNotification(`Image upload failed: ${error.message}`, 'error');
                },
                onRemove: () => {
                    uploadedImageData = null;
                }
            });
            console.log('Image upload component initialized successfully');
        } else {
            console.warn('Image upload container still not found');
        }
    }, 200);
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
                <button type="button" class="tab-btn" data-tab="image">Image</button>
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
                        <button type="button" class="next-tab-btn" data-next-tab="image">Next: Add Image</button>
                    </div>
                </div>
                <!-- Image Tab -->
                <div class="tab-pane" id="image-tab">
                    <div class="image-upload-section">
                        <h3>Profile Image</h3>
                        <p class="section-description">Upload a profile image for this person.</p>
                        <div id="person-image-upload-container"></div>
                    </div>
                </div>
                <div class="form-actions tab-nav">
                        <button type="button" class="next-tab-btn" data-next-tab="relationships">Next: Add Relationships</button>
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
 * Show authentication required message
 * @param {string} action - The action requiring authentication
 */
function showAuthRequired(action) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'unauthorized-overlay';
    overlay.innerHTML = `
        <h3>Authentication Required</h3>
        <p>You need to log in to ${action}.</p>
        <button id="auth-login-button">Log In</button>
    `;

    // Add to main content area
    const appMain = document.querySelector('.app-main');
    if (appMain) {
        appMain.appendChild(overlay);

        // Add event listener to login button
        overlay.querySelector('#auth-login-button').addEventListener('click', () => {
            // Remove overlay
            overlay.parentNode.removeChild(overlay);
            // Show login form
            showLoginForm();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 5000);
    }
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
    // Check if user is still authenticated
    if (!isUserAuthenticated()) {
        showNotification("Your session has expired. Please log in again.", "error");
        closeModal();
        showAuthRequired('search for relatives');
        return;
    }

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

    // Check if user is still authenticated
    if (!isUserAuthenticated()) {
        showNotification("Your session has expired. Please log in again.", "error");
        closeModal();
        showAuthRequired('add a new person');
        return;
    }

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
    console.log("addPerson.js updateConnectedPeopleRelationships ", newPersonId)
    console.log("selectedRelatives: ", selectRelative)
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


/**
 * Initialize image upload in Add Person modal
 * Call this function when setting up the Add Person form
 */
export function initializePersonImageUpload() {
    // Don't initialize immediately - wait for modal to be created
    console.log('Image upload initialization scheduled...');
}

/**
 * Add image tab to existing Add Person modal
 */
function addImageTabToAddPersonModal() {
    const tabsContainer = document.querySelector('.form-tabs');
    const tabContent = document.querySelector('.tab-content');

    if (!tabsContainer || !tabContent) {
        console.warn('Add Person modal structure not found');
        return;
    }

    // Add Image tab button if it doesn't exist
    if (!document.querySelector('.tab-btn[data-tab="image"]')) {
        const imageTabBtn = document.createElement('button');
        imageTabBtn.type = 'button';
        imageTabBtn.className = 'tab-btn';
        imageTabBtn.setAttribute('data-tab', 'image');
        imageTabBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
            </svg>
            Image
        `;

        // Insert before the last tab (usually the summary/review tab)
        const lastTab = tabsContainer.querySelector('.tab-btn:last-child');
        if (lastTab) {
            tabsContainer.insertBefore(imageTabBtn, lastTab);
        } else {
            tabsContainer.appendChild(imageTabBtn);
        }
    }

    // Add Image tab pane if it doesn't exist
    if (!document.querySelector('#image-tab')) {
        const imageTabPane = document.createElement('div');
        imageTabPane.id = 'image-tab';
        imageTabPane.className = 'tab-pane';
        imageTabPane.innerHTML = `
            <div class="image-upload-section">
                <h3>Profile Image</h3>
                <p class="section-description">Upload a profile image for this person. This will be used as their avatar throughout the application.</p>
                
                <div id="person-image-upload-container"></div>
                
                <div class="image-upload-tips">
                    <h4>Tips for better images:</h4>
                    <ul>
                        <li>Use a clear, high-quality photo</li>
                        <li>Make sure the person's face is clearly visible</li>
                        <li>Square images work best for avatars</li>
                        <li>Avoid dark or blurry photos</li>
                    </ul>
                </div>
            </div>
        `;

        // Insert before the last tab pane
        const lastTabPane = tabContent.querySelector('.tab-pane:last-child');
        if (lastTabPane) {
            tabContent.insertBefore(imageTabPane, lastTabPane);
        } else {
            tabContent.appendChild(imageTabPane);
        }
    }

    // Add tab switching functionality
    setupImageTabNavigation();
}

/**
 * Setup image upload component
 */
function setupImageUploadComponent() {
    const container = document.getElementById('person-image-upload-container');
    if (!container) {
        console.warn('Image upload container not found');
        return;
    }

    // Initialize ImageUpload component
    personImageUpload = new ImageUpload('person-image-upload-container', {
        maxSize: 10 * 1024 * 1024, // 10MB
        previewSize: 120,
        onFileSelect: handleImageFileSelect,
        onUploadSuccess: handleImageUploadSuccess,
        onUploadError: handleImageUploadError,
        onRemove: handleImageRemove
    });
}

/**
 * Setup tab navigation for image tab
 */
function setupImageTabNavigation() {
    const imageTabBtn = document.querySelector('.tab-btn[data-tab="image"]');
    if (imageTabBtn) {
        imageTabBtn.addEventListener('click', () => {
            // Switch to image tab
            switchToTab('image');
        });
    }
}

/**
 * Switch to specific tab
 */
function switchToTab(tabName) {
    // Deactivate all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Activate target tab
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const targetPane = document.querySelector(`#${tabName}-tab`);

    if (targetBtn) targetBtn.classList.add('active');
    if (targetPane) targetPane.classList.add('active');
}

/**
 * Handle image file selection
 */
function handleImageFileSelect(file) {
    console.log('Image file selected:', file.name);

    // You can add validation or preview logic here
    // The ImageUpload component handles basic validation
}

/**
 * Handle successful image upload
 */
function handleImageUploadSuccess(imageData) {
    console.log('Image uploaded successfully:', imageData);

    uploadedImageData = imageData;

    // Show success notification
    ImageUtils.showNotification('Image uploaded successfully!', 'success');

    // Enable form submission or move to next step
    updateFormValidationState();
}

/**
 * Handle image upload error
 */
function handleImageUploadError(error) {
    console.error('Image upload failed:', error);

    uploadedImageData = null;

    // Show error notification
    ImageUtils.showNotification(`Image upload failed: ${error.message}`, 'error');
}

/**
 * Handle image removal
 */
function handleImageRemove() {
    console.log('Image removed');

    uploadedImageData = null;
    updateFormValidationState();
}

/**
 * Update form validation state based on image upload
 */
function updateFormValidationState() {
    // This function can be used to enable/disable form submission
    // based on whether an image has been uploaded

    const submitBtn = document.querySelector('#add-person-form button[type="submit"]');
    if (submitBtn) {
        // You can add logic here to require image upload or make it optional
        // For now, we'll make it optional
    }
}

/**
 * Enhanced form submission handler with image data
 * This should replace or extend your existing form submission handler
 */
export async function handleAddPersonWithImage(formData) {
    try {
        // First, create the person without image
        const personData = {
            personname: formData.get('personname'),
            birthdate: formData.get('birthdate'),
            gender: formData.get('gender'),
            currentlocation: formData.get('currentlocation'),
            nativeplace: formData.get('nativeplace'),
            phone: formData.get('phone'),
            mail_id: formData.get('mail_id'),
            worksat: formData.get('worksat'),
            living: formData.get('living'),
            // ... other form fields
        };

        // Add relationship data if available
        if (selectedRelatives.father) {
            personData.fatherid = selectedRelatives.father.id;
        }
        if (selectedRelatives.mother) {
            personData.motherid = selectedRelatives.mother.id;
        }
        if (selectedRelatives.spouse) {
            personData.spouseids = [selectedRelatives.spouse.id];
        }

        console.log('Creating person with data:', personData);

        // Create person first
        const response = await fetch('/api/details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create person: ${response.status}`);
        }

        const result = await response.json();
        const newPersonId = result.id;

        console.log('Person created with ID:', newPersonId);

        // If there's an uploaded image, link it to the person
        if (uploadedImageData) {
            try {
                // The image should already be uploaded and linked during the upload process
                // If not, we can upload it now with the person ID
                if (!uploadedImageData.personId) {
                    await linkImageToPerson(uploadedImageData.imageId, newPersonId);
                }

                console.log('Image linked to person');
            } catch (imageError) {
                console.warn('Failed to link image to person:', imageError);
                // Don't fail the entire operation if image linking fails
            }
        }

        // Show success notification
        ImageUtils.showNotification('Person added successfully!', 'success');

        // Reset form and image upload
        resetAddPersonForm();

        // Close modal
        closeModal();

        // Trigger any necessary updates (like chart refresh)
        if (typeof refreshChart === 'function') {
            refreshChart();
        }

        return result;

    } catch (error) {
        console.error('Error adding person:', error);
        ImageUtils.showNotification(`Failed to add person: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Link an uploaded image to a person
 */
async function linkImageToPerson(imageId, personId) {
    try {
        const response = await fetch(`/api/images/${imageId}/link`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ personId })
        });

        if (!response.ok) {
            throw new Error(`Failed to link image: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error linking image to person:', error);
        throw error;
    }
}

/**
 * Reset the Add Person form including image upload
 */
function resetAddPersonForm() {
    // Reset the image upload component
    if (personImageUpload) {
        personImageUpload.reset();
    }

    // Clear uploaded image data
    uploadedImageData = null;

    // Reset form validation state
    updateFormValidationState();

    // Switch back to first tab
    switchToTab('basic');
}

/**
 * Pre-upload image with person ID after person creation
 * This can be called if you want to upload the image after creating the person
 */
export async function uploadPersonImage(personId) {
    if (!personImageUpload || !personImageUpload.state.file) {
        return null;
    }

    try {
        const imageData = await personImageUpload.uploadImage(personId);
        uploadedImageData = imageData;
        return imageData;
    } catch (error) {
        console.error('Failed to upload person image:', error);
        throw error;
    }
}

/**
 * Get current image upload state
 */
export function getImageUploadState() {
    return {
        hasImage: !!uploadedImageData,
        imageData: uploadedImageData,
        isUploading: personImageUpload ? personImageUpload.state.isUploading : false
    };
}

// Initialize when the module is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the Add Person modal to be set up
    setTimeout(initializePersonImageUpload, 100);
});



// Export necessary functions
export {
    showAddPersonForm,
    closeModal,
    showNotification
};