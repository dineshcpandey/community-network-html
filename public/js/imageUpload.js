// public/js/imageUpload.js - Core Image Upload Component

/**
 * Image Upload Component for Add/Edit Person Forms
 * Features: File validation, preview, basic upload handling
 */

class ImageUpload {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
            apiEndpoint: '/api/images/upload',
            previewSize: 150, // pixels
            ...options
        };

        this.state = {
            file: null,
            previewUrl: null,
            isUploading: false,
            uploadedImageData: null,
            error: null
        };

        this.callbacks = {
            onFileSelect: options.onFileSelect || (() => { }),
            onUploadStart: options.onUploadStart || (() => { }),
            onUploadSuccess: options.onUploadSuccess || (() => { }),
            onUploadError: options.onUploadError || (() => { }),
            onRemove: options.onRemove || (() => { })
        };

        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        if (!this.container) {
            console.error('ImageUpload: Container not found');
            return;
        }

        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the upload interface
     */
    render() {
        this.container.innerHTML = `
            <div class="image-upload-component">
                <div class="upload-area ${this.state.file ? 'has-file' : ''}" id="upload-area">
                    <div class="upload-content">
                        <div class="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </div>
                        <div class="upload-text">
                            <p class="upload-main-text">Click to upload or drag and drop</p>
                            <p class="upload-sub-text">PNG, JPG, WebP up to 10MB</p>
                        </div>
                    </div>
                    <input type="file" id="file-input" accept="${this.options.allowedExtensions.join(',')}" hidden>
                </div>

                <div class="preview-section" style="display: ${this.state.file ? 'block' : 'none'}">
                    <div class="preview-container">
                        <div class="preview-image">
                            <img id="preview-img" src="${this.state.previewUrl || ''}" alt="Preview">
                            <div class="preview-overlay">
                                <button type="button" class="preview-action-btn" id="remove-btn" title="Remove image">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="preview-info">
                            <p class="file-name" id="file-name"></p>
                            <p class="file-size" id="file-size"></p>
                        </div>
                    </div>
                </div>

                <div class="upload-progress" style="display: none" id="upload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <p class="progress-text" id="progress-text">Uploading...</p>
                </div>

                <div class="upload-error" style="display: none" id="upload-error">
                    <div class="error-content">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span id="error-message"></span>
                    </div>
                </div>

                <div class="upload-actions" style="display: ${this.state.file && !this.state.isUploading ? 'block' : 'none'}">
                    <button type="button" class="upload-btn primary" id="upload-btn">
                        Upload Image
                    </button>
                    <button type="button" class="upload-btn secondary" id="cancel-btn">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const uploadArea = this.container.querySelector('#upload-area');
        const fileInput = this.container.querySelector('#file-input');
        const removeBtn = this.container.querySelector('#remove-btn');
        const uploadBtn = this.container.querySelector('#upload-btn');
        const cancelBtn = this.container.querySelector('#cancel-btn');

        // Click to upload
        uploadArea.addEventListener('click', () => {
            if (!this.state.isUploading) {
                fileInput.click();
            }
        });

        // File selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Remove image
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage();
            });
        }

        // Upload action
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                if (this.state.file) {
                    this.uploadImage();
                }
            });
        }

        // Cancel action
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.removeImage();
            });
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelect(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        this.clearError();
        this.state.file = file;

        // Generate preview
        this.generatePreview(file);

        // Update UI
        this.updateUI();

        // Callback
        this.callbacks.onFileSelect(file);
    }

    /**
     * Validate selected file
     */
    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type. Only ${this.options.allowedTypes.join(', ')} are allowed.`
            };
        }

        // Check file size
        if (file.size > this.options.maxSize) {
            const maxSizeMB = this.options.maxSize / (1024 * 1024);
            return {
                valid: false,
                error: `File size too large. Maximum size is ${maxSizeMB}MB.`
            };
        }

        return { valid: true };
    }

    /**
     * Generate image preview
     */
    generatePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.previewUrl = e.target.result;
            this.updatePreview();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Update preview display
     */
    updatePreview() {
        const previewImg = this.container.querySelector('#preview-img');
        const fileName = this.container.querySelector('#file-name');
        const fileSize = this.container.querySelector('#file-size');

        if (previewImg && this.state.previewUrl) {
            previewImg.src = this.state.previewUrl;
        }

        if (fileName && this.state.file) {
            fileName.textContent = this.state.file.name;
        }

        if (fileSize && this.state.file) {
            fileSize.textContent = this.formatFileSize(this.state.file.size);
        }
    }

    /**
     * Upload image to server
     */
    async uploadImage(personId = null) {
        if (!this.state.file) {
            this.showError('No file selected');
            return;
        }

        this.state.isUploading = true;
        this.callbacks.onUploadStart();
        this.showProgress();

        try {
            const formData = new FormData();
            formData.append('image', this.state.file);

            if (personId) {
                formData.append('personId', personId);
            }

            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.state.uploadedImageData = result.data;
                this.hideProgress();
                this.callbacks.onUploadSuccess(result.data);
                this.showSuccess('Image uploaded successfully!');
            } else {
                throw new Error(result.message || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.hideProgress();
            this.showError(`Upload failed: ${error.message}`);
            this.callbacks.onUploadError(error);
        } finally {
            this.state.isUploading = false;
            this.updateUI();
        }
    }

    /**
     * Remove selected image
     */
    removeImage() {
        this.state.file = null;
        this.state.previewUrl = null;
        this.state.uploadedImageData = null;
        this.clearError();

        // Reset file input
        const fileInput = this.container.querySelector('#file-input');
        if (fileInput) {
            fileInput.value = '';
        }

        this.updateUI();
        this.callbacks.onRemove();
    }

    /**
     * Update UI based on current state
     */
    updateUI() {
        const uploadArea = this.container.querySelector('#upload-area');
        const previewSection = this.container.querySelector('.preview-section');
        const uploadActions = this.container.querySelector('.upload-actions');

        if (uploadArea) {
            uploadArea.classList.toggle('has-file', !!this.state.file);
        }

        if (previewSection) {
            previewSection.style.display = this.state.file ? 'block' : 'none';
        }

        if (uploadActions) {
            uploadActions.style.display =
                this.state.file && !this.state.isUploading ? 'block' : 'none';
        }

        if (this.state.file) {
            this.updatePreview();
        }
    }

    /**
     * Show upload progress
     */
    showProgress() {
        const progressDiv = this.container.querySelector('#upload-progress');
        const uploadActions = this.container.querySelector('.upload-actions');

        if (progressDiv) {
            progressDiv.style.display = 'block';
        }
        if (uploadActions) {
            uploadActions.style.display = 'none';
        }
    }

    /**
     * Hide upload progress
     */
    hideProgress() {
        const progressDiv = this.container.querySelector('#upload-progress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = this.container.querySelector('#upload-error');
        const errorMessage = this.container.querySelector('#error-message');

        if (errorDiv && errorMessage) {
            errorMessage.textContent = message;
            errorDiv.style.display = 'block';
        }

        this.state.error = message;
    }

    /**
     * Clear error message
     */
    clearError() {
        const errorDiv = this.container.querySelector('#upload-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        this.state.error = null;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // You can implement a success notification here
        console.log('Success:', message);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get uploaded image data
     */
    getUploadedImageData() {
        return this.state.uploadedImageData;
    }

    /**
     * Check if image is uploaded
     */
    hasUploadedImage() {
        return !!this.state.uploadedImageData;
    }

    /**
     * Reset component
     */
    reset() {
        this.removeImage();
        this.clearError();
        this.hideProgress();
    }
}

// Export for use in other modules
export { ImageUpload };