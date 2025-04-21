// Control Panel functionality

// Default options
let controlOptions = {
    onEditClick: null,
    onHighlightToggle: null,
    onResetClick: null,
    onDownloadClick: null,
    onClearClick: null,
    onAddPersonClick: null
};

/**
 * Set up control panel functionality
 * @param {Object} options - Control panel options
 */
export function setupControlPanel(options = {}) {
    // Merge options
    controlOptions = { ...controlOptions, ...options };

    // Get the control panel element
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) {
        console.error('Control panel element not found');
        return;
    }

    // Clear any existing content for clean setup
    controlPanel.innerHTML = `
        <h2>Family Tree Controls</h2>
        
        <!-- Selection Actions -->
        <div class="control-panel-section">
            <button id="edit-button" class="control-btn edit-btn">Edit Person</button>
            <button id="highlight-button" class="control-btn highlight-btn" disabled>Highlight Connected Nodes</button>
        </div>
        
        <!-- Chart Actions -->
        <div class="control-panel-section">
            <button id="reset-button" class="control-btn reset-btn">Reset Chart</button>
            <button id="download-button" class="control-btn download-btn">Download JSON</button>
        </div>
        
        <!-- Data Management -->
        <h3>Data Management</h3>
        <div class="control-panel-section">
            <button id="clear-button" class="control-btn clear-btn">Clear Chart Data</button>
        </div>
        
        <!-- Add People -->
        <h3>Add People</h3>
        <div class="control-panel-section">
            <button id="add-person-button" class="control-btn add-person-btn">Add New Person</button>
        </div>
        
        <!-- Selection Info -->
        <div id="selected-info" class="selected-node-info" style="display: none;">
            Selected Node: <span id="selected-node-id"></span>
        </div>
    `;

    // Set up event listeners
    if (controlOptions.onEditClick) {
        const editButton = document.getElementById('edit-button');
        if (editButton) {
            editButton.addEventListener('click', controlOptions.onEditClick);
        }
    }

    if (controlOptions.onHighlightToggle) {
        const highlightButton = document.getElementById('highlight-button');
        if (highlightButton) {
            highlightButton.addEventListener('click', controlOptions.onHighlightToggle);
        }
    }

    if (controlOptions.onResetClick) {
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', controlOptions.onResetClick);
        }
    }

    if (controlOptions.onDownloadClick) {
        const downloadButton = document.getElementById('download-button');
        if (downloadButton) {
            downloadButton.addEventListener('click', controlOptions.onDownloadClick);
        }
    }

    if (controlOptions.onClearClick) {
        const clearButton = document.getElementById('clear-button');
        if (clearButton) {
            clearButton.addEventListener('click', controlOptions.onClearClick);
        }
    }

    if (controlOptions.onAddPersonClick) {
        const addPersonButton = document.getElementById('add-person-button');
        if (addPersonButton) {
            addPersonButton.addEventListener('click', controlOptions.onAddPersonClick);
        }
    }

    console.log('Control panel initialized');
}

/**
 * Update selected node information
 * @param {Object} node - Selected node data
 */
export function updateSelectedNodeInfo(node) {
    const selectedInfo = document.getElementById('selected-info');
    const selectedNodeId = document.getElementById('selected-node-id');

    if (!selectedInfo || !selectedNodeId) return;

    if (node) {
        selectedInfo.style.display = 'block';
        selectedNodeId.textContent = node.id;

        // Enable highlight button
        const highlightButton = document.getElementById('highlight-button');
        if (highlightButton) {
            highlightButton.disabled = false;
        }
    } else {
        selectedInfo.style.display = 'none';

        // Disable highlight button
        const highlightButton = document.getElementById('highlight-button');
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
    const editButton = document.getElementById('edit-button');
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
    const highlightButton = document.getElementById('highlight-button');
    if (!highlightButton) return;

    if (isActive) {
        highlightButton.classList.add('active');
        highlightButton.textContent = 'Show All Nodes';
    } else {
        highlightButton.classList.remove('active');
        highlightButton.textContent = 'Highlight Connected Nodes';
    }
}