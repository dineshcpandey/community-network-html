// Chart functionality

import { mergeNetworkData, cleanInvalidReferences } from './dataUtils.js';
import { chartData as appChartData, updateChartDataStore } from './app.js';

// Global chart instance
let f3Chart = null;
let f3Card = null;
let f3EditTree = null;
/**
 * Initialize the family chart
 * @param {Array} data - Chart data
 * @param {Object} options - Chart options
 * @returns {Promise<void>}
 */
export async function initializeChart(data, options = {}) {
    const { onNodeSelect } = options;

    // Ensure f3 is available
    if (typeof window.f3 === 'undefined') {
        console.error('f3 library not found. Make sure family-chart.js is loaded.');
        throw new Error('f3 library not found');
    }

    console.log('Initializing chart with data:', data.length, 'items');

    try {
        // Get chart container
        const chartContainer = document.getElementById('FamilyChart');
        if (!chartContainer) {
            throw new Error('Chart container not found');
        }

        // Clear any existing chart
        chartContainer.innerHTML = '';

        // If no data provided, display empty state message
        if (!data || data.length === 0) {
            const emptyStateEl = document.createElement('div');
            emptyStateEl.className = 'empty-chart-message';
            emptyStateEl.innerHTML = `
                <div class="empty-chart-content">
                    <h2>Family Tree is Empty</h2>
                    <p>Use the search function to find and add people to your family tree.</p>
                    <div class="empty-chart-icon">👪</div>
                </div>
            `;

            chartContainer.appendChild(emptyStateEl);
            return null; // Return early, no chart to create
        }

        // Create new chart instance
        f3Chart = window.f3.createChart('#FamilyChart', data)
            .setTransitionTime(1000)
            .setCardXSpacing(250)
            .setCardYSpacing(150)
            .setOrientationVertical()
            .setSingleParentEmptyCard(false);

        // Set up card
        f3Card = f3Chart.setCard(window.f3.CardHtml)
            .setCardDisplay([["first name", "last name"], ["birthday"]])
            .setCardDim({})
            .setMiniTree(true)
            .setStyle('imageRect')
            .setOnHoverPathToMain();

        // Set up edit tree
        f3EditTree = f3Chart.editTree()
            .fixed(true)
            .setFields(["first name", "last name", "birthday", "avatar"])
            .setEditFirst(true);

        f3EditTree.setEdit();

        // Set up card click handler
        f3Card.setOnCardClick((e, d) => {
            console.log('Card clicked - ID:', d.data.id);

            // Prevent default click behavior if adding relative
            if (f3EditTree.isAddingRelative()) return;

            // Notify caller of node selection
            if (onNodeSelect) {
                onNodeSelect(d.data);
            }

            // Default behavior (change main node)
            f3Card.onCardClickDefault(e, d);
        });

        // Update tree initially
        f3Chart.updateTree({ initial: true });

        console.log('Chart initialization complete');
        return f3Chart;
    } catch (error) {
        console.error('Error initializing chart:', error);
        throw error;
    }
}

/**
 * Update chart data with new network data
 * @param {Array} networkData - New network data to merge
 * @returns {Promise<void>}
 */
export async function updateChartData(networkData) {
    if (!f3Chart) {
        console.error('Chart not initialized');
        return;
    }

    try {
        console.log("Chart.js: Updating chart data with new network data:", networkData.length, "items");

        // Get the latest chart data from the app
        const currentChartData = appChartData.slice();

        // Merge network data with existing data
        const mergedData = mergeNetworkData(currentChartData, networkData);

        // Update the central store in app.js
        updateChartDataStore(mergedData);

        // Update chart
        f3Chart.updateData(mergedData);
        f3Chart.updateTree();

        console.log('Chart data updated successfully');
    } catch (error) {
        console.error('Error updating chart data:', error);
        throw error;
    }
}

/**
 * Open edit tree for a specific node
 * @param {string} nodeId - The ID of the node to edit
 */
export function openEditTree(nodeId) {
    if (!f3Chart || !f3EditTree) {
        console.error('Chart or EditTree not initialized');
        return;
    }

    try {
        // Find node data from the app's chart data store
        const nodeDatum = appChartData.find(d => d.id === nodeId);
        if (!nodeDatum) {
            console.error('Node not found:', nodeId);
            return;
        }

        // Open edit form for this node
        f3EditTree.open({ data: nodeDatum });
        console.log('Edit tree opened for node:', nodeId);
    } catch (error) {
        console.error('Error opening edit tree:', error);
    }
}

/**
 * Get the chart instance
 * @returns {Object} The chart instance
 */
export function getChartInstance() {
    return {
        chart: f3Chart,
        card: f3Card,
        editTree: f3EditTree,
        onEnterPathToMain: f3Card?.onEnterPathToMain.bind(f3Card),
        onLeavePathToMain: f3Card?.onLeavePathToMain.bind(f3Card)
    };
}

/**
 * Reset the chart
 */
export function resetChart() {
    f3Chart = null;
    f3Card = null;
    f3EditTree = null;
}   