// Edit Form functionality - Updated with image upload support
import { getChartInstance, openEditTree, clearCurrentEditPerson } from './chart.js';
import { resetAddRelativeState } from './addRelative.js';
import { initEditRelations, saveRelationships } from './editRelations.js';
import { ImageUpload } from './imageUpload.js';
import { ImageCropper } from './imageCropper.js';

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
    console.log("editForm.js openEditForm ", person);

    if (!editForm || !editFormContent) {
        console.error('Edit form elements not found');
        return;
    }

    try {
        // ⚠️ IMPORTANT: Clear the edit form content completely first
        editFormContent.innerHTML = '';
        console.log("Inside editForm.js ", person);

        // Make form visible
        editForm.classList.add('visible');

        // Set title
        const editFormTitle = document.getElementById('edit-form-title');
        if (editFormTitle && person) {
            console.log("Got the edit-form-title ", editFormTitle);
            editFormTitle.textContent = `Edit: ${person.data["first name"] || ''} ${person.data["last name"] || ''}`;
        }

        // Wait a brief moment before opening the edit tree - this helps with timing issues
        console.log("Trying to open openEditTree", person);
        setTimeout(() => {
            // Open edit tree form for this person using direct function
            openEditTree(person);

            // Initialize edit relations after a slight delay to ensure the f3 form is rendered
            setTimeout(() => {
                initEditRelations(person);
                // Inject image controls into the generated form
                injectImageControls(person);
            }, 100);
        }, 50);

        // Add a mutation observer to detect when the family form is added to the DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (let i = 0; i < mutation.addedNodes.length; i++) {
                        const node = mutation.addedNodes[i];
                        if (node.nodeType === 1 && node.querySelector && node.querySelector('#familyForm')) {
                            // We found the family form, initialize edit relations
                            initEditRelations(person);
                            observer.disconnect();
                            break;
                        }
                    }
                }
            });
        });

        // Start observing the edit form content
        observer.observe(editFormContent, { childList: true, subtree: true });

        console.log('Edit form opened for person:', person.id);
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

    // Find the form and add submission handler
    const form = document.querySelector('#familyForm');
    if (form && !form.hasAttribute('data-image-handler-added')) {
        form.setAttribute('data-image-handler-added', 'true');
        
        // Override form submission to handle image upload
        const originalSubmit = form.onsubmit;
        form.onsubmit = async function(e) {
            e.preventDefault();
            
            // Check if there's a pending image upload
            if (currentImageUpload && currentImageUpload.hasImage && currentImageUpload.hasImage() && !currentImageUpload.isUploaded()) {
                try {
                    console.log('Uploading image before form submission...');
                    await currentImageUpload.uploadImage(person.id);
                    console.log('Image uploaded successfully');
                } catch (error) {
                    console.error('Image upload failed:', error);
                    alert('Failed to upload image: ' + error.message);
                    return false; // Don't submit form if image upload fails
                }
            }
            
            // Continue with original form submission if it exists
            if (originalSubmit) {
                return originalSubmit.call(this, e);
            } else {
                // Default form submission
                this.submit();
            }
        };
    }

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
                }
            });
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
                },
                onUploadError: (error) => {
                    console.error('Cropped image upload failed:', error);
                    alert('Failed to upload cropped image: ' + error.message);
                },
                onCancel: () => {
                    cropContainer.style.display = 'none';
                }
            });
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