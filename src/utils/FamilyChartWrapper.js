/**
 * FamilyChartWrapper.js
 * 
 * A wrapper for the family-chart.js library to make it compatible with React.
 * This module properly imports and initializes the library, allowing components
 * to use it without relying on global variables.
 */

// First, check if we can get the library from the window object
let f3Instance = null;

// Function to initialize the library
function initializeF3() {
    if (window.f3) {
        f3Instance = window.f3;
        return window.f3;
    }

    // If the library is not found in window, create a warning
    console.warn('Family Chart library not found in global scope. Some functionality may be limited.');

    // Return a minimal placeholder to prevent errors
    return {
        createChart: function () {
            console.error('Family Chart library (f3) not properly loaded.');
            return {
                setCardXSpacing: function () { return this; },
                setCardYSpacing: function () { return this; },
                setCardDisplay: function () { return this; },
                setOrientationVertical: function () { return this; },
                setTransitionTime: function () { return this; },
                setCard: function () {
                    return {
                        setStyle: function () { return this; },
                        setMiniTree: function () { return this; },
                        setCardDim: function () { return this; },
                        setOnCardClick: function () { return this; },
                        setOnHoverPathToMain: function () { return this; }
                    };
                },
                updateTree: function () { return this; }
            };
        },
        CardHtml: {}
    };
}

// Initialize immediately
initializeF3();

// Function to get the instance
export function getF3() {
    if (!f3Instance) {
        f3Instance = initializeF3();
    }
    return f3Instance;
}

// Export the createChart function directly
export function createFamilyChart(container, data) {
    const f3 = getF3();
    return f3.createChart(container, data);
}

// Export CardHtml for styling
export function getCardHtml() {
    const f3 = getF3();
    return f3.CardHtml;
}

// Create a named object for the default export
const FamilyChartAPI = {
    getF3,
    createFamilyChart,
    getCardHtml
};

export default FamilyChartAPI;