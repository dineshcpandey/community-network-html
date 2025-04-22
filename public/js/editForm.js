// Edit Form functionality
import { getChartInstance, openEditTree, clearCurrentEditPerson } from './chart.js';

// Elements
const editForm = document.getElementById('edit-form');
const editFormContent = document.getElementById('edit-form-content');
const closeEditFormBtn = document.getElementById('close-edit-form');

// Default options
let editOptions = {
    onClose: null,
};

/**
 * Set up edit form functionality
 * @param {Object} options - Edit form options
 */
export function setupEditForm(options = {}) {
    // Merge options
    editOptions = { ...editOptions, ...options };

    // Set up close button
    if (closeEditFormBtn) {
        closeEditFormBtn.addEventListener('click', handleClose);
    }

    console.log('Edit form initialized');
}

/**
 * Open edit form for a specific person
 * @param {Object} person - Person data
 */
export function openEditForm(person) {
    console.log("editForm.js openEditForm ", person)
    if (!editForm || !editFormContent) {
        console.error('Edit form elements not found');
        return;
    }

    try {
        // Make form visible
        editForm.classList.add('visible');
        console.log("Inside editForm.js ", person)
        // Set title
        const editFormTitle = document.getElementById('edit-form-title');
        if (editFormTitle && person) {
            editFormTitle.textContent = `Edit: ${person['first name'] || ''} ${person['last name'] || ''}`;
        }

        // Open edit tree form for this person using direct function
        openEditTree(person);
        console.log('Edit form opened for person:', person.id);
    } catch (error) {
        console.error('Error opening edit form:', error);
    }
}

/**
 * Close edit form
 */
export function closeEditForm() {
    if (editForm) {
        editForm.classList.remove('visible');
    }

    // Clear the current edit person reference
    clearCurrentEditPerson();
}

/**
 * Handle close button click
 */
function handleClose() {
    closeEditForm();

    if (editOptions.onClose) {
        editOptions.onClose();
    }
}