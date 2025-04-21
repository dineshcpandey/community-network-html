/**
 * Calculate layout positions for network nodes using a force-directed algorithm
 * This is a simplified implementation for demonstration purposes
 * 
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {Object} options - Layout options
 * @returns {Array} - Nodes with calculated positions
 */
export const calculateNetworkLayout = (nodes, edges, options = {}) => {
    const defaultOptions = {
        width: 1000,
        height: 800,
        nodeSpacing: 200,
        iterations: 50
    };

    const layoutOptions = { ...defaultOptions, ...options };

    // Simple force-directed layout implementation
    // In a real app, you might want to use D3.js force layout or a more sophisticated algorithm

    // Initialize positions randomly
    let positionedNodes = nodes.map(node => ({
        ...node,
        position: node.position || {
            x: Math.random() * layoutOptions.width,
            y: Math.random() * layoutOptions.height
        }
    }));

    // Create a map of node connections
    const connections = {};

    edges.forEach(edge => {
        if (!connections[edge.source]) {
            connections[edge.source] = [];
        }

        if (!connections[edge.target]) {
            connections[edge.target] = [];
        }

        connections[edge.source].push(edge.target);
        connections[edge.target].push(edge.source);
    });

    // Run iterations to improve layout
    for (let i = 0; i < layoutOptions.iterations; i++) {
        // Apply forces
        positionedNodes = applyForces(positionedNodes, connections, layoutOptions);
    }

    return positionedNodes;
};

/**
 * Apply forces to nodes based on connections
 */
const applyForces = (nodes, connections, options) => {
    const nodesMap = {};

    // Create a map for faster lookups
    nodes.forEach(node => {
        nodesMap[node.id] = { ...node };
    });

    // Apply attraction forces between connected nodes
    Object.keys(connections).forEach(nodeId => {
        if (!nodesMap[nodeId]) return;

        const connectedIds = connections[nodeId] || [];

        connectedIds.forEach(connectedId => {
            if (!nodesMap[connectedId]) return;

            const sourceNode = nodesMap[nodeId];
            const targetNode = nodesMap[connectedId];

            const dx = targetNode.position.x - sourceNode.position.x;
            const dy = targetNode.position.y - sourceNode.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) return;

            // Ideal distance between connected nodes
            const idealDistance = options.nodeSpacing;

            // Force strength (attraction if too far, repulsion if too close)
            const forceStrength = (distance - idealDistance) / distance * 0.1;

            const forceX = dx * forceStrength;
            const forceY = dy * forceStrength;

            // Apply forces
            nodesMap[nodeId].position.x += forceX;
            nodesMap[nodeId].position.y += forceY;
            nodesMap[connectedId].position.x -= forceX;
            nodesMap[connectedId].position.y -= forceY;
        });
    });

    // Apply repulsion forces between all nodes
    const nodeIds = Object.keys(nodesMap);

    for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
            const nodeA = nodesMap[nodeIds[i]];
            const nodeB = nodesMap[nodeIds[j]];

            const dx = nodeB.position.x - nodeA.position.x;
            const dy = nodeB.position.y - nodeA.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) continue;

            // Repulsion force (stronger when nodes are closer)
            const repulsionStrength = 500 / (distance * distance);

            const forceX = dx / distance * repulsionStrength;
            const forceY = dy / distance * repulsionStrength;

            // Apply forces
            nodeA.position.x -= forceX;
            nodeA.position.y -= forceY;
            nodeB.position.x += forceX;
            nodeB.position.y += forceY;
        }
    }

    // Constrain positions to canvas bounds
    Object.values(nodesMap).forEach(node => {
        node.position.x = Math.max(50, Math.min(options.width - 50, node.position.x));
        node.position.y = Math.max(50, Math.min(options.height - 50, node.position.y));
    });

    return Object.values(nodesMap);
};

/**
 * Get a color for a node based on gender
 * 
 * @param {string} gender - 'M' or 'F'
 * @returns {string} - CSS color value
 */
export const getGenderColor = (gender) => {
    return gender === 'M' ? 'var(--node-male-color)' : 'var(--node-female-color)';
};

/**
 * Get a color for an edge based on relationship type
 * 
 * @param {string} relationType - Type of relationship
 * @returns {string} - CSS color value
 */
export const getRelationshipColor = (relationType) => {
    const colors = {
        spouse: '#FF9E80',
        child: '#4FC3F7',
        father: '#81C784',
        mother: '#BA68C8',
    };

    return colors[relationType] || '#aaaaaa';
};