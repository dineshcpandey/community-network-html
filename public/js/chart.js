// Chart functionality

import { mergeNetworkData, cleanInvalidReferences } from './dataUtils.js';
import { chartData as appChartData, updateChartDataStore } from './app.js';
// Import the updatePersonData function at the top of the file
import { fetchNetworkData, updatePersonData } from './api.js';

// Global chart instance
let f3Chart = null;
let f3Card = null;
let f3EditTree = null;
// Track the currently edited person
let currentEditPerson = null;

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

        // Set up edit tree - THIS IS THE CRITICAL PART FOR THE EDIT FORM
        // Get the edit-form-content container for the edit form
        const editFormContent = document.getElementById('edit-form-content');

        if (!editFormContent) {
            console.error('Edit form content element not found');
        }

        // Initialize the edit tree with the correct container
        f3EditTree = f3Chart.editTree();

        // Configure the edit tree to use our specific container
        f3EditTree.cont = editFormContent;

        // Set up the fields we want to edit
        f3EditTree.setFields([
            "first name",
            "last name",
            "birthday",
            "avatar",
            "gender",
            "location",
            "work"
        ])
            .fixed(true)  // Keep the form fixed in position
            .setEditFirst(true)  // Start in edit mode
            .setOnChange(async () => {
                try {
                    // Use the currentEditPerson variable since the onChange callback doesn't pass datum
                    if (!currentEditPerson) {
                        console.error("Form change handler: No current edit person found");
                        throw new Error("No person data available for update");
                    }

                    console.log("Form submitted for:", currentEditPerson.id);

                    // Show a status message in the form
                    const statusMsg = document.createElement('div');
                    statusMsg.className = 'form-status-message';
                    statusMsg.textContent = 'Saving changes...';
                    editFormContent.appendChild(statusMsg);

                    // Call the API to update the person data
                    await updatePersonData(currentEditPerson.id, currentEditPerson);

                    // Update the status message
                    statusMsg.className = 'form-status-message success';
                    statusMsg.textContent = 'Changes saved successfully!';

                    // Create a success summary with data highlights
                    const successSummary = document.createElement('div');
                    successSummary.className = 'update-success-summary';

                    // Format the updated data for display
                    const firstName = currentEditPerson.data["first name"] || '';
                    const lastName = currentEditPerson.data["last name"] || '';
                    const location = currentEditPerson.data.location || 'Not specified';
                    const gender = currentEditPerson.data.gender === 'M' ? 'Male' :
                        currentEditPerson.data.gender === 'F' ? 'Female' : 'Not specified';

                    successSummary.innerHTML = `
            <h3>Updated Information</h3>
            <div class="summary-item">
                <span class="summary-label">Name:</span>
                <span class="summary-value">${firstName} ${lastName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Gender:</span>
                <span class="summary-value">${gender}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Location:</span>
                <span class="summary-value">${location}</span>
            </div>
            ${currentEditPerson.data.birthday ? `
                <div class="summary-item">
                    <span class="summary-label">Birthday:</span>
                    <span class="summary-value">${currentEditPerson.data.birthday}</span>
                </div>
            ` : ''}
        `;

                    // Add a close button
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'close-edit-form-btn';
                    closeBtn.textContent = 'Close';
                    closeBtn.addEventListener('click', () => {
                        // Find and click the existing close button to reuse its functionality
                        const existingCloseBtn = document.getElementById('close-edit-form');
                        if (existingCloseBtn) {
                            existingCloseBtn.click();
                        }
                    });

                    successSummary.appendChild(closeBtn);

                    // Add to the form
                    editFormContent.appendChild(successSummary);

                    // Remove the status message after a delay - but keep the summary
                    setTimeout(() => {
                        if (statusMsg.parentNode) {
                            statusMsg.parentNode.removeChild(statusMsg);
                        }
                    }, 3000);

                } catch (error) {
                    console.error('Error updating person data:', error);

                    // Show error message
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'form-status-message error';
                    errorMsg.textContent = `Error saving changes: ${error.message}`;
                    editFormContent.appendChild(errorMsg);

                    // Remove the error message after a delay
                    setTimeout(() => {
                        if (errorMsg.parentNode) {
                            errorMsg.parentNode.removeChild(errorMsg);
                        }
                    }, 5000);
                }
            });

        // Initialize the edit tree component
        f3EditTree.init();

        // Set up editing mode
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
 * Open edit tree for a specific person
 * @param {Object} person - The person data to edit
 */
export function openEditTree(person) {
    if (!f3Chart || !f3EditTree) {
        console.error('Chart or EditTree not initialized');
        return;
    }

    try {
        // Store the person being edited
        currentEditPerson = person;
        console.log('Editing person:', currentEditPerson.id);

        // Open edit form for this person
        f3EditTree.open({ data: person });
        console.log('Edit tree opened for person:', person.id);
    } catch (error) {
        console.error('Error opening edit tree:', error);
        currentEditPerson = null; // Reset on error
    }
}

/**
 * Clear current edit person reference
 */
export function clearCurrentEditPerson() {
    currentEditPerson = null;
    console.log('Cleared current edit person reference');
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
    currentEditPerson = null;
}