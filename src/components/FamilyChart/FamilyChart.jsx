import React, { useEffect, useRef, useState } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import * as d3 from 'd3';
import './FamilyChart.css';

// Direct implementation without relying on the external family-chart library
const FamilyChart = () => {
  const { networkData, selectedPerson, expandNode } = useNetwork();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || networkData.length === 0) {
      return;
    }

    try {
      // Clear any previous content
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Create SVG
      const width = containerRef.current.clientWidth || 800;
      const height = containerRef.current.clientHeight || 600;

      const svg = d3.select(containerRef.current)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', [0, 0, width, height])
        .attr('class', 'family-chart-svg');

      svgRef.current = svg;

      // Add zoom functionality
      const zoom = d3.zoom()
        .scaleExtent([0.1, 2])
        .on('zoom', (event) => {
          mainGroup.attr('transform', event.transform);
        });

      svg.call(zoom);

      const mainGroup = svg.append('g');

      // Process data to create a hierarchical structure
      const processedData = processNetworkData(networkData);

      // Calculate node positions
      const layoutData = calculateLayout(processedData);

      // Render the family tree
      renderFamilyTree(mainGroup, layoutData);

      // Center the view
      svg.call(zoom.transform, d3.zoomIdentity.translate(width / 4, 20).scale(0.8));

    } catch (err) {
      console.error("Error creating family chart:", err);
      setError("Failed to create family chart. Check console for details.");
    }
  }, [networkData, selectedPerson]);

  // Process network data into a format for visualization
  const processNetworkData = (data) => {
    // Create maps for quick lookups
    const nodeMap = new Map();
    const spouseMap = new Map();
    const childrenMap = new Map();
    const parentMap = new Map();

    // First pass: create maps
    data.forEach(person => {
      const id = String(person.id);
      nodeMap.set(id, person);

      // Track spouses
      const spouses = [];
      if (person.rels.spouses) {
        if (Array.isArray(person.rels.spouses)) {
          spouses.push(...person.rels.spouses.map(String));
        } else {
          spouses.push(String(person.rels.spouses));
        }
      }
      spouseMap.set(id, spouses);

      // Track children
      const children = [];
      if (person.rels.children) {
        if (Array.isArray(person.rels.children)) {
          children.push(...person.rels.children.map(String));
        } else {
          children.push(String(person.rels.children));
        }
      }
      childrenMap.set(id, children);

      // Track parents
      const parents = {};
      if (person.rels.father) {
        parents.father = String(person.rels.father);
      }
      if (person.rels.mother) {
        parents.mother = String(person.rels.mother);
      }
      parentMap.set(id, parents);
    });

    // Find root nodes (people with no parents or parents not in our dataset)
    const rootNodeIds = [];
    nodeMap.forEach((person, id) => {
      const parents = parentMap.get(id);
      const hasParentInData = parents &&
        ((parents.father && nodeMap.has(parents.father)) ||
          (parents.mother && nodeMap.has(parents.mother)));

      if (!hasParentInData) {
        rootNodeIds.push(id);
      }
    });

    return {
      nodeMap,
      spouseMap,
      childrenMap,
      parentMap,
      rootNodeIds
    };
  };

  // Calculate layout positions for the family tree
  const calculateLayout = (data) => {
    const { nodeMap, spouseMap, childrenMap, parentMap, rootNodeIds } = data;

    // Track generation levels
    const generationMap = new Map();

    // Assign generations starting from root nodes
    const assignGenerations = (nodeId, generation = 0, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Set generation for this node
      generationMap.set(nodeId, generation);

      // Process spouses at same level
      spouseMap.get(nodeId)?.forEach(spouseId => {
        if (nodeMap.has(spouseId) && !visited.has(spouseId)) {
          generationMap.set(spouseId, generation);
          visited.add(spouseId);
        }
      });

      // Process children at next level
      childrenMap.get(nodeId)?.forEach(childId => {
        if (nodeMap.has(childId) && !visited.has(childId)) {
          assignGenerations(childId, generation + 1, visited);
        }
      });
    };

    // Start from root nodes
    rootNodeIds.forEach(id => {
      assignGenerations(id, 0);
    });

    // If there are disconnected nodes, assign them to level 0
    nodeMap.forEach((_, id) => {
      if (!generationMap.has(id)) {
        assignGenerations(id, 0);
      }
    });

    // Group nodes by generation
    const generations = new Map();
    generationMap.forEach((gen, id) => {
      if (!generations.has(gen)) {
        generations.set(gen, []);
      }
      generations.get(gen).push(id);
    });

    // Layout configuration
    const nodeWidth = 220;
    const nodeHeight = 70;
    const levelHeight = 150;
    const horizontalSpacing = 20;

    // Calculate positions by generation
    const positions = new Map();

    // Sort generations
    const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);

    // Position each generation
    sortedGens.forEach(gen => {
      const nodesInGeneration = generations.get(gen);
      let currentX = 20;

      // Group by family units (spouses together)
      const processed = new Set();
      const familyUnits = [];

      // Find family units in this generation
      nodesInGeneration.forEach(id => {
        if (processed.has(id)) return;
        processed.add(id);

        const spouses = spouseMap.get(id)?.filter(sid =>
          generationMap.get(sid) === gen && !processed.has(sid)
        ) || [];

        // Create unit with this person and all spouses at same level
        const unit = [id, ...spouses];
        unit.forEach(uid => processed.add(uid));

        familyUnits.push(unit);
      });

      // Position each family unit
      familyUnits.forEach(unit => {
        // Position each person in the unit
        unit.forEach((id, index) => {
          positions.set(id, {
            x: currentX + index * (nodeWidth + horizontalSpacing),
            y: gen * levelHeight
          });
        });

        // Update x position for next unit
        currentX += unit.length * (nodeWidth + horizontalSpacing) + 40;
      });
    });

    return {
      nodeMap,
      spouseMap,
      childrenMap,
      parentMap,
      generationMap,
      positions,
      nodeWidth,
      nodeHeight
    };
  };

  // Render the family tree visualization
  const renderFamilyTree = (svg, layout) => {
    const {
      nodeMap,
      spouseMap,
      childrenMap,
      parentMap,
      positions,
      nodeWidth,
      nodeHeight
    } = layout;

    // Create connections group
    const connectionsGroup = svg.append('g')
      .attr('class', 'connections');

    // Draw spouse connections
    nodeMap.forEach((_, id) => {
      const pos = positions.get(id);
      if (!pos) return;

      // Draw connections to spouses
      spouseMap.get(id)?.forEach(spouseId => {
        const spousePos = positions.get(spouseId);
        if (!spousePos || spouseId < id) return; // Only draw once

        connectionsGroup.append('line')
          .attr('x1', pos.x + nodeWidth)
          .attr('y1', pos.y + nodeHeight / 2)
          .attr('x2', spousePos.x)
          .attr('y2', spousePos.y + nodeHeight / 2)
          .attr('stroke', '#aaa')
          .attr('stroke-width', 2);
      });

      // Draw connections to children
      childrenMap.get(id)?.forEach(childId => {
        const childPos = positions.get(childId);
        if (!childPos) return;

        // Check if this is a two-parent situation
        const childParents = parentMap.get(childId) || {};
        const otherParentId = childParents.father === id ? childParents.mother : childParents.father;

        // If other parent exists and is a spouse
        if (otherParentId && spouseMap.get(id)?.includes(otherParentId)) {
          // This is handled by the parent pair connection below
          return;
        }

        // Otherwise draw direct connection
        connectionsGroup.append('path')
          .attr('d', `M${pos.x + nodeWidth / 2},${pos.y + nodeHeight} L${pos.x + nodeWidth / 2},${pos.y + nodeHeight + 20} L${childPos.x + nodeWidth / 2},${childPos.y - 20} L${childPos.x + nodeWidth / 2},${childPos.y}`)
          .attr('stroke', '#aaa')
          .attr('stroke-width', 2)
          .attr('fill', 'none');
      });
    });

    // Draw parent pair to children connections
    nodeMap.forEach((person, id) => {
      const pos = positions.get(id);
      if (!pos) return;

      spouseMap.get(id)?.forEach(spouseId => {
        const spousePos = positions.get(spouseId);
        if (!spousePos || spouseId < id) return; // Only process once

        // Find common children
        const myChildren = childrenMap.get(id) || [];
        const spouseChildren = childrenMap.get(spouseId) || [];

        const commonChildren = myChildren.filter(cid => spouseChildren.includes(cid));

        if (commonChildren.length > 0) {
          // Calculate midpoint between spouses
          const midX = (pos.x + nodeWidth + spousePos.x) / 2;

          // Draw vertical line down from midpoint
          connectionsGroup.append('line')
            .attr('x1', midX)
            .attr('y1', pos.y + nodeHeight)
            .attr('x2', midX)
            .attr('y2', pos.y + nodeHeight + 30)
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2);

          // Connect to each child
          commonChildren.forEach(childId => {
            const childPos = positions.get(childId);
            if (!childPos) return;

            connectionsGroup.append('path')
              .attr('d', `M${midX},${pos.y + nodeHeight + 30} L${midX},${childPos.y - 20} L${childPos.x + nodeWidth / 2},${childPos.y - 20} L${childPos.x + nodeWidth / 2},${childPos.y}`)
              .attr('stroke', '#aaa')
              .attr('stroke-width', 2)
              .attr('fill', 'none');
          });
        }
      });
    });

    // Create nodes group
    const nodesGroup = svg.append('g')
      .attr('class', 'nodes');

    // Draw person cards
    nodeMap.forEach((person, id) => {
      const pos = positions.get(id);
      if (!pos) return;

      // Create person group
      const personGroup = nodesGroup.append('g')
        .attr('class', 'person')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('data-id', id)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (expandNode) expandNode(id);
        });

      // Get name
      const firstName = person.data["first name"] || "";
      const lastName = person.data["last name"] || "";
      const name = `${firstName} ${lastName}`.trim();

      // Background
      personGroup.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 8)
        .attr('fill', person.data.gender === 'M' ? 'rgba(67, 97, 238, 0.7)' : 'rgba(247, 37, 133, 0.7)')
        .attr('stroke', id === selectedPerson ? '#fff' : 'none')
        .attr('stroke-width', 2);

      // Avatar
      personGroup.append('clipPath')
        .attr('id', `clip-${id}`)
        .append('circle')
        .attr('cx', 35)
        .attr('cy', 35)
        .attr('r', 30);

      personGroup.append('image')
        .attr('x', 5)
        .attr('y', 5)
        .attr('width', 60)
        .attr('height', 60)
        .attr('clip-path', `url(#clip-${id})`)
        .attr('href', person.data.avatar || "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg");

      // Name
      personGroup.append('text')
        .attr('x', 75)
        .attr('y', 25)
        .attr('fill', 'white')
        .attr('font-family', 'Arial')
        .attr('font-weight', 'bold')
        .attr('font-size', '14px')
        .text(name);

      // Location
      if (person.data.location) {
        personGroup.append('text')
          .attr('x', 75)
          .attr('y', 45)
          .attr('fill', 'white')
          .attr('font-family', 'Arial')
          .attr('font-size', '12px')
          .text(person.data.location);
      }

      // Work
      if (person.data.work) {
        personGroup.append('text')
          .attr('x', 75)
          .attr('y', 60)
          .attr('fill', 'white')
          .attr('font-family', 'Arial')
          .attr('font-size', '12px')
          .text(person.data.work);
      }
    });
  };

  if (error) {
    return (
      <div className="family-chart-error">
        <p>{error}</p>
      </div>
    );
  }

  if (networkData.length === 0) {
    return (
      <div className="family-chart-empty">
        <p>Search for a person to view their family tree</p>
      </div>
    );
  }

  return (
    <div className="family-chart-container">
      <div ref={containerRef} className="family-chart"></div>
    </div>
  );
};

export default FamilyChart;