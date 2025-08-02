// Enhanced Image Cropper for Edit Form Integration

import { makeAuthenticatedRequest } from './api-utils.js';

/**
 * Image Cropper Component with avatar functionality
 */
export class ImageCropper {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            aspectRatio: 1,
            cropSize: { width: 20, height: 20 }, // Small avatar size like facebookImage1
            apiEndpoint: 'http://localhost:5050/api/images/upload',
            personId: options.personId || null, // Store personId for upload
            onUploadSuccess: options.onUploadSuccess || (() => {}),
            onUploadError: options.onUploadError || (() => {}),
            onCancel: options.onCancel || (() => {}),
            ...options
        };

        this.state = {
            file: null,
            cropper: null,
            isUploading: false
        };

        this.init();
    }

    /**
     * Initialize the cropper interface
     */
    init() {
        if (!this.container) {
            console.error('ImageCropper: Container not found');
            return;
        }

        this.render();
        this.attachEventListeners();
    }

    /**
     * Render the cropper interface
     */
    render() {
        this.container.innerHTML = `
            <div class="image-cropper-component">
                <div class="cropper-header">
                    <h3>Crop Profile Picture</h3>
                    <p>Adjust the crop area to create your avatar</p>
                </div>
                
                <div class="cropper-content">
                    <div class="cropper-input-section">
                        <label for="cropper-file-input" class="file-input-label">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            Choose Image
                        </label>
                        <input type="file" id="cropper-file-input" accept="image/*" style="display: none;">
                    </div>

                    <div class="cropper-preview-section" style="display: none;">
                        <div class="cropper-image-container">
                            <img id="cropper-image" src="" alt="Crop preview" style="max-width: 100%;">
                        </div>
                        
                        <div class="cropper-controls">
                            <button id="crop-submit-btn" class="btn btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Upload Cropped Image
                            </button>
                            <button id="crop-cancel-btn" class="btn btn-secondary">Cancel</button>
                        </div>
                    </div>

                    <div class="cropper-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <p>Uploading cropped image...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const fileInput = this.container.querySelector('#cropper-file-input');
        const submitBtn = this.container.querySelector('#crop-submit-btn');
        const cancelBtn = this.container.querySelector('#crop-cancel-btn');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                }
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.uploadCroppedImage(this.options.personId);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancel();
            });
        }
    }

    /**
     * Handle file selection and initialize cropper
     */
    handleFileSelect(file) {
        if (!this.validateFile(file)) {
            return;
        }

        this.state.file = file;
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const image = this.container.querySelector('#cropper-image');
            const previewSection = this.container.querySelector('.cropper-preview-section');
            
            if (image && previewSection) {
                image.src = event.target.result;
                previewSection.style.display = 'block';

                // Destroy existing cropper
                if (this.state.cropper) {
                    this.state.cropper.destroy();
                }

                // Initialize new cropper (ensure Cropper.js is loaded)
                if (window.Cropper) {
                    this.state.cropper = new window.Cropper(image, {
                        aspectRatio: this.options.aspectRatio,
                        cropBoxResizable: false,
                        ready: () => {
                            // Set initial crop box size
                            this.state.cropper.setCropBoxData({ 
                                width: 200, 
                                height: 200 
                            });
                        }
                    });
                } else {
                    console.error('Cropper.js not loaded');
                    alert('Image cropping functionality not available');
                }
            }
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Validate selected file
     */
    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            alert(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`);
            return false;
        }

        if (file.size > maxSize) {
            alert('File size too large. Maximum size is 10MB.');
            return false;
        }

        return true;
    }

    /**
     * Upload cropped image
     */
    async uploadCroppedImage(personId = null) {
        if (!this.state.cropper) {
            alert("Please select an image first.");
            return null;
        }

        this.showProgress();
        this.state.isUploading = true;

        try {
            const canvas = this.state.cropper.getCroppedCanvas(this.options.cropSize);
            
            return new Promise((resolve, reject) => {
                canvas.toBlob(async (blob) => {
                    try {
                        const formData = new FormData();
                        formData.append('croppedImage', blob);
                        
                        if (personId) {
                            formData.append('personId', personId);
                        }

                        const response = await makeAuthenticatedRequest(this.options.apiEndpoint, {
                            method: 'POST',
                            body: formData
                        });

                        const result = await response.json();
                        
                        if (result.success || response.ok) {
                            this.hideProgress();
                            this.state.isUploading = false;
                            
                            // Enhanced success callback with avatar update
                            if (result.avatarUrl || result.imageUrl || result.url) {
                                const avatarUrl = result.avatarUrl || result.imageUrl || result.url;
                                this.updatePersonAvatar(personId, avatarUrl);
                            }
                            
                            this.options.onUploadSuccess(result);
                            resolve(result);
                        } else {
                            throw new Error(result.message || 'Upload failed');
                        }
                    } catch (error) {
                        this.hideProgress();
                        this.state.isUploading = false;
                        this.options.onUploadError(error);
                        reject(error);
                    }
                }, 'image/jpeg');
            });

        } catch (error) {
            this.hideProgress();
            this.state.isUploading = false;
            this.options.onUploadError(error);
            throw error;
        }
    }

    /**
     * Update person's avatar in chart data and UI
     */
    updatePersonAvatar(personId, avatarUrl) {
        if (!personId || !avatarUrl) return;

        // Import chart functions dynamically to avoid circular imports
        import('./chart.js').then(({ updateChartData, getChartInstance }) => {
            import('./dataUtils.js').then(({ chartData, updateChartDataStore }) => {
                // Update the person's avatar in chartData
                const personIndex = chartData.findIndex(person => person.id === personId);
                if (personIndex !== -1) {
                    chartData[personIndex].data.avatar = avatarUrl;
                    
                    // Update the chart data store
                    updateChartDataStore([...chartData]);
                    
                    // Force chart refresh
                    const chartInstance = getChartInstance();
                    if (chartInstance) {
                        // Force re-render with updated data
                        updateChartData(chartData);
                        
                        // If that doesn't work, try forcing a complete refresh
                        setTimeout(() => {
                            chartInstance.update(chartData);
                        }, 100);
                    }
                    
                    console.log(`Avatar updated for person ${personId}:`, avatarUrl);
                } else {
                    console.warn(`Person ${personId} not found in chart data`);
                }
            }).catch(error => {
                console.error('Error importing dataUtils:', error);
            });
        }).catch(error => {
            console.error('Error importing chart:', error);
        });
    }

    /**
     * Show upload progress
     */
    showProgress() {
        const progress = this.container.querySelector('.cropper-progress');
        const controls = this.container.querySelector('.cropper-controls');
        
        if (progress) progress.style.display = 'block';
        if (controls) controls.style.display = 'none';
    }

    /**
     * Hide upload progress
     */
    hideProgress() {
        const progress = this.container.querySelector('.cropper-progress');
        const controls = this.container.querySelector('.cropper-controls');
        
        if (progress) progress.style.display = 'none';
        if (controls) controls.style.display = 'flex';
    }

    /**
     * Cancel cropping
     */
    cancel() {
        if (this.state.cropper) {
            this.state.cropper.destroy();
            this.state.cropper = null;
        }

        this.state.file = null;
        const previewSection = this.container.querySelector('.cropper-preview-section');
        if (previewSection) {
            previewSection.style.display = 'none';
        }

        // Reset file input
        const fileInput = this.container.querySelector('#cropper-file-input');
        if (fileInput) {
            fileInput.value = '';
        }

        this.options.onCancel();
    }

    /**
     * Destroy the cropper instance
     */
    destroy() {
        if (this.state.cropper) {
            this.state.cropper.destroy();
        }
    }

    /**
     * Check if there's a pending crop ready for upload
     */
    hasPendingCrop() {
        return this.state.cropper !== null && this.state.file !== null;
    }

    /**
     * Get the current state
     */
    getState() {
        return { ...this.state };
    }
}
