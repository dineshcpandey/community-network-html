/**
 * Dynamically load an external JavaScript file
 * @param {string} url - URL of the script to load
 * @returns {Promise} Promise that resolves when the script is loaded
 */
export const loadExternalScript = (url) => {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
            return resolve();
        }

        // Create script element
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.async = true;

        // Set up event handlers
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));

        // Add to document
        document.head.appendChild(script);
    });
};

/**
 * Load D3.js and Family Chart libraries
 * @returns {Promise} Promise that resolves when libraries are loaded
 */
export const loadFamilyChartDependencies = async () => {
    // If both libraries are already available, return immediately
    if (window.d3 && window.f3) {
        return Promise.resolve();
    }

    try {
        // Load D3.js first if needed
        if (!window.d3) {
            await loadExternalScript('https://d3js.org/d3.v5.min.js');
        }

        // Then load family-chart
        if (!window.f3) {
            await loadExternalScript('/family-chart.min.js');
        }

        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
};