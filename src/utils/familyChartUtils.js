import { loadFamilyChartDependencies } from './loadExternalScript';

/**
 * Ensure the family-chart library is loaded
 * @returns {Promise} - Resolves when f3 is available
 */
export const ensureFamilyChartLoaded = async () => {
    try {
        // Try loading dependencies
        await loadFamilyChartDependencies();

        // If f3 is still not available, throw an error
        if (!window.f3) {
            throw new Error('Family chart library failed to initialize');
        }

        return window.f3;
    } catch (error) {
        console.error('Error loading family chart dependencies:', error);
        throw error;
    }
};

/**
 * Convert network data format to family-chart format
 * @param {Array} networkData - Network data from API
 * @param {String} selectedId - ID of the selected person
 * @returns {Array} - Data formatted for family-chart
 */
export const convertNetworkDataToFamilyChart = (networkData, selectedId) => {
    if (!networkData || networkData.length === 0) return [];

    // Map network data to format expected by family-chart
    return networkData.map(person => {
        // Extract person's data
        const firstName = person.data['first name'] || '';
        const lastName = person.data['last name'] || '';
        const gender = person.data.gender || 'M';
        const avatar = person.data.avatar || '';
        const location = person.data.location || '';
        const work = person.data.work || '';
        const nativePlace = person.data.nativePlace || '';

        // Return formatted data
        return {
            id: person.id,
            data: {
                gender,
                'first name': firstName,
                'last name': lastName,
                avatar,
                location,
                work,
                nativePlace,
                main: person.id === selectedId
            },
            rels: {
                father: person.rels.father || null,
                mother: person.rels.mother || null,
                spouses: person.rels.spouses || [],
                children: person.rels.children || []
            }
        };
    });
};

/**
 * Create a card display function for family-chart
 * @returns {Function} - Card display function
 */
export const createCardDisplay = () => {
    return [
        // Display full name
        data => `${data['first name'] || ''} ${data['last name'] || ''}`.trim(),
        // Display location if available
        data => data.location ? `📍 ${data.location}` : '',
        // Display work if available
        data => data.work ? `💼 ${data.work}` : '',
        // Display native place if available
        data => data.nativePlace ? `🏠 ${data.nativePlace}` : ''
    ];
};

/**
 * Export the whole family tree as JSON
 * @param {Object} chart - f3 chart instance
 * @returns {String} - JSON string of the family tree data
 */
export const exportFamilyChartData = (chart) => {
    if (!chart) return null;

    try {
        const data = chart.getDataJson();
        return data;
    } catch (error) {
        console.error('Error exporting family chart data:', error);
        return null;
    }
};

/**
 * Get the correct aspect ratio for the chart
 * @param {HTMLElement} container - Container element
 * @returns {Object} - Width and height
 */
export const getChartDimensions = (container) => {
    if (!container) {
        return { width: 1000, height: 800 };
    }

    const rect = container.getBoundingClientRect();
    return {
        width: rect.width || 1000,
        height: rect.height || 800
    };
};

/**
 * Apply custom styling to the chart cards
 * @param {Object} cardSvg - f3 CardSvg instance
 */
export const applyCustomCardStyling = (cardSvg) => {
    // Set card dimensions
    cardSvg.setCardDim({
        w: 240,        // Card width
        h: 90,         // Card height
        text_x: 80,    // Text X position
        text_y: 20,    // Text Y position
        img_w: 65,     // Image width
        img_h: 65,     // Image height
        img_x: 8,      // Image X position
        img_y: 12      // Image Y position
    });

    // Enable mini-tree icon
    cardSvg.setMiniTree(true);

    // Enable link break buttons (collapse/expand)
    cardSvg.setLinkBreak(true);
};