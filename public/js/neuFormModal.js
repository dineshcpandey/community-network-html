/**
 * Enhanced Modal Form Component
 * Complete modal system for Add/Edit person functionality
 */

// Simple notification function for modal forms
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

export class NeuFormModal {
    constructor(options = {}) {
        this.title = options.title || 'Form';
        this.width = options.width || '800px';
        this.onSubmit = options.onSubmit || (() => {});
        this.onClose = options.onClose || (() => {});
        this.fields = options.fields || [];
        this.data = options.data || {};
        this.modal = null;
        this.form = null;
        this.isVisible = false;
        
        // Store selected avatar file for upload
        this.selectedAvatarFile = null;
        
        this.bindMethods();
    }
    
    bindMethods() {
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleOverlayClick = this.handleOverlayClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    create() {
        // Remove existing modal if present
        this.destroy();
        
        // Create modal HTML
        this.modal = document.createElement('div');
        this.modal.className = 'neu-modal-overlay';
        this.modal.innerHTML = this.generateModalHTML();
        
        // Append to body
        document.body.appendChild(this.modal);
        
        // Get form reference
        this.form = this.modal.querySelector('.neu-form');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize field interactions
        this.initializeFields();
        
        return this.modal;
    }
    
    generateModalHTML() {
        return `
            <div class="neu-modal-backdrop" data-backdrop>
                <div class="neu-modal-container" style="max-width: ${this.width}">
                    <div class="neu-modal-header">
                        <h2 class="neu-modal-title">${this.title}</h2>
                        <button type="button" class="neu-modal-close" data-close>
                            <span>&times;</span>
                        </button>
                    </div>
                    
                    <div class="neu-modal-body">
                        <form class="neu-form" data-form>
                            ${this.generateFieldsHTML()}
                            
                            <div class="neu-form-actions">
                                <button type="button" class="neu-btn neu-btn-secondary" data-cancel>
                                    Cancel
                                </button>
                                <button type="submit" class="neu-btn neu-btn-primary" data-submit>
                                    <span class="neu-btn-text">Save</span>
                                    <span class="neu-btn-loading">
                                        <div class="neu-spinner"></div>
                                        Saving...
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateFieldsHTML() {
        let sectionsMap = {};
        
        // Group fields by section
        this.fields.forEach(field => {
            const section = field.section || 'default';
            if (!sectionsMap[section]) {
                sectionsMap[section] = [];
            }
            sectionsMap[section].push(field);
        });
        
        let html = '';
        
        // Generate sections
        Object.entries(sectionsMap).forEach(([sectionName, sectionFields]) => {
            if (sectionName !== 'default') {
                html += `
                    <div class="neu-form-section">
                        <h3 class="neu-form-section-title">${this.formatSectionTitle(sectionName)}</h3>
                        ${this.generateSectionFieldsHTML(sectionFields)}
                    </div>
                `;
            } else {
                html += this.generateSectionFieldsHTML(sectionFields);
            }
        });
        
        return html;
    }
    
    generateSectionFieldsHTML(fields) {
        let html = '';
        let currentRow = [];
        
        fields.forEach((field, index) => {
            if (field.type === 'avatar') {
                // Avatar field takes full width
                if (currentRow.length > 0) {
                    html += this.generateRowHTML(currentRow);
                    currentRow = [];
                }
                html += this.generateAvatarFieldHTML(field);
                return;
            }
            
            currentRow.push(field);
            
            // Check if we should close the row
            if (currentRow.length === 2 || 
                index === fields.length - 1 || 
                field.fullWidth ||
                (fields[index + 1] && fields[index + 1].fullWidth)) {
                html += this.generateRowHTML(currentRow);
                currentRow = [];
            }
        });
        
        return html;
    }
    
    generateRowHTML(fields) {
        const rowClass = fields.length === 1 ? 'neu-form-row single' : 'neu-form-row';
        return `
            <div class="${rowClass}">
                ${fields.map(field => this.generateFieldHTML(field)).join('')}
            </div>
        `;
    }
    
    generateFieldHTML(field) {
        const value = this.data[field.name] || field.defaultValue || '';
        const required = field.required ? 'required' : '';
        const labelClass = field.required ? 'neu-label required' : 'neu-label';
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                return `
                    <div class="neu-input-group">
                        <label class="${labelClass}" for="${field.name}">${field.label}</label>
                        <div class="neu-input-icon" data-icon="${field.icon || ''}">
                            <input 
                                type="${field.type}" 
                                id="${field.name}" 
                                name="${field.name}" 
                                class="neu-input" 
                                placeholder="${field.placeholder || ''}"
                                value="${value}"
                                ${required}
                                ${field.pattern ? `pattern="${field.pattern}"` : ''}
                            >
                        </div>
                        <div class="neu-input-message"></div>
                    </div>
                `;
                
            case 'textarea':
                return `
                    <div class="neu-input-group">
                        <label class="${labelClass}" for="${field.name}">${field.label}</label>
                        <textarea 
                            id="${field.name}" 
                            name="${field.name}" 
                            class="neu-textarea" 
                            placeholder="${field.placeholder || ''}"
                            ${required}
                            rows="${field.rows || 4}"
                        >${value}</textarea>
                        <div class="neu-input-message"></div>
                    </div>
                `;
                
            case 'select':
                return `
                    <div class="neu-input-group">
                        <label class="${labelClass}" for="${field.name}">${field.label}</label>
                        <div class="neu-select-wrapper">
                            <select id="${field.name}" name="${field.name}" class="neu-select" ${required}>
                                ${field.options.map(option => 
                                    `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                                        ${option.label}
                                    </option>`
                                ).join('')}
                            </select>
                            <span class="neu-select-arrow">▼</span>
                        </div>
                        <div class="neu-input-message"></div>
                    </div>
                `;
                
            case 'radio':
                return `
                    <div class="neu-input-group">
                        <label class="${labelClass}">${field.label}</label>
                        <div class="neu-radio-group">
                            ${field.options.map(option => `
                                <div class="neu-radio-item">
                                    <div class="neu-radio-wrapper">
                                        <input 
                                            type="radio" 
                                            id="${field.name}_${option.value}" 
                                            name="${field.name}" 
                                            value="${option.value}"
                                            class="neu-radio"
                                            ${option.value === value ? 'checked' : ''}
                                            ${required}
                                        >
                                        <div class="neu-radio-custom"></div>
                                    </div>
                                    <label class="neu-radio-label" for="${field.name}_${option.value}">
                                        ${option.label}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                        <div class="neu-input-message"></div>
                    </div>
                `;
                
            case 'checkbox':
                return `
                    <div class="neu-input-group">
                        <div class="neu-checkbox-group">
                            <div class="neu-checkbox-wrapper">
                                <input 
                                    type="checkbox" 
                                    id="${field.name}" 
                                    name="${field.name}" 
                                    class="neu-checkbox"
                                    value="1"
                                    ${value ? 'checked' : ''}
                                >
                                <div class="neu-checkbox-custom"></div>
                            </div>
                            <label class="neu-checkbox-label" for="${field.name}">${field.label}</label>
                        </div>
                        <div class="neu-input-message"></div>
                    </div>
                `;
                
            default:
                return '';
        }
    }
    
    generateAvatarFieldHTML(field) {
        const currentImage = this.data[field.name] || '';
        return `
            <div class="neu-avatar-section">
                <div class="neu-avatar-header">
                    <h3 class="neu-avatar-title">${field.label}</h3>
                    <p class="neu-avatar-subtitle">Upload a profile picture</p>
                </div>
                
                <div class="neu-avatar-preview ${currentImage ? 'has-image' : ''}" data-avatar-preview>
                    ${currentImage ? 
                        `<img src="${currentImage}" alt="Avatar" data-avatar-image>` : 
                        '<div class="neu-avatar-placeholder">👤</div>'
                    }
                </div>
                
                <div class="neu-avatar-controls">
                    <button type="button" class="neu-avatar-upload-btn" data-avatar-upload>
                        <input type="file" class="neu-avatar-upload-input" accept="image/*" data-avatar-input>
                        📷 Choose Photo
                    </button>
                    
                    ${currentImage ? '<button type="button" class="neu-avatar-remove-btn" data-avatar-remove>Remove</button>' : ''}
                </div>
                
                <div class="neu-avatar-dropzone" data-avatar-dropzone>
                    <div class="neu-avatar-dropzone-text">Or drag and drop an image here</div>
                    <div class="neu-avatar-dropzone-hint">Supported formats: JPG, PNG, GIF (max 5MB)</div>
                </div>
                
                <div class="neu-avatar-progress" data-avatar-progress>
                    <div class="neu-progress-bar">
                        <div class="neu-progress-fill" data-progress-fill style="width: 0%"></div>
                    </div>
                    <div class="neu-progress-text" data-progress-text">Uploading...</div>
                </div>
                
                <input type="hidden" name="${field.name}" value="${currentImage}" data-avatar-value>
            </div>
        `;
    }
    
    formatSectionTitle(sectionName) {
        const sectionConfig = {
            'avatar': '📸 Profile Picture',
            'basic-info': '👤 Basic Information', 
            'contact-info': '📞 Contact Details',
            'professional-info': '💼 Professional Information',
            'family-relations': '👨‍👩‍👧‍👦 Family Relationships'
        };
        
        return sectionConfig[sectionName] || sectionName.split(/[-_]/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    setupEventListeners() {
        // Close button
        this.modal.querySelectorAll('[data-close], [data-cancel]').forEach(btn => {
            btn.addEventListener('click', this.hide);
        });
        
        // Backdrop click
        this.modal.querySelector('[data-backdrop]').addEventListener('click', this.handleOverlayClick);
        
        // Form submit
        this.form.addEventListener('submit', this.handleSubmit);
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Setup radio button interactions
        this.setupRadioButtons();
        
        // Setup avatar upload if present
        this.setupAvatarUpload();
    }
    
    initializeFields() {
        // Setup input focus effects
        this.modal.querySelectorAll('.neu-input, .neu-textarea, .neu-select').forEach(input => {
            input.addEventListener('focus', (e) => {
                const label = e.target.closest('.neu-input-group').querySelector('.neu-label');
                const iconWrapper = e.target.closest('.neu-input-icon');
                
                if (label) label.classList.add('focused');
                if (iconWrapper) iconWrapper.classList.add('focused');
            });
            
            input.addEventListener('blur', (e) => {
                const label = e.target.closest('.neu-input-group').querySelector('.neu-label');
                const iconWrapper = e.target.closest('.neu-input-icon');
                
                if (label) label.classList.remove('focused');
                if (iconWrapper) iconWrapper.classList.remove('focused');
            });
        });
        
        // Setup real-time validation
        this.setupValidation();
    }
    
    setupValidation() {
        this.modal.querySelectorAll('.neu-input, .neu-textarea, .neu-select').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => {
                // Clear error state on input
                if (e.target.classList.contains('error')) {
                    this.clearFieldValidation(e.target);
                }
            });
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const required = field.hasAttribute('required');
        const type = field.type;
        const pattern = field.getAttribute('pattern');
        
        let isValid = true;
        let message = '';
        
        // Required validation
        if (required && !value) {
            isValid = false;
            message = 'This field is required';
        }
        
        // Type validation
        if (value && type === 'email' && !this.isValidEmail(value)) {
            isValid = false;
            message = 'Please enter a valid email address';
        }
        
        if (value && type === 'tel' && !this.isValidPhone(value)) {
            isValid = false;
            message = 'Please enter a valid phone number';
        }
        
        if (value && type === 'url' && !this.isValidUrl(value)) {
            isValid = false;
            message = 'Please enter a valid URL';
        }
        
        // Pattern validation
        if (value && pattern && !new RegExp(pattern).test(value)) {
            isValid = false;
            message = 'Please enter a valid format';
        }
        
        this.setFieldValidation(field, isValid, message);
        return isValid;
    }
    
    setFieldValidation(field, isValid, message) {
        const messageEl = field.closest('.neu-input-group').querySelector('.neu-input-message');
        
        // Clear previous states
        field.classList.remove('error', 'success');
        messageEl.classList.remove('visible', 'error', 'success');
        
        if (!isValid) {
            field.classList.add('error');
            messageEl.classList.add('visible', 'error');
            messageEl.textContent = message;
        } else if (field.value.trim()) {
            field.classList.add('success');
            messageEl.classList.add('visible', 'success');
            messageEl.textContent = '✓';
        }
    }
    
    clearFieldValidation(field) {
        const messageEl = field.closest('.neu-input-group').querySelector('.neu-input-message');
        field.classList.remove('error', 'success');
        messageEl.classList.remove('visible', 'error', 'success');
        messageEl.textContent = '';
    }
    
    setupAvatarUpload() {
        const avatarSection = this.modal.querySelector('.neu-avatar-section');
        if (!avatarSection) return;
        
        const uploadBtn = avatarSection.querySelector('[data-avatar-upload]');
        const uploadInput = avatarSection.querySelector('[data-avatar-input]');
        const removeBtn = avatarSection.querySelector('[data-avatar-remove]');
        const dropzone = avatarSection.querySelector('[data-avatar-dropzone]');
        const preview = avatarSection.querySelector('[data-avatar-preview]');
        
        // File input change
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleAvatarFile(file);
        });
        
        // Remove button
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeAvatar());
        }
        
        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleAvatarFile(file);
            }
        });
        
        // Click to upload
        dropzone.addEventListener('click', () => uploadInput.click());
    }
    
    setupRadioButtons() {
        // Handle radio button clicks on the entire radio item
        this.modal.querySelectorAll('.neu-radio-item').forEach(radioItem => {
            radioItem.addEventListener('click', (e) => {
                // If the click was directly on the radio input or label, let it handle naturally
                if (e.target.type === 'radio' || e.target.tagName === 'LABEL') {
                    return;
                }
                
                // Otherwise, find the radio input and trigger it
                const radioInput = radioItem.querySelector('input[type="radio"]');
                if (radioInput && !radioInput.checked) {
                    radioInput.checked = true;
                    
                    // Trigger change event for any listeners
                    radioInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
        
        // Add change event handlers for validation
        this.modal.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Clear any validation errors when radio is selected
                const radioGroup = e.target.closest('.neu-input-group');
                if (radioGroup) {
                    this.clearFieldValidation(radioGroup);
                }
            });
        });
    }
    
    async handleAvatarFile(file) {
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showNotification('File size must be less than 5MB', 'error');
                return;
            }
            
            // Store the file for later upload
            this.selectedAvatarFile = file;
            
            // Show progress
            this.showAvatarProgress(true);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.updateAvatarPreview(e.target.result);
                this.showAvatarProgress(false);
            };
            reader.readAsDataURL(file);
            
            showNotification('Avatar selected successfully', 'success');
            
        } catch (error) {
            console.error('Avatar file handling error:', error);
            showNotification('Failed to process avatar file', 'error');
            this.showAvatarProgress(false);
        }
    }
    
    updateAvatarPreview(imageSrc) {
        const preview = this.modal.querySelector('[data-avatar-preview]');
        const valueInput = this.modal.querySelector('[data-avatar-value]');
        
        preview.innerHTML = `<img src="${imageSrc}" alt="Avatar" data-avatar-image>`;
        preview.classList.add('has-image');
        
        if (valueInput) {
            valueInput.value = imageSrc;
        }
        
        // Add remove button if not present
        const controls = this.modal.querySelector('.neu-avatar-controls');
        if (!controls.querySelector('[data-avatar-remove]')) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'neu-avatar-remove-btn';
            removeBtn.setAttribute('data-avatar-remove', '');
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => this.removeAvatar());
            controls.appendChild(removeBtn);
        }
    }
    
    removeAvatar() {
        const preview = this.modal.querySelector('[data-avatar-preview]');
        const valueInput = this.modal.querySelector('[data-avatar-value]');
        const removeBtn = this.modal.querySelector('[data-avatar-remove]');
        const uploadInput = this.modal.querySelector('[data-avatar-input]');
        
        // Clear the selected file
        this.selectedAvatarFile = null;
        
        // Reset upload input
        if (uploadInput) {
            uploadInput.value = '';
        }
        
        preview.innerHTML = '<div class="neu-avatar-placeholder">👤</div>';
        preview.classList.remove('has-image');
        
        if (valueInput) {
            valueInput.value = '';
        }
        
        if (removeBtn) {
            removeBtn.remove();
        }
        
        showNotification('Avatar removed', 'info');
    }
    
    showAvatarProgress(show) {
        const progress = this.modal.querySelector('[data-avatar-progress]');
        if (progress) {
            progress.classList.toggle('visible', show);
        }
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPhone(phone) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
    
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const fields = this.modal.querySelectorAll('.neu-input, .neu-textarea, .neu-select');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            showNotification('Please fix the errors before submitting', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = this.modal.querySelector('[data-submit]');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Collect form data
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        // Handle checkboxes
        this.modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (!formData.has(checkbox.name)) {
                data[checkbox.name] = false;
            } else {
                data[checkbox.name] = true;
            }
        });
        
        // Include selected avatar file if present
        if (this.selectedAvatarFile) {
            data.avatarFile = this.selectedAvatarFile;
            data.hasAvatarFile = true;
            console.log('📁 Modal: Avatar file included in submission:', {
                fileName: this.selectedAvatarFile.name,
                fileSize: this.selectedAvatarFile.size,
                fileType: this.selectedAvatarFile.type
            });
        } else {
            data.hasAvatarFile = false;
            console.log('📁 Modal: No avatar file selected');
        }
        
        // Call submit handler
        Promise.resolve(this.onSubmit(data))
            .then(() => {
                this.hide();
            })
            .catch((error) => {
                console.error('Form submission error:', error);
                showNotification('Failed to save data', 'error');
            })
            .finally(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            });
    }
    
    handleOverlayClick(e) {
        if (e.target === e.currentTarget) {
            this.hide();
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isVisible) {
            this.hide();
        }
    }
    
    show(data = {}) {
        this.data = { ...this.data, ...data };
        
        if (!this.modal) {
            this.create();
        }
        
        // Update form with new data
        this.updateFormData(this.data);
        
        // Show modal
        this.modal.classList.add('visible');
        this.isVisible = true;
        
        // Focus first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('.neu-input, .neu-textarea, .neu-select');
            if (firstInput) firstInput.focus();
        }, 300);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return this.modal;
    }
    
    hide() {
        if (!this.modal) return;
        
        this.modal.classList.remove('visible');
        this.isVisible = false;
        
        // Clear selected avatar file when hiding
        this.selectedAvatarFile = null;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Call close handler
        setTimeout(() => {
            this.onClose();
        }, 300);
        
        return this.modal;
    }
    
    updateFormData(data) {
        if (!this.form) return;
        
        Object.entries(data).forEach(([key, value]) => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (!field) return;
            
            if (field.type === 'checkbox') {
                field.checked = !!value;
            } else if (field.type === 'radio') {
                const radio = this.form.querySelector(`[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else {
                field.value = value;
            }
            
            // Special handling for avatar field
            if (key === 'avatar' && value) {
                this.updateAvatarPreview(value);
            }
        });
    }
    
    destroy() {
        if (this.modal) {
            document.removeEventListener('keydown', this.handleKeyDown);
            this.modal.remove();
            this.modal = null;
            this.form = null;
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        this.isVisible = false;
    }
    
    getData() {
        if (!this.form) return {};
        
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        // Handle checkboxes
        this.form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (!formData.has(checkbox.name)) {
                data[checkbox.name] = false;
            } else {
                data[checkbox.name] = true;
            }
        });
        
        return data;
    }
}
