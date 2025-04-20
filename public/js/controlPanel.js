// Control Panel functionality

// Elements
const editButton = document.getElementById('edit-button');
const highlightButton = document.getElementById('highlight-button');
const resetButton = document.getElementById('reset-button');
const downloadButton = document.getElementById('download-button');
const selectedInfo = document.getElementById('selected-info');
const selectedNodeId = document.getElementById('selected-node-id');

// Default options
let controlOptions = {
    onEditClick: null,
    onHighlightToggle: null,
    onResetClick: null,
    onDownloadClick: null,
};

/**
 * Set up control panel functionality
 * @param {Object} options - Control panel options
 */
export function setupControlPanel(options = {}) {
    // Merge options
    controlOptions = { ...controlOptions, ...options };

    // Set up event listeners
    if (editButton && controlOptions.onEditClick) {
        editButton.addEventListener('click', controlOptions.onEditClick);
    }

    if (highlightButton && controlOptions.onHighlightToggle) {
        highlightButton.addEventListener('click', controlOptions.onHighlightToggle);
    }

    if (resetButton && controlOptions.onResetClick) {
        resetButton.addEventListener('click', controlOptions.onResetClick);
    }

    if (downloadButton && controlOptions.onDownloadClick) {
        downloadButton.addEventListener('click', controlOptions.onDownloadClick);
    }

    console.log('Control panel initialized');
}

/**
 * Update selected node information
 * @param {Object} node - Selected node data
 */
export function updateSelectedNodeInfo(node) {
    if (!selectedInfo || !selectedNodeId) return;

    if (node) {
        selectedInfo.style.display = 'block';
        selectedNodeId.textContent = node.id;

        // Enable highlight button
        if (highlightButton) {
            highlightButton.disabled = false;
        }
    } else {
        selectedInfo.style.display = 'none';

        // Disable highlight button
        if (highlightButton) {
            highlightButton.disabled = true;
        }
    }
}

/**
 * Update edit button state
 * @param {boolean} isActive - Whether edit mode is active
 */
export function updateEditButtonState(isActive) {
    if (!editButton) return;

    if (isActive) {
        editButton.classList.add('active');
        editButton.textContent = 'Close Edit Form';
    } else {
        editButton.classList.remove('active');
        editButton.textContent = 'Edit Person';
    }
}

/**
 * Update highlight button state
 * @param {boolean} isActive - Whether highlight mode is active
 */
export function updateHighlightButtonState(isActive) {
    if (!highlightButton) return;

    if (isActive) {
        highlightButton.classList.add('active');
        highlightButton.textContent = 'Show All Nodes';
    } else {
        highlightButton.classList.remove('active');
        highlightButton.textContent = 'Highlight Connected Nodes';
    }
}