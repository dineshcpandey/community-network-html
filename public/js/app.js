// Main app entry point
import { initializeChart, updateChartData, getChartInstance } from './chart.js';
import { setupSearch, clearSearchResults } from './search.js';
import { setupEditForm } from './editForm.js';
import { fetchInitialData, fetchNetworkData } from './api.js';
import { setupControlPanel } from './controlPanel.js';
import { setupEventListeners } from './eventHandlers.js';


// Global state
export let chartData = [];
let selectedNode = null;
let highlightModeEnabled = false;
let isEditFormVisible = false;

// Elements
const loadingIndicator = document.getElementById('loading-indicator');
const dataSourceIndicator = document.getElementById('data-source-indicator');

// Function to update the chart data store
export function updateChartDataStore(newData) {
    console.log("app.js: Updating chart data store with", newData.length, "items");
    // Replace the entire array content
    chartData.length = 0;
    newData.forEach(item => chartData.push(item));
}

// Initialize the application
async function initApp() {
    // Show loading indicator
    showLoading(true);

    try {
        // Load initial data
        const initialData = await fetchInitialData();

        // Update chart data store
        updateChartDataStore(initialData);

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
            onDownloadClick: downloadChartData,
            onClearClick: clearChartData,
            onAddPersonClick: addNewPerson
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

    // Clear search results when a node is selected
    clearSearchResults();

    // Fetch network data for this node
    showLoading(true);
    try {
        const networkData = await fetchNetworkData(node.id);

        // Update chart data with network data
        await updateChartData(networkData);

        // Log the updated chart data size for verification
        console.log("app.js: After update, chart data has", chartData.length, "items");

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

    // Create a sanitized copy of the person to prevent errors with non-existent relationships
    const sanitizedPerson = {
        id: person.id,
        data: { ...person.data },
        rels: {}  // Start with empty relationships
    };

    // Check if the chart is in empty state
    const emptyStateEl = document.querySelector('.empty-chart-message');
    if (emptyStateEl && chartData.length === 0) {
        // Remove the empty state message
        emptyStateEl.parentNode.removeChild(emptyStateEl);

        // Initialize chart again since we're adding the first person
        initializeChart([sanitizedPerson], {
            onNodeSelect: handleNodeSelect
        }).catch(error => {
            console.error('Error initializing chart:', error);
        });
    }

    // Double-check if person already exists (should be filtered by search.js, but just in case)
    const existingPerson = chartData.find(p => p.id === sanitizedPerson.id);
    if (existingPerson) {
        // Person already exists, just select them
        handleNodeSelect(existingPerson);
        return;
    }

    // Add sanitized person to chart data
    chartData.push(sanitizedPerson);

    // Update chart with the new person
    updateChartData([sanitizedPerson])
        .then(() => {
            // Select the newly added person
            handleNodeSelect(sanitizedPerson);

            // Update data source indicator
            const fullName = `${sanitizedPerson.data["first name"] || ''} ${sanitizedPerson.data["last name"] || ''}`.trim();
            updateDataSourceIndicator(`Added ${fullName} to the chart`);

            // Clear and hide search results completely
            clearSearchResults();
        })
        .catch(error => {
            console.error('Error updating chart with new person:', error);
            updateDataSourceIndicator('Error adding person to chart', true);
        });
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
                    editFormTitle.textContent = `Edit: ${selectedNode.data["first name"] || ''} ${selectedNode.data["last name"] || ''}`;
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

    if (chart && chart.onEnterPathToMain && cardEl) {
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
        const initialData = await fetchInitialData();

        // Update chart data store
        updateChartDataStore(initialData);

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

/**
 * Clear all chart data and display an empty state message
 */
function clearChartData() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to clear all chart data? This action cannot be undone.')) {
        showLoading(true);

        try {
            // Clear chart data completely
            updateChartDataStore([]);

            // Get the chart container
            const chartContainer = document.getElementById('FamilyChart');
            if (chartContainer) {
                // Clear any existing chart
                chartContainer.innerHTML = '';

                // Create empty state message
                const emptyStateEl = document.createElement('div');
                emptyStateEl.className = 'empty-chart-message';
                emptyStateEl.innerHTML = `
          <div class="empty-chart-content">
            <h2>Family Tree is Empty</h2>
            <p>Use the search function to find and add people to your family tree.</p>
            <div class="empty-chart-icon">👪</div>
          </div>
        `;

                // Add to chart container
                chartContainer.appendChild(emptyStateEl);
            }

            // Reset application state
            selectedNode = null;
            highlightModeEnabled = false;

            // Update UI elements
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

            updateDataSourceIndicator('Chart data cleared');
            showLoading(false);
        } catch (error) {
            console.error('Error clearing chart data:', error);
            updateDataSourceIndicator('Error clearing chart data', true);
            showLoading(false);
        }
    }
}

/**
 * Create a new person and add them to the chart
 */
function addNewPerson() {
    // Create a new person with a unique ID
    const newPersonId = "person-" + Date.now();

    // Get basic information via prompts
    const firstName = prompt("Enter first name:", "New");
    if (firstName === null) return; // User canceled

    const lastName = prompt("Enter last name:", "Person");
    if (lastName === null) return; // User canceled

    const gender = confirm("Is this person male? (OK for male, Cancel for female)") ? "M" : "F";

    // Create the person object
    const newPerson = {
        id: newPersonId,
        data: {
            "first name": firstName || "New",
            "last name": lastName || "Person",
            "gender": gender,
            "avatar": "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg"
        },
        rels: {}
    };

    // Add to chart data
    chartData.push(newPerson);

    // Update the chart
    updateChartData([newPerson]);

    // Select the newly added person
    handleNodeSelect(newPerson);

    updateDataSourceIndicator(`Added new person: ${firstName} ${lastName}`);
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
    selectedNode,
    handleNodeSelect,
    handleAddPersonFromSearch,
    toggleEditForm,
    toggleHighlightMode,
    resetChart,
    clearChartData,
    addNewPerson,
    downloadChartData,
    showLoading,
    updateDataSourceIndicator
};