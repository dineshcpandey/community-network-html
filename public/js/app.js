// Main app entry point
import { initializeChart, updateChartData, getChartInstance } from './chart.js';
import { setupSearch } from './search.js';
import { setupEditForm } from './editForm.js';
import { fetchInitialData, fetchNetworkData } from './api.js';
import { setupControlPanel } from './controlPanel.js';
import { setupEventListeners } from './eventHandlers.js';

// Global state
let chartData = [];
let selectedNode = null;
let highlightModeEnabled = false;
let isEditFormVisible = false;

// Elements
const loadingIndicator = document.getElementById('loading-indicator');
const dataSourceIndicator = document.getElementById('data-source-indicator');

// Initialize the application
async function initApp() {
    // Show loading indicator
    showLoading(true);

    try {
        // Load initial data
        chartData = await fetchInitialData();

        // Initialize chart with data
        await initializeChart(chartData, {
            onNodeSelect: handleNodeSelect
        });

        // Set up search functionality
        setupSearch({
            onPersonSelect: handleAddPersonFromSearch
        });

        // Set up edit form
        setupEditForm({
            onClose: toggleEditForm
        });

        // Set up control panel
        setupControlPanel({
            onEditClick: toggleEditForm,
            onHighlightToggle: toggleHighlightMode,
            onResetClick: resetChart,
            onDownloadClick: downloadChartData
        });

        // Set up global event handlers
        setupEventListeners();

        // Update indicators
        showLoading(false);
        updateDataSourceIndicator('Initial data loaded');

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showLoading(false);
        updateDataSourceIndicator('Error loading data', true);
    }
}

// Handle node selection
async function handleNodeSelect(node) {
    selectedNode = node;


    // Update selected node info in UI
    const selectedInfo = document.getElementById('selected-info');
    const selectedNodeId = document.getElementById('selected-node-id');

    if (selectedInfo && selectedNodeId) {
        selectedInfo.style.display = 'block';
        selectedNodeId.textContent = node.id;
    }

    // Enable highlight button
    const highlightBtn = document.getElementById('highlight-button');
    if (highlightBtn) {
        highlightBtn.disabled = false;
    }

    // Apply highlighting if mode is enabled
    if (highlightModeEnabled) {
        applyHighlighting(node.id);
    }

    // Fetch network data for this node
    showLoading(true);
    try {
        const networkData = await fetchNetworkData(node.id);

        // Update chart data with network data
        const chart = getChartInstance();
        if (chart) {
            await updateChartData(networkData);
            //Changed temprarily didn't work
            console.log("Trying to set the main id to ", node.id)
            //updateMainId(node.id);

        }

        updateDataSourceIndicator(`Network data loaded for ID: ${node.id}`);
    } catch (error) {
        console.error('Error fetching network data:', error);
        updateDataSourceIndicator(`Error loading network for ID: ${node.id}`, true);
    } finally {
        showLoading(false);
    }
}

// Handle adding a person from search to the chart
function handleAddPersonFromSearch(person) {
    console.log('Adding person to chart:', person);

    // Check if person already exists
    const existingPerson = chartData.find(p => p.id === person.id);

    if (existingPerson) {
        // Person already exists, just select them
        handleNodeSelect(existingPerson);
        return;
    }

    // Add to chart data
    chartData.push(person);

    // Update chart
    updateChartData([person]);

    // Select the newly added person
    handleNodeSelect(person);
}

// Toggle edit form visibility
function toggleEditForm() {
    isEditFormVisible = !isEditFormVisible;

    const editForm = document.getElementById('edit-form');
    const editBtn = document.getElementById('edit-button');

    if (editForm && editBtn) {
        if (isEditFormVisible) {
            editForm.classList.add('visible');
            editBtn.classList.add('active');
            editBtn.textContent = 'Close Edit Form';

            // Initialize form with selected node if available
            if (selectedNode) {
                const editFormTitle = document.getElementById('edit-form-title');
                if (editFormTitle) {
                    editFormTitle.textContent = `Edit: ${selectedNode['first name'] || ''} ${selectedNode['last name'] || ''}`;
                }
            }
        } else {
            editForm.classList.remove('visible');
            editBtn.classList.remove('active');
            editBtn.textContent = 'Edit Person';
        }
    }
}

// Toggle highlight mode
function toggleHighlightMode() {
    highlightModeEnabled = !highlightModeEnabled;

    const highlightBtn = document.getElementById('highlight-button');

    if (highlightBtn) {
        if (highlightModeEnabled) {
            highlightBtn.classList.add('active');
            highlightBtn.textContent = 'Show All Nodes';

            // Apply highlighting if we have a selected node
            if (selectedNode) {
                applyHighlighting(selectedNode.id);
            }
        } else {
            highlightBtn.classList.remove('active');
            highlightBtn.textContent = 'Highlight Connected Nodes';

            // Remove highlighting
            removeHighlighting();
        }
    }
}

// Apply highlighting to connected nodes
function applyHighlighting(nodeId) {
    const chart = getChartInstance();
    const cardEl = document.querySelector(`.card_cont div[data-id="${nodeId}"]`);

    if (chart && chart.setOnHoverPathToMain && cardEl) {
        try {
            // We can use the onEnterPathToMain method provided by f3
            chart.onEnterPathToMain({ target: cardEl }, { data: { id: nodeId } });
            console.log('Highlighting applied to node:', nodeId);
        } catch (error) {
            console.error('Error applying highlighting:', error);
        }
    }
}

// Remove highlighting
function removeHighlighting() {
    const chart = getChartInstance();

    if (chart && chart.onLeavePathToMain) {
        try {
            chart.onLeavePathToMain();
            console.log('Highlighting removed');
        } catch (error) {
            console.error('Error removing highlighting:', error);
        }
    }
}

// Reset chart
async function resetChart() {
    showLoading(true);

    try {
        // Load initial data again
        chartData = await fetchInitialData();

        // Reinitialize chart
        await initializeChart(chartData, {
            onNodeSelect: handleNodeSelect
        });

        // Reset state
        selectedNode = null;
        highlightModeEnabled = false;
        isEditFormVisible = false;

        // Update UI
        const selectedInfo = document.getElementById('selected-info');
        const highlightBtn = document.getElementById('highlight-button');

        if (selectedInfo) {
            selectedInfo.style.display = 'none';
        }

        if (highlightBtn) {
            highlightBtn.disabled = true;
            highlightBtn.classList.remove('active');
            highlightBtn.textContent = 'Highlight Connected Nodes';
        }

        // Close edit form if open
        if (isEditFormVisible) {
            toggleEditForm();
        }

        updateDataSourceIndicator('Chart reset to initial data');
    } catch (error) {
        console.error('Error resetting chart:', error);
        updateDataSourceIndicator('Error resetting chart', true);
    } finally {
        showLoading(false);
    }
}

// Download chart data as JSON
function downloadChartData() {
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-chart-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Show or hide loading indicator
function showLoading(show) {
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

// Update data source indicator
function updateDataSourceIndicator(message, isError = false) {
    if (dataSourceIndicator) {
        dataSourceIndicator.textContent = message;
        dataSourceIndicator.style.backgroundColor = isError ? 'rgba(231, 76, 60, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export functions and state that other modules might need
export {
    chartData,
    selectedNode,
    handleNodeSelect,
    handleAddPersonFromSearch,
    toggleEditForm,
    toggleHighlightMode,
    resetChart,
    downloadChartData,
    showLoading,
    updateDataSourceIndicator
};