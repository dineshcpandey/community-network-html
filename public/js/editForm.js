// Edit Form functionality - Updated with image upload support
import { getChartInstance, openEditTree, clearCurrentEditPerson } from './chart.js';
import { resetAddRelativeState } from './addRelative.js';
import { initEditRelations, saveRelationships } from './editRelations.js';
import { ImageUpload } from './imageUpload.js';
import { ImageCropper } from './imageCropper.js';

// Export ImageUpload and ImageCropper for access by other modules
export { ImageUpload, ImageCropper };

// Elements
const editForm = document.getElementById('edit-form');
const closeEditFormBtn = document.getElementById('close-edit-form');
// Tab elements
const tabButtons = [
  document.getElementById('tab-basic'),
  document.getElementById('tab-relationships'),
  document.getElementById('tab-images'),
  document.getElementById('tab-notes')
];
const tabPanels = [
  document.getElementById('tabpanel-basic'),
  document.getElementById('tabpanel-relationships'),
  document.getElementById('tabpanel-images'),
  document.getElementById('tabpanel-notes')
];
// Tab switching logic
function switchTab(idx) {
  tabButtons.forEach((btn, i) => {
    if (!btn) return;
    btn.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    btn.tabIndex = i === idx ? 0 : -1;
    btn.classList.toggle('active', i === idx);
    if (tabPanels[i]) tabPanels[i].hidden = i !== idx;
  });
}

tabButtons.forEach((btn, idx) => {
  if (!btn) return;
  btn.addEventListener('click', () => switchTab(idx));
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabButtons[(idx + 1) % tabButtons.length].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabButtons[(idx - 1 + tabButtons.length) % tabButtons.length].focus();
    }
  });
});

// Default to first tab
switchTab(0);

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

    // Add stylesheet for edit relations
    addRelationsStylesheet();

    console.log('Edit form initialized');
}

/**
 * Add the CSS stylesheet for edit relations
 */
function addRelationsStylesheet() {
    // Check if stylesheet is already added
    if (document.getElementById('edit-relations-styles')) return;

    const link = document.createElement('link');
    link.id = 'edit-relations-styles';
    link.rel = 'stylesheet';
    link.href = './styles/editRelations.css';
    document.head.appendChild(link);
}

/**
 * Open edit form for a specific person
 * @param {Object} person - Person data
 */
export function openEditForm(person) {
    // Clear all tab panels
    tabPanels.forEach(panel => { if (panel) panel.innerHTML = ''; });
    if (!editForm) {
        console.error('Edit form element not found');
        return;
    }
    try {
        editForm.classList.add('visible');
        const editFormTitle = document.getElementById('edit-form-title');
        if (editFormTitle && person) {
            editFormTitle.textContent = `Edit: ${person.data["first name"] || ''} ${person.data["last name"] || ''}`;
        }
        // Render Basic Info form into the first tab
        if (tabPanels[0]) {
            tabPanels[0].innerHTML = '<div id="edit-form-content-basic"></div>';
            // Render the main edit tree form into this panel
            // Use the chart.js openEditTree function, but override the container
            if (window.getChartInstance && window.getChartInstance().editTree) {
                // If editTree instance exists, destroy it first
                try { window.getChartInstance().editTree.destroy(); } catch (e) {}
            }
            // Use the global chart instance if available
            if (window.getChartInstance && window.getChartInstance().chart && window.getChartInstance().chart.editTree) {
                const chart = window.getChartInstance().chart;
                if (chart) {
                    // Create a new editTree instance and set its container
                    const editTree = chart.editTree();
                    editTree.cont = document.getElementById('edit-form-content-basic');
                    editTree.setFields([
                        "first name",
                        "last name",
                        "birthday",
                        "avatar",
                        "location",
                        "work"
                    ]).fixed(true).setEditFirst(true);
                    editTree.open({ data: person });
                }
            }
        }
        // Render Relationships section into the second tab
        if (tabPanels[1]) {
            tabPanels[1].innerHTML = '<div id="edit-form-content-relationships"></div>';
            // Call initEditRelations with a custom container
            setTimeout(() => {
                if (window.initEditRelations) {
                    window.initEditRelations(person, 'edit-form-content-relationships');
                } else if (typeof initEditRelations === 'function') {
                    initEditRelations(person);
                }
            }, 100);
        }
        // Render Images section into the third tab
        if (tabPanels[2]) {
            tabPanels[2].innerHTML = '<div id="edit-form-content-images"></div>';
            // Inject image controls into this panel
            setTimeout(() => {
                if (typeof injectImageControls === 'function') {
                    injectImageControls(person, 'edit-form-content-images');
                }
            }, 200);
        }
        // Render Notes section into the fourth tab (stub)
        if (tabPanels[3]) {
            tabPanels[3].innerHTML = '<div id="edit-form-content-notes"><textarea class="neu-input" rows="6" placeholder="Add notes about this person..."></textarea></div>';
        }
    } catch (error) {
        console.error('Error opening edit form:', error);
    }
}

/**
 * Hook into the form submission process to save relationships
 * This function should be called by the chart.js when handling form submission
 * @param {Object} person - The person being edited
 * @returns {Promise} Promise resolving when relationships are saved
 */
export async function saveRelationshipsOnSubmit(person) {
    try {
        return await saveRelationships();
    } catch (error) {
        console.error('Error saving relationships on submit:', error);
        throw error;
    }
}

/**
 * Close edit form
 */
export function closeEditForm() {
    if (editForm) {
        editForm.classList.remove('visible');
    }

    // Clear the form content when closing
    if (editFormContent) {
        editFormContent.innerHTML = '';
    }

    // Clear the current edit person reference
    clearCurrentEditPerson();

    // Also reset the add relative state
    resetAddRelativeState();

    console.log('Edit form closed and cleared');
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

/**
 * Inject image controls into the family-chart generated form
 * @param {Object} person - Person data
 */
function injectImageControls(person) {
    // Wait for the form to be fully rendered
    const familyForm = document.getElementById('familyForm');
    if (!familyForm) {
        console.log('Family form not found, retrying...');
        setTimeout(() => injectImageControls(person), 50);
        return;
    }

    // Find the gender radio section to insert image controls after it
    const genderSection = familyForm.querySelector('.f3-radio-group');
    if (!genderSection) {
        console.log('Gender section not found, skipping image controls injection');
        return;
    }

    // Create image controls HTML
    const imageControlsHTML = `
        <div class="f3-image-section">
            <div class="f3-avatar-container">
                <div class="f3-current-avatar" id="current-avatar-${person.id}">
                    <img src="${person.data.avatar || '/images/default-avatar.png'}" 
                         alt="Current avatar" 
                         onerror="this.src='/images/default-avatar.png'"
                         class="f3-avatar-img">
                    <div class="f3-avatar-overlay">
                        <button type="button" class="f3-change-image-btn" data-person-id="${person.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            Change
                        </button>
                    </div>
                </div>
                <div class="f3-avatar-options" id="avatar-options-${person.id}" style="display: none;">
                    <button type="button" class="f3-upload-btn" data-person-id="${person.id}">Upload New</button>
                    <button type="button" class="f3-crop-btn" data-person-id="${person.id}">Crop Avatar</button>
                    <button type="button" class="f3-cancel-avatar-btn" data-person-id="${person.id}">Cancel</button>
                </div>
            </div>
        </div>
        
        <!-- Hidden containers for upload/crop components -->
        <div id="f3-image-upload-container-${person.id}" class="f3-image-container" style="display: none;"></div>
        <div id="f3-image-cropper-container-${person.id}" class="f3-image-container" style="display: none;"></div>
    `;

    // Insert after gender section
    genderSection.insertAdjacentHTML('afterend', imageControlsHTML);

    // Set up event listeners
    setupImageControlEvents(person);
}

/**
 * Set up event listeners for image controls
 * @param {Object} person - Person data
 */
function setupImageControlEvents(person) {
    let currentImageUpload = null; // Store current ImageUpload instance
    
    const changeBtn = document.querySelector(`.f3-change-image-btn[data-person-id="${person.id}"]`);
    const uploadBtn = document.querySelector(`.f3-upload-btn[data-person-id="${person.id}"]`);
    const cropBtn = document.querySelector(`.f3-crop-btn[data-person-id="${person.id}"]`);
    const cancelBtn = document.querySelector(`.f3-cancel-avatar-btn[data-person-id="${person.id}"]`);
    const avatarOptions = document.getElementById(`avatar-options-${person.id}`);
    const uploadContainer = document.getElementById(`f3-image-upload-container-${person.id}`);
    const cropContainer = document.getElementById(`f3-image-cropper-container-${person.id}`);

    // Remove the old form submission override since we now handle it in chart.js
    // The form submission will be handled by the f3EditTree's onChange callback
    // which will call handlePendingImageUploads before submitting form data

    if (changeBtn && avatarOptions) {
        changeBtn.addEventListener('click', () => {
            const isVisible = avatarOptions.style.display !== 'none';
            avatarOptions.style.display = isVisible ? 'none' : 'block';
            
            // Hide any open containers
            if (uploadContainer) uploadContainer.style.display = 'none';
            if (cropContainer) cropContainer.style.display = 'none';
        });
    }

    if (uploadBtn && uploadContainer) {
        uploadBtn.addEventListener('click', () => {
            // Hide other containers and options
            if (avatarOptions) avatarOptions.style.display = 'none';
            if (cropContainer) cropContainer.style.display = 'none';
            
            // Show upload container
            uploadContainer.style.display = 'block';
            uploadContainer.innerHTML = `<div id="person-image-upload-${person.id}"></div>`;
            
            // Initialize ImageUpload component with deferred upload
            currentImageUpload = new ImageUpload(`person-image-upload-${person.id}`, {
                deferUpload: true, // Use deferred upload mode
                onFileSelect: (file) => {
                    console.log('Image file selected:', file.name);
                    // Create preview URL and update avatar
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        updateAvatarDisplay(person.id, e.target.result);
                    };
                    reader.readAsDataURL(file);
                    
                    // Hide upload container and show preview in avatar
                    uploadContainer.style.display = 'none';
                    if (avatarOptions) avatarOptions.style.display = 'none';
                },
                onReady: (file) => {
                    console.log('Image ready for upload:', file.name);
                },
                onRemove: () => {
                    console.log('Image removed');
                    // Reset avatar to original image
                    updateAvatarDisplay(person.id, person.data.avatar || '/images/default-avatar.png');
                    currentImageUpload = null; // Clear the instance
                    uploadContainer._imageUploadInstance = null; // Clear container reference
                }
            });
            
            // Store the instance on the container for later access
            uploadContainer._imageUploadInstance = currentImageUpload;
        });
    }

    if (cropBtn && cropContainer) {
        cropBtn.addEventListener('click', () => {
            // Hide other containers and options
            if (avatarOptions) avatarOptions.style.display = 'none';
            if (uploadContainer) uploadContainer.style.display = 'none';
            
            // Show crop container
            cropContainer.style.display = 'block';
            cropContainer.innerHTML = `<div id="person-image-cropper-${person.id}"></div>`;
            
            // Initialize ImageCropper component
            const imageCropper = new ImageCropper(`person-image-cropper-${person.id}`, {
                personId: person.id, // Pass the person ID
                onUploadSuccess: (data) => {
                    console.log('Cropped image uploaded successfully:', data);
                    updateAvatarDisplay(person.id, data.filePath || data.imageUrl);
                    cropContainer.style.display = 'none';
                    cropContainer._imageCropperInstance = null; // Clear container reference
                },
                onUploadError: (error) => {
                    console.error('Cropped image upload failed:', error);
                    alert('Failed to upload cropped image: ' + error.message);
                },
                onCancel: () => {
                    cropContainer.style.display = 'none';
                    cropContainer._imageCropperInstance = null; // Clear container reference
                }
            });
            
            // Store the instance on the container for later access
            cropContainer._imageCropperInstance = imageCropper;
        });
    }

    if (cancelBtn && avatarOptions) {
        cancelBtn.addEventListener('click', () => {
            avatarOptions.style.display = 'none';
            if (uploadContainer) uploadContainer.style.display = 'none';
            if (cropContainer) cropContainer.style.display = 'none';
        });
    }
}

/**
 * Update the avatar display with new image
 * @param {string} personId - Person ID
 * @param {string} imageUrl - New image URL
 */
function updateAvatarDisplay(personId, imageUrl) {
    const avatarImg = document.querySelector(`#current-avatar-${personId} .f3-avatar-img`);
    if (avatarImg) {
        avatarImg.src = imageUrl;
    }
}