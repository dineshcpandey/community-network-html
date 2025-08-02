/**
 * Enhanced Form Integration
 * Integrates neumorphism modal system with existing add/edit person functionality
 */

import { NeuFormModal } from './neuFormModal.js';
import { createNewPerson, updatePersonData, searchByName } from './api.js';
import { updateChartData, getChartInstance } from './chart.js';
import { chartData } from './app.js';
import { isUserAuthenticated, showLoginForm } from './auth.js';

// Simple notification function for enhanced forms
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `neu-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: var(--neu-surface);
        border-radius: var(--neu-radius-md);
        box-shadow: 6px 6px 12px var(--neu-shadow-dark), -6px -6px 12px var(--neu-shadow-light);
        color: var(--neu-text);
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        border-left: 4px solid ${type === 'success' ? 'var(--neu-success)' : type === 'error' ? 'var(--neu-error)' : 'var(--neu-primary)'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Form field definitions
const PERSON_FORM_FIELDS = [
    // Avatar section
    {
        type: 'avatar',
        name: 'avatar',
        label: 'Profile Picture',
        section: 'avatar'
    },
    
    // Basic Information
    {
        type: 'text',
        name: 'firstName',
        label: 'First Name',
        placeholder: 'Enter first name',
        required: true,
        icon: '👤',
        section: 'basic-info'
    },
    {
        type: 'text',
        name: 'lastName',
        label: 'Last Name',
        placeholder: 'Enter last name',
        required: true,
        icon: '👤',
        section: 'basic-info'
    },
    {
        type: 'radio',
        name: 'gender',
        label: 'Gender',
        required: true,
        options: [
            { value: 'M', label: 'Male' },
            { value: 'F', label: 'Female' },
            { value: 'O', label: 'Other' }
        ],
        section: 'basic-info'
    },
    {
        type: 'text',
        name: 'birthday',
        label: 'Birth Year',
        placeholder: 'e.g., 1990',
        pattern: '\\d{4}',
        icon: '🎂',
        section: 'basic-info'
    },
    
    // Contact Information
    {
        type: 'email',
        name: 'email',
        label: 'Email',
        placeholder: 'Enter email address',
        icon: '📧',
        section: 'contact-info'
    },
    {
        type: 'tel',
        name: 'phone',
        label: 'Phone',
        placeholder: 'Enter phone number',
        icon: '📱',
        section: 'contact-info'
    },
    {
        type: 'text',
        name: 'location',
        label: 'Current Location',
        placeholder: 'Enter current city/location',
        icon: '📍',
        section: 'contact-info'
    },
    {
        type: 'text',
        name: 'nativePlace',
        label: 'Native Place',
        placeholder: 'Enter native place',
        icon: '🏠',
        section: 'contact-info'
    },
    
    // Professional Information
    {
        type: 'text',
        name: 'work',
        label: 'Occupation/Work',
        placeholder: 'Enter occupation or workplace',
        icon: '💼',
        section: 'professional-info'
    },
    {
        type: 'textarea',
        name: 'description',
        label: 'Additional Information',
        placeholder: 'Enter any additional details...',
        rows: 3,
        fullWidth: true,
        section: 'professional-info'
    }
];

// Relationship form fields
const RELATIONSHIP_FORM_FIELDS = [
    {
        type: 'text',
        name: 'fatherName',
        label: 'Father\'s Name',
        placeholder: 'Search for father...',
        icon: '👨',
        section: 'family-relations'
    },
    {
        type: 'text',
        name: 'motherName',
        label: 'Mother\'s Name',
        placeholder: 'Search for mother...',
        icon: '👩',
        section: 'family-relations'
    },
    {
        type: 'text',
        name: 'spouseName',
        label: 'Spouse\'s Name',
        placeholder: 'Search for spouse...',
        icon: '💑',
        section: 'family-relations'
    }
];

export class EnhancedPersonForm {
    constructor() {
        this.modal = null;
        this.isEditMode = false;
        this.currentPersonId = null;
        this.selectedRelatives = {
            father: null,
            mother: null,
            spouse: null,
            children: []
        };
        
        this.bindMethods();
    }
    
    bindMethods() {
        this.showAddForm = this.showAddForm.bind(this);
        this.showEditForm = this.showEditForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }
    
    /**
     * Show add person form
     */
    showAddForm() {
        // Check authentication
        if (!isUserAuthenticated()) {
            showNotification('Please log in to add new family members', 'warning');
            showLoginForm();
            return;
        }
        
        this.isEditMode = false;
        this.currentPersonId = null;
        this.selectedRelatives = {
            father: null,
            mother: null,
            spouse: null,
            children: []
        };
        
        // Create modal with person fields
        this.modal = new NeuFormModal({
            title: '✨ Add New Family Member',
            width: '900px',
            fields: [...PERSON_FORM_FIELDS, ...RELATIONSHIP_FORM_FIELDS],
            onSubmit: this.handleSubmit,
            onClose: this.handleClose
        });
        
        // Show modal
        this.modal.show({
            gender: 'M' // Default gender
        });
        
        // Setup relationship search after modal is shown
        setTimeout(() => this.setupRelationshipSearch(), 300);
    }
    
    /**
     * Show edit person form
     * @param {Object} personData - Person data to edit
     */
    async showEditForm(personData) {
        // Check authentication
        if (!isUserAuthenticated()) {
            showNotification('Please log in to edit family members', 'warning');
            showLoginForm();
            return;
        }
        
        this.isEditMode = true;
        this.currentPersonId = personData.id;
        
        // Transform person data for form (now async to look up relationships)
        const formData = await this.transformPersonDataForForm(personData);
        
        // Create modal with person fields
        this.modal = new NeuFormModal({
            title: `✏️ Edit ${formData.firstName} ${formData.lastName}`,
            width: '900px',
            fields: [...PERSON_FORM_FIELDS, ...RELATIONSHIP_FORM_FIELDS],
            data: formData,
            onSubmit: this.handleSubmit,
            onClose: this.handleClose
        });
        
        // Show modal
        this.modal.show(formData);
        
        // Setup relationship search after modal is shown
        setTimeout(() => this.setupRelationshipSearch(), 300);
    }
    
    /**
     * Transform person data from API format to form format
     */
    async transformPersonDataForForm(personData) {
        const data = personData.data || {};
        const rels = personData.rels || {};
        
        // Base form data
        const formData = {
            firstName: data['first name'] || '',
            lastName: data['last name'] || '',
            gender: data.gender || 'M',
            birthday: data.birthday || '',
            email: data.contact?.email || '',
            phone: data.contact?.phone || '',
            location: data.location || '',
            nativePlace: data.nativePlace || '',
            work: data.work || '',
            description: data.desc || '',
            avatar: data.avatar || '',
            fatherId: rels.father || '',
            motherId: rels.mother || '',
            spouseId: rels.spouses?.[0] || ''
        };
        
        // Look up relationship names from current chart data
        if (rels.father) {
            const father = chartData.find(p => p.id === rels.father);
            formData.fatherName = father ? father.data.label || `${father.data['first name'] || ''} ${father.data['last name'] || ''}`.trim() : '';
            this.selectedRelatives.father = father || null;
        }
        
        if (rels.mother) {
            const mother = chartData.find(p => p.id === rels.mother);
            formData.motherName = mother ? mother.data.label || `${mother.data['first name'] || ''} ${mother.data['last name'] || ''}`.trim() : '';
            this.selectedRelatives.mother = mother || null;
        }
        
        if (rels.spouses && rels.spouses.length > 0) {
            const spouse = chartData.find(p => p.id === rels.spouses[0]);
            formData.spouseName = spouse ? spouse.data.label || `${spouse.data['first name'] || ''} ${spouse.data['last name'] || ''}`.trim() : '';
            this.selectedRelatives.spouse = spouse || null;
        }
        
        return formData;
    }
    
    /**
     * Transform form data to API format
     */
    transformFormDataForAPI(formData) {
        console.log('🔄 ===== TRANSFORMING FORM DATA FOR API =====');
        console.log('🔄 Input form data:', formData);
        console.log('🔄 Form data keys:', Object.keys(formData));
        console.log('🔄 Selected relatives:', this.selectedRelatives);
        
        // Check for potentially large data
        Object.entries(formData).forEach(([key, value]) => {
            if (typeof value === 'string') {
                console.log(`🔄 String field "${key}": ${value.length} characters`);
                if (value.length > 1000) {
                    console.warn(`⚠️ Large string field detected: "${key}" = ${value.length} characters`);
                    console.warn(`⚠️ First 100 chars: ${value.substring(0, 100)}...`);
                }
            } else if (value && typeof value === 'object') {
                console.log(`🔄 Object field "${key}":`, typeof value, value.constructor.name);
                if (value instanceof File) {
                    console.log(`🔄 File details: name=${value.name}, size=${value.size}, type=${value.type}`);
                } else {
                    const jsonSize = JSON.stringify(value).length;
                    console.log(`🔄 Object size: ${jsonSize} characters`);
                    if (jsonSize > 1000) {
                        console.warn(`⚠️ Large object field detected: "${key}" = ${jsonSize} characters`);
                    }
                }
            }
        });
        
        const apiData = {
            data: {
                'first name': formData.firstName.trim(),
                'last name': formData.lastName.trim(),
                gender: formData.gender,
                birthday: formData.birthday.trim(),
                location: formData.location.trim(),
                nativePlace: formData.nativePlace.trim(),
                work: formData.work.trim(),
                desc: formData.description.trim(),
                avatar: formData.avatar || '',
                contact: {
                    email: formData.email.trim(),
                    phone: formData.phone.trim()
                },
                label: `${formData.firstName.trim()} ${formData.lastName.trim()}`
            },
            rels: {
                father: this.selectedRelatives.father?.id || '',
                mother: this.selectedRelatives.mother?.id || '',
                spouses: this.selectedRelatives.spouse ? [this.selectedRelatives.spouse.id] : [],
                children: this.selectedRelatives.children.map(child => child.id)
            }
        };

        console.log('🔄 Transformed API data:', apiData);
        console.log('🔄 API data size:', JSON.stringify(apiData).length + ' characters');
        console.log('🔄 API data.data size:', JSON.stringify(apiData.data).length + ' characters');
        console.log('🔄 API data.rels size:', JSON.stringify(apiData.rels).length + ' characters');
        
        // Check each field in the API data for size
        Object.entries(apiData.data).forEach(([key, value]) => {
            if (typeof value === 'string' && value.length > 500) {
                console.warn(`⚠️ Large API field detected: data.${key} = ${value.length} characters`);
            }
        });
        
        console.log('🔄 ===== FORM DATA TRANSFORMATION COMPLETED =====');
        return apiData;
    }
    
    /**
     * Setup relationship search functionality
     */
    setupRelationshipSearch() {
        if (!this.modal?.modal) return;
        
        const relationshipFields = ['fatherName', 'motherName', 'spouseName'];
        
        relationshipFields.forEach(fieldName => {
            const input = this.modal.modal.querySelector(`[name="${fieldName}"]`);
            if (!input) return;
            
            this.setupSearchInput(input, fieldName);
        });
    }
    
    /**
     * Setup search input with autocomplete
     */
    setupSearchInput(input, fieldName) {
        let searchTimeout;
        let resultsContainer;
        
        // Create results container
        const inputGroup = input.closest('.neu-input-group');
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'neu-search-results';
        inputGroup.appendChild(resultsContainer);
        
        // Add search styles
        this.addSearchStyles();
        
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const results = await searchByName(query);
                    this.displaySearchResults(resultsContainer, results, fieldName, input);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputGroup.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
    }
    
    /**
     * Display search results
     */
    displaySearchResults(container, results, fieldName, input) {
        if (!results.length) {
            container.innerHTML = '<div class="neu-search-no-results">No matches found</div>';
            container.style.display = 'block';
            return;
        }
        
        container.innerHTML = results.map(person => `
            <div class="neu-search-result" data-person-id="${person.id}">
                <div class="neu-search-result-avatar">
                    ${person.data.avatar ? 
                        `<img src="${person.data.avatar}" alt="${person.data.label}">` :
                        '<div class="neu-search-result-placeholder">👤</div>'
                    }
                </div>
                <div class="neu-search-result-info">
                    <div class="neu-search-result-name">${person.data.label}</div>
                    <div class="neu-search-result-details">
                        ${person.data.location ? `📍 ${person.data.location}` : ''}
                        ${person.data.work ? `💼 ${person.data.work}` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.style.display = 'block';
        
        // Add click handlers
        container.querySelectorAll('.neu-search-result').forEach(result => {
            result.addEventListener('click', () => {
                const personId = result.dataset.personId;
                const person = results.find(p => p.id === personId);
                
                if (person) {
                    this.selectRelative(fieldName, person, input);
                    container.style.display = 'none';
                }
            });
        });
    }
    
    /**
     * Select a relative
     */
    selectRelative(fieldType, person, input) {
        input.value = person.data.label;
        input.classList.add('success');
        
        // Store selected relative
        const relativeType = fieldType.replace('Name', '');
        this.selectedRelatives[relativeType] = person;
        
        // Show success message
        const messageEl = input.closest('.neu-input-group').querySelector('.neu-input-message');
        if (messageEl) {
            messageEl.textContent = '✓ Selected';
            messageEl.className = 'neu-input-message visible success';
        }
    }
    
    /**
     * Add search styles
     */
    addSearchStyles() {
        if (document.getElementById('neu-search-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'neu-search-styles';
        styles.textContent = `
            .neu-search-results {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--neu-surface);
                border-radius: var(--neu-radius-md);
                box-shadow: 
                    8px 8px 16px var(--neu-shadow-dark),
                    -8px -8px 16px var(--neu-shadow-light);
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                margin-top: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .neu-search-result {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .neu-search-result:hover {
                background: rgba(102, 126, 234, 0.1);
                transform: translateX(2px);
            }
            
            .neu-search-result:last-child {
                border-bottom: none;
            }
            
            .neu-search-result-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                overflow: hidden;
                background: var(--neu-surface);
                box-shadow: 
                    inset 2px 2px 4px var(--neu-shadow-dark),
                    inset -2px -2px 4px var(--neu-shadow-light);
            }
            
            .neu-search-result-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .neu-search-result-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                opacity: 0.6;
            }
            
            .neu-search-result-info {
                flex: 1;
            }
            
            .neu-search-result-name {
                font-weight: 600;
                color: var(--neu-text);
                margin-bottom: 4px;
            }
            
            .neu-search-result-details {
                font-size: 12px;
                color: var(--neu-text-secondary);
                opacity: 0.8;
            }
            
            .neu-search-no-results {
                padding: 16px;
                text-align: center;
                color: var(--neu-text-secondary);
                font-size: 14px;
                opacity: 0.7;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(formData) {
        try {
            console.log('🚀 ===== FORM SUBMISSION STARTED =====');
            console.log('📋 Mode:', this.isEditMode ? 'EDIT' : 'ADD');
            console.log('📋 Person ID (if editing):', this.currentPersonId);
            
            // Debug: Log the form data to verify image file is included
            console.log('🔍 Original Form submission data:', {
                hasAvatarFile: formData.hasAvatarFile,
                avatarFilePresent: !!formData.avatarFile,
                avatarFileName: formData.avatarFile?.name,
                avatarFileSize: formData.avatarFile?.size,
                avatarFileType: formData.avatarFile?.type,
                isEditMode: this.isEditMode,
                formDataKeys: Object.keys(formData),
                formDataSummary: Object.fromEntries(
                    Object.entries(formData).map(([key, value]) => [
                        key, 
                        key === 'avatarFile' && value ? 
                            `File(${value.name}, ${value.size} bytes)` : 
                            (typeof value === 'string' && value.length > 50 ? 
                                value.substring(0, 50) + '...' : value)
                    ])
                )
            });
            
            // Transform form data for API
            const personData = this.transformFormDataForAPI(formData);
            console.log('🔄 Transformed person data for API:', {
                dataKeys: Object.keys(personData),
                dataSize: JSON.stringify(personData).length + ' characters',
                personDataPreview: {
                    id: personData.id,
                    dataKeys: personData.data ? Object.keys(personData.data) : null,
                    relsKeys: personData.rels ? Object.keys(personData.rels) : null
                }
            });
            
            let result;
            if (this.isEditMode) {
                console.log('✏️ ===== UPDATING EXISTING PERSON =====');
                console.log('✏️ Person ID to update:', this.currentPersonId);
                console.log('✏️ Update data being sent:', JSON.stringify(personData, null, 2));
                
                // Update existing person
                result = await updatePersonData(this.currentPersonId, personData);
                console.log('✅ Update person API result:', result);
                showNotification(`${personData.data.label} updated successfully!`, 'success');
            } else {
                console.log('🆕 ===== CREATING NEW PERSON =====');
                console.log('🆕 Create data being sent:', JSON.stringify(personData, null, 2));
                console.log('🆕 Data size being sent:', JSON.stringify(personData).length + ' characters');
                
                // Create new person
                const createResult = await createNewPerson(personData);
                console.log('✅ Create person API result:', createResult);
                console.log('✅ Result type:', typeof createResult);
                console.log('✅ Result keys:', Object.keys(createResult || {}));
                
                // Ensure we have a valid person ID for image upload
                if (!createResult || !createResult.id) {
                    console.error('❌ Person creation failed - no ID returned:', createResult);
                    throw new Error('Person created but no ID returned from API. Cannot upload image.');
                }
                
                result = createResult;
                console.log('✅ Person created with ID:', result.id);
                showNotification(`${personData.data.label} added successfully!`, 'success');
            }
            
            // Handle image upload separately if a file was selected
            if (formData.hasAvatarFile && formData.avatarFile && result && result.id) {
                try {
                    console.log('📸 ===== STARTING IMAGE UPLOAD =====');
                    console.log('📸 Person ID for image upload:', result.id);
                    console.log('📸 Image file details:', {
                        name: formData.avatarFile.name,
                        size: formData.avatarFile.size,
                        type: formData.avatarFile.type,
                        lastModified: formData.avatarFile.lastModified
                    });
                    
                    showNotification('Uploading avatar...', 'info');
                    
                    // Import ImageUtils for upload
                    const { ImageUtils } = await import('./imageUtils.js');
                    
                    // Upload the image
                    const uploadResult = await ImageUtils.uploadImage(
                        formData.avatarFile, 
                        result.id
                    );
                    
                    console.log('📸 Image upload result:', uploadResult);
                    
                    if (uploadResult && uploadResult.success) {
                        console.log('✅ Avatar upload successful:', uploadResult);
                        showNotification('Avatar uploaded successfully!', 'success');
                    } else {
                        console.warn('⚠️ Avatar upload completed but success flag is false:', uploadResult);
                        showNotification('Avatar upload may have failed', 'warning');
                    }
                } catch (imageError) {
                    console.error('❌ Image upload error:', imageError);
                    console.error('❌ Image upload error stack:', imageError.stack);
                    showNotification('Person saved but avatar upload failed', 'warning');
                }
            } else {
                console.log('ℹ️ ===== SKIPPING IMAGE UPLOAD =====');
                console.log('ℹ️ Skip reasons:', {
                    hasAvatarFile: formData.hasAvatarFile,
                    hasFile: !!formData.avatarFile,
                    hasResult: !!result,
                });
            }
            
            // Update chart
            console.log('🔄 ===== UPDATING CHART =====');
            if (result && result.id) {
                try {
                    console.log('🔄 Fetching updated network data for person:', result.id);
                    // Fetch the updated network data for the person
                    const { fetchNetworkData } = await import('./api.js');
                    const networkData = await fetchNetworkData(result.id);
                    console.log('🔄 Network data fetched:', networkData ? 'success' : 'empty');
                    
                    // Update chart with the fresh network data
                    await updateChartData(networkData);
                    console.log('✅ Chart updated successfully after form submission');
                    
                } catch (chartError) {
                    console.error('❌ Chart update error:', chartError);
                    console.error('❌ Chart update error stack:', chartError.stack);
                    showNotification('Person saved but chart update failed. Please refresh the page.', 'warning');
                }
                
                // Highlight new/edited person
                setTimeout(() => {
                    console.log('🎯 Attempting to highlight person in chart:', result.id);
                    const chartInstance = getChartInstance();
                    if (chartInstance && result.id) {
                        const node = chartInstance.getNodeById(result.id);
                        if (node) {
                            console.log('✅ Person node found and selected in chart');
                            node.select();
                        } else {
                            console.warn('⚠️ Person node not found in chart for ID:', result.id);
                        }
                    } else {
                        console.warn('⚠️ Chart instance not available or no result ID');
                    }
                }, 500);
            } else {
                console.warn('⚠️ Form submission result does not contain an ID:', result);
                showNotification('Person saved but chart update skipped. Please refresh the page.', 'warning');
            }
            
            console.log('✅ ===== FORM SUBMISSION COMPLETED =====');
            
        } catch (error) {
            console.error('❌ ===== FORM SUBMISSION FAILED =====');
            console.error('❌ Form submission error:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Error name:', error.name);
            
            const action = this.isEditMode ? 'update' : 'add';
            showNotification(`Failed to ${action} person. Please try again.`, 'error');
            throw error; // Re-throw to prevent modal closing
        }
    }
    
    /**
     * Handle form close
     */
    handleClose() {
        this.modal = null;
        this.selectedRelatives = {
            father: null,
            mother: null,
            spouse: null,
            children: []
        };
    }
}

// Create global instance
export const enhancedPersonForm = new EnhancedPersonForm();

// Export convenience functions
export function showAddPersonForm() {
    enhancedPersonForm.showAddForm();
}

export async function showEditPersonForm(personData) {
    await enhancedPersonForm.showEditForm(personData);
}
