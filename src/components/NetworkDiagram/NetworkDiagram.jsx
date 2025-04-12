import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNetwork } from '../../context/NetworkContext';
import FamilyNode from './FamilyNode';
import './NetworkDiagram.css';

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
        loading
    } = useNetwork();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Transform network data to nodes and edges
    useEffect(() => {
        if (networkData.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const transformedNodes = [];
        const transformedEdges = [];
        const processedRelationships = new Set();

        // Helper to get full name
        const getFullName = (person) => {
            const firstName = person.data['first name'] || '';
            const lastName = person.data['last name'] || '';
            return `${firstName} ${lastName}`.trim();
        };

        // Process network data to create nodes
        networkData.forEach((person) => {
            // Create node for person
            transformedNodes.push({
                id: person.id,
                type: 'familyNode',
                position: { x: 0, y: 0 }, // Will be positioned by layout
                data: {
                    id: person.id,
                    name: getFullName(person),
                    gender: person.data.gender,
                    avatar: person.data.avatar,
                    location: person.data.location,
                    work: person.data.work,
                    expanded: expandedNodes.has(person.id),
                    onExpand: () => expandNode(person.id),
                    selected: person.id === selectedPerson
                }
            });
        });

        // Process relationships to create edges
        networkData.forEach((person) => {
            // Process spouse relationships
            if (person.rels.spouses && person.rels.spouses.length > 0) {
                // Convert to array if it's not already (handle both string and array formats)
                const spouses = Array.isArray(person.rels.spouses)
                    ? person.rels.spouses
                    : [person.rels.spouses];

                spouses.forEach((spouseId) => {
                    // Ensure spouseId is treated as a string for comparison
                    const spouseIdStr = String(spouseId);
                    const personIdStr = String(person.id);
                    const relationshipId = [personIdStr, spouseIdStr].sort().join('-');

                    if (!processedRelationships.has(relationshipId)) {
                        transformedEdges.push({
                            id: `spouse-${relationshipId}`,
                            source: personIdStr,
                            target: spouseIdStr,
                            type: 'straight',
                            animated: false,
                            style: { stroke: '#FF9E80', strokeWidth: 2 },
                            label: 'Spouse',
                            markerEnd: {
                                type: MarkerType.Arrow,
                            }
                        });

                        processedRelationships.add(relationshipId);
                    }
                });
            }

            // Process parent-child relationships
            if (person.rels.children && person.rels.children.length > 0) {
                // Convert to array if it's not already (handle both string and array formats)
                const children = Array.isArray(person.rels.children)
                    ? person.rels.children
                    : [person.rels.children];

                children.forEach((childId) => {
                    const childIdStr = String(childId);
                    const personIdStr = String(person.id);

                    transformedEdges.push({
                        id: `parent-${personIdStr}-${childIdStr}`,
                        source: personIdStr,
                        target: childIdStr,
                        type: 'straight',
                        animated: false,
                        style: { stroke: '#4FC3F7', strokeWidth: 2 },
                        label: 'Child',
                        markerEnd: {
                            type: MarkerType.Arrow,
                        }
                    });
                });
            }

            // Process father relationships
            if (person.rels.father) {
                const fatherId = String(person.rels.father);
                const personId = String(person.id);

                transformedEdges.push({
                    id: `father-${fatherId}-${personId}`,
                    source: fatherId,
                    target: personId,
                    type: 'straight',
                    animated: false,
                    style: { stroke: '#81C784', strokeWidth: 2 },
                    label: 'Father',
                    markerEnd: {
                        type: MarkerType.Arrow,
                    }
                });
            }

            // Process mother relationships
            if (person.rels.mother) {
                const motherId = String(person.rels.mother);
                const personId = String(person.id);

                transformedEdges.push({
                    id: `mother-${motherId}-${personId}`,
                    source: motherId,
                    target: personId,
                    type: 'straight',
                    animated: false,
                    style: { stroke: '#BA68C8', strokeWidth: 2 },
                    label: 'Mother',
                    markerEnd: {
                        type: MarkerType.Arrow,
                    }
                });
            }
        });

        setNodes(transformedNodes);
        setEdges(transformedEdges);

        // Apply layout after nodes are rendered
        setTimeout(() => applyNetworkLayout(transformedNodes, transformedEdges), 100);
    }, [networkData, selectedPerson, expandedNodes]);

    // Apply force-directed layout to position nodes
    const applyNetworkLayout = useCallback((nodes, edges) => {
        if (nodes.length === 0) return;

        // Use D3 force simulation to position nodes
        // This is a simplified version for this example
        const positionedNodes = nodes.map((node, index) => {
            const baseX = (index % 4) * 300 + 50;
            const baseY = Math.floor(index / 4) * 200 + 50;

            return {
                ...node,
                position: { x: baseX, y: baseY }
            };
        });

        setNodes(positionedNodes);
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
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>

            <div className="network-legend">
                <h4>Relationship Types</h4>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#FF9E80' }}></div>
                    <span>Spouse</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#4FC3F7' }}></div>
                    <span>Child</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#81C784' }}></div>
                    <span>Father</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#BA68C8' }}></div>
                    <span>Mother</span>
                </div>
            </div>
        </div>
    );
};

export default NetworkDiagram;