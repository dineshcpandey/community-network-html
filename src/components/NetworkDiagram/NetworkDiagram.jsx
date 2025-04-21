import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    Panel,
    Position,
    ReactFlowProvider
} from 'reactflow';
import * as d3 from 'd3';
import 'reactflow/dist/style.css';
import { useNetwork } from '../../context/NetworkContext';
import FamilyNode from './FamilyNode';
import './NetworkDiagram.css';
import { getRelationshipColor } from '../../utils/networkUtils';

// Custom node types
const nodeTypes = {
    familyNode: FamilyNode,
};

const NetworkDiagram = () => {
    const {
        networkData,
        selectedPerson,
        expandNode,
        expandedNodes,
        loading,
        resetNetwork
    } = useNetwork();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [layoutDirection, setLayoutDirection] = useState('TB'); // 'TB' (top to bottom) or 'LR' (left to right)
    const reactFlowInstance = useRef(null);
    const simulationRef = useRef(null);

    // Function to update node positions after drag
    const onNodeDragStop = useCallback((event, node) => {
        // Mark node as manually positioned
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    return { ...n, dragged: true, position: node.position };
                }
                return n;
            })
        );

        // Force edge redraw after drag
        setTimeout(() => {
            // This forces a redraw of edges
            setEdges((eds) => [...eds]);
        }, 10);
    }, [setNodes, setEdges]);

    // Apply force-directed layout - define this function first
    const applyForceLayout = useCallback((initialNodes, initialEdges, direction) => {
        if (initialNodes.length === 0) return;

        // Stop any existing simulation
        if (simulationRef.current) {
            simulationRef.current.stop();
        }

        // Create a map for quick node lookup
        const nodeMap = {};
        initialNodes.forEach(node => {
            nodeMap[node.id] = node;
        });

        // Find root nodes - those without parents
        const rootNodes = initialNodes.filter(node => {
            const nodeId = node.id;
            return !initialEdges.some(edge =>
                edge.target === nodeId && (edge.id.startsWith('father-') || edge.id.startsWith('mother-'))
            );
        });

        // Calculate generation ranks - start with root nodes at level 0
        const generationMap = new Map();

        // Helper function to calculate generations recursively
        const calculateGenerations = (nodeId, generation = 0) => {
            if (generationMap.has(nodeId)) {
                // Only update if new generation is smaller (closer to root)
                if (generation < generationMap.get(nodeId)) {
                    generationMap.set(nodeId, generation);
                }
                return;
            }

            generationMap.set(nodeId, generation);

            // Find all children of this node
            const childEdges = initialEdges.filter(edge =>
                edge.source === nodeId && (edge.id.startsWith('father-') || edge.id.startsWith('mother-'))
            );

            // Process children recursively
            childEdges.forEach(edge => {
                calculateGenerations(edge.target, generation + 1);
            });
        };

        // Start calculation from root nodes
        rootNodes.forEach(node => {
            calculateGenerations(node.id, 100);
        });

        // If no root nodes found, start from any node
        if (rootNodes.length === 0 && initialNodes.length > 0) {
            calculateGenerations(initialNodes[0].id, 100);
        }

        // Create an array of nodes for the simulation
        const simulationNodes = initialNodes.map(node => ({
            ...node,
            // Include a generation property for vertical positioning
            generation: generationMap.get(node.id) || 100,
            // Add x and y coordinates if not already present
            x: node.position?.x || Math.random() * 800,
            y: node.position?.y || Math.random() * 600
        }));

        // Create links for the simulation - only include links where both nodes exist
        const simulationLinks = [];
        initialEdges.forEach(edge => {
            const sourceExists = simulationNodes.some(node => node.id === edge.source);
            const targetExists = simulationNodes.some(node => node.id === edge.target);

            if (sourceExists && targetExists) {
                simulationLinks.push({
                    source: edge.source,
                    target: edge.target,
                    relation: edge.relation || 'unknown'
                });
            }
        });

        // Create the force simulation
        const simulation = d3.forceSimulation(simulationNodes)
            .force('link', d3.forceLink(simulationLinks)
                .id(d => d.id)
                .distance(link => {
                    // Spouse links should be shorter
                    if (link.relation === 'spouse') return 120;
                    // Parent-child links longer
                    return 180;
                })
                .strength(link => {
                    // Spouse links should be stronger
                    if (link.relation === 'spouse') return 0.7;
                    return 0.3;
                })
            )
            .force('charge', d3.forceManyBody().strength(-800))
            .force('collide', d3.forceCollide(100))
            .force('x', d3.forceX().strength(0.1))
            .force('y', d3.forceY(d => {
                // Position nodes by generation - multiply by 150 for vertical spacing
                return (d.generation - 100) * 150;
            }).strength(0.5));

        // Store reference to simulation
        simulationRef.current = simulation;

        // Update node positions on each simulation tick
        simulation.on('tick', () => {
            setNodes(prevNodes => {
                return prevNodes.map(node => {
                    const simNode = simulationNodes.find(n => n.id === node.id);
                    if (simNode && !node.dragged) {
                        return {
                            ...node,
                            position: { x: simNode.x, y: simNode.y },
                            data: {
                                ...node.data,
                                rank: generationMap.get(node.id) || 0
                            }
                        };
                    }
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            rank: generationMap.get(node.id) || 0
                        }
                    };
                });
            });
        });

        // Run the simulation for 300 iterations
        simulation.alpha(1).restart();

        // Stop simulation after some time to save resources
        setTimeout(() => {
            if (simulation) {
                simulation.stop();
            }

            // Fit view to show all nodes
            if (reactFlowInstance.current) {
                reactFlowInstance.current.fitView({ padding: 0.2 });
            }
        }, 2000);
    }, [setNodes]);

    // Re-apply layout when layout direction changes
    const onLayoutDirectionChange = useCallback((direction) => {
        setLayoutDirection(direction);

        // Reset any dragged states when changing layout direction
        setNodes(nodes => nodes.map(node => ({
            ...node,
            dragged: false
        })));
    }, [setNodes]);

    // Force recalculation of layout
    const recalculateLayout = useCallback(() => {
        applyForceLayout(
            nodes.map(node => ({ ...node, dragged: false })),
            edges,
            layoutDirection
        );
    }, [nodes, edges, layoutDirection, applyForceLayout]);

    // Fix for ResizeObserver issue
    useEffect(() => {
        // This adds a small delay before rendering to avoid ResizeObserver loop errors
        const timer = setTimeout(() => {
            // Optional: You could trigger a re-render here if needed
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <div className="network-loading">Loading network diagram...</div>;
    }

    if (networkData.length === 0) {
        return (
            <div className="network-empty">
                <p>Search for a person to view their network</p>
            </div>
        );
    }

    return (
        <div className="network-diagram">
            <ReactFlowProvider>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.2}
                    maxZoom={1.5}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    onInit={(instance) => {
                        reactFlowInstance.current = instance;
                    }}
                    elementsSelectable={true}
                    nodesConnectable={true}
                    nodesDraggable={true}
                    edgesFocusable={true}
                    nodesFocusable={true}
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                    connectionLineType="smoothstep"
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: false,
                        style: { strokeWidth: 2 }
                    }}
                >
                    <Background />
                    <Controls />
                    <MiniMap />

                    <Panel position="top-right" className="control-panel">
                        <div className="layout-controls">
                            <span>Layout:</span>
                            <button
                                className={`layout-button ${layoutDirection === 'TB' ? 'active' : ''}`}
                                onClick={() => onLayoutDirectionChange('TB')}
                            >
                                Vertical
                            </button>
                            <button
                                className={`layout-button ${layoutDirection === 'LR' ? 'active' : ''}`}
                                onClick={() => onLayoutDirectionChange('LR')}
                            >
                                Horizontal
                            </button>
                        </div>

                        <button
                            className="control-button"
                            onClick={recalculateLayout}
                            title="Reset node positions"
                        >
                            Recalculate Layout
                        </button>

                        <button
                            className="control-button"
                            onClick={() => reactFlowInstance.current?.fitView({ padding: 0.2 })}
                            title="Center view to show all nodes"
                        >
                            Reset View
                        </button>

                        <button
                            className="control-button clear-button"
                            onClick={() => resetNetwork()}
                            title="Clear the network and start over"
                        >
                            Clear Network
                        </button>
                    </Panel>
                </ReactFlow>
            </ReactFlowProvider>

            <div className="network-legend">
                <h4>Relationship Types</h4>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: getRelationshipColor('spouse') }}></div>
                    <span>Spouse</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: getRelationshipColor('child') }}></div>
                    <span>Child</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: getRelationshipColor('father') }}></div>
                    <span>Father</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: getRelationshipColor('mother') }}></div>
                    <span>Mother</span>
                </div>
            </div>
        </div>
    );
};

export default NetworkDiagram;