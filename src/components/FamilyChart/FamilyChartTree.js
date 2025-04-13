import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
    ensureFamilyChartLoaded,
    convertNetworkDataToFamilyChart,
    createCardDisplay
} from '../../utils/familyChartUtils';
import './FamilyChartTree.css';

const FamilyChartTree = () => {
    const { networkData, selectedPerson, expandNode, resetNetwork } = useNetwork();
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [draggingEnabled, setDraggingEnabled] = useState(true);

    // Define enableNodeDragging using useCallback so it can be used in dependency arrays
    const enableNodeDragging = useCallback((f3) => {
        if (!containerRef.current || !chartRef.current) return;

        const d3 = window.d3;
        if (!d3) {
            console.error("D3 library not loaded");
            return;
        }

        // Access the SVG element
        const svg = containerRef.current.querySelector('svg');
        if (!svg) {
            console.error("SVG element not found");
            return;
        }

        // Find all card containers
        const cards = svg.querySelectorAll('.card_cont');
        console.log("Found cards:", cards.length, "Dragging enabled:", draggingEnabled);

        // Either apply or remove drag behavior based on draggingEnabled state
        cards.forEach(card => {
            // Clean up any existing drag behavior
            if (card.__dragInstance) {
                card.__dragInstance.on("start", null).on("drag", null).on("end", null);
                d3.select(card).on(".drag", null);
                delete card.__dragInstance;
                card.classList.remove('draggable');
                card.style.cursor = "";
            }

            // If dragging is disabled, just return after cleanup
            if (!draggingEnabled) return;

            // Mark as draggable for styling
            card.classList.add('draggable');
            card.style.cursor = "grab";

            // Prevent text selection during drag
            card.style.userSelect = "none";

            // Create drag behavior
            const drag = d3.drag()
                .on("start", function (event) {
                    event.sourceEvent.stopPropagation();

                    // Set cursor
                    this.style.cursor = "grabbing";

                    // Parse current transform to get x,y coordinates
                    const transform = d3.select(this).attr("transform");
                    const translate = /translate\(([^,]+),([^)]+)\)/.exec(transform);
                    if (translate) {
                        this.__x = parseFloat(translate[1]);
                        this.__y = parseFloat(translate[2]);
                    }

                    // Set flag to indicate dragging
                    window.isDragging = false;
                    this.classList.add('dragging');

                    // Dim other cards while dragging
                    const allCards = svg.querySelectorAll('.card_cont');
                    allCards.forEach(c => {
                        if (c !== this) {
                            c.style.opacity = '0.6';
                        }
                    });
                })
                .on("drag", function (event) {
                    // Set flag that we're actually dragging (after a small movement)
                    if (!window.isDragging && (Math.abs(event.dx) > 3 || Math.abs(event.dy) > 3)) {
                        window.isDragging = true;
                    }

                    // Calculate new position
                    const x = this.__x + event.dx;
                    const y = this.__y + event.dy;

                    // Apply transform
                    d3.select(this).attr("transform", `translate(${x},${y})`);

                    // Store in element
                    this.__currentX = x;
                    this.__currentY = y;
                })
                .on("end", function (event) {
                    // Reset cursor
                    this.style.cursor = "grab";

                    // Remove dragging class
                    this.classList.remove('dragging');

                    // Reset opacity for all cards
                    const allCards = svg.querySelectorAll('.card_cont');
                    allCards.forEach(c => {
                        c.style.opacity = '';
                    });

                    // If we were actually dragging
                    if (window.isDragging) {
                        // Find node id
                        const cardElement = this.querySelector('.card');
                        if (cardElement) {
                            const nodeId = cardElement.dataset.id;

                            if (nodeId && chartRef.current) {
                                // Find node in chart data
                                const treeData = chartRef.current.getTree().data;
                                const node = treeData.find(n => n.data.id === nodeId);

                                if (node) {
                                    // Update node position and mark as manually positioned
                                    node.x = this.__currentX || node.x;
                                    node.y = this.__currentY || node.y;
                                    node.dragged = true;

                                    console.log(`Node ${nodeId} dragged to:`, node.x, node.y);
                                }
                            }
                        }

                        // Reset flag with delay to prevent unwanted clicks
                        setTimeout(() => { window.isDragging = false; }, 50);
                    }
                });

            // Apply drag behavior to element
            drag(d3.select(card));

            // Store drag instance for later cleanup
            card.__dragInstance = drag;
        });
    }, [draggingEnabled]); // Include draggingEnabled as a dependency

    // Create and setup the family chart
    useEffect(() => {
        // Skip if no container
        if (!containerRef.current) {
            return;
        }

        // Load family chart library
        setIsLoading(true);
        ensureFamilyChartLoaded()
            .then(f3 => {
                setError(null);

                // If no data, don't initialize the chart
                if (networkData.length === 0) {
                    setIsLoading(false);
                    return;
                }

                try {
                    // Clear container first
                    containerRef.current.innerHTML = '';

                    // Transform network data to format expected by family-chart
                    const formattedData = convertNetworkDataToFamilyChart(networkData, selectedPerson);

                    // Create family chart
                    const chart = f3.createChart(containerRef.current, formattedData);

                    // Configure chart
                    chart
                        .setCardYSpacing(120)
                        .setCardXSpacing(200)
                        .setOrientationVertical()
                        .setTransitionTime(800)
                        .setAfterUpdate((event) => {
                            // After chart updates, we can add drag behavior
                            if (draggingEnabled) {
                                enableNodeDragging(f3);
                            }
                        });

                    // Configure card display
                    const cardSvg = f3.CardSvg(containerRef.current, chart.store);
                    cardSvg.setCardDisplay(createCardDisplay());

                    // Configure card dimensions
                    cardSvg.setCardDim({
                        w: 220,
                        h: 80,
                        text_x: 80,
                        text_y: 20,
                        img_w: 60,
                        img_h: 60,
                        img_x: 10,
                        img_y: 10
                    });

                    // Enable mini-tree and link break
                    cardSvg.setMiniTree(true);
                    cardSvg.setLinkBreak(true);

                    // Set up click handler to update main person
                    cardSvg.setOnCardClick((e, d) => {
                        // Ignore if we're dragging
                        if (window.isDragging) {
                            window.isDragging = false;
                            return;
                        }

                        // Update selected person in network context
                        if (d && d.data && d.data.id) {
                            expandNode(d.data.id);

                            // Update main person in chart
                            chart.updateMainId(d.data.id);
                            chart.updateTree();
                        }
                    });

                    // Create initial view
                    chart.updateTree({ initial: true });

                    // Add drag behavior
                    if (draggingEnabled) {
                        enableNodeDragging(f3);
                    }

                    // Store reference to chart
                    chartRef.current = chart;
                } catch (error) {
                    console.error('Error creating family chart:', error);
                    setError('Failed to create family chart. Check console for details.');
                } finally {
                    setIsLoading(false);
                }
            })
            .catch(error => {
                console.error('Failed to load family chart library:', error);
                setError('Failed to load family chart library. Check if family-chart.min.js is accessible.');
                setIsLoading(false);
            });

        // Cleanup function
        return () => {
            chartRef.current = null;
        };
    }, [networkData, selectedPerson, expandNode, draggingEnabled, enableNodeDragging]); // Add enableNodeDragging to dependency array

    // Update chart when window is resized
    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current) {
                try {
                    // Update tree with fit option to resize properly
                    chartRef.current.updateTree({
                        tree_position: 'fit'
                    });

                    // Re-apply draggable after a small delay
                    setTimeout(() => {
                        if (draggingEnabled) {
                            enableNodeDragging(window.f3);
                        }
                    }, 300);
                } catch (error) {
                    console.error('Error resizing chart:', error);
                }
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [draggingEnabled, enableNodeDragging]); // Add enableNodeDragging to dependency array

    // Toggle dragging
    const toggleDragging = () => {
        console.log("Toggling dragging state:", draggingEnabled, "->", !draggingEnabled);
        const newState = !draggingEnabled;
        setDraggingEnabled(newState);

        // Apply or remove drag behavior immediately
        setTimeout(() => {
            if (chartRef.current) {
                enableNodeDragging(window.f3);
            }
        }, 0);
    };

    // Handle layout change
    const handleOrientationChange = (orientation) => {
        if (!chartRef.current) return;

        try {
            if (orientation === 'vertical') {
                chartRef.current.setOrientationVertical();
            } else {
                chartRef.current.setOrientationHorizontal();
            }

            chartRef.current.updateTree();

            // Re-apply draggable after update
            setTimeout(() => {
                if (draggingEnabled) {
                    enableNodeDragging(window.f3);
                }
            }, 1000);
        } catch (error) {
            console.error('Error changing orientation:', error);
            setError('Failed to change orientation. Try refreshing the page.');
        }
    };

    // Handle reset button click
    const handleReset = () => {
        resetNetwork();
    };

    // Handle reset positions
    const handleResetPositions = () => {
        if (!chartRef.current) return;

        try {
            // Reset dragged flag for all nodes
            const treeData = chartRef.current.getTree().data;
            treeData.forEach(node => {
                if (node.dragged) {
                    node.dragged = false;
                }
            });

            // Update the chart
            chartRef.current.updateTree();

            // Re-apply draggable after update
            setTimeout(() => {
                if (draggingEnabled) {
                    enableNodeDragging(window.f3);
                }
            }, 1000);
        } catch (error) {
            console.error('Error resetting positions:', error);
        }
    };

    // Handle fit to screen
    const handleFitToScreen = () => {
        if (!chartRef.current) return;

        try {
            chartRef.current.updateTree({
                tree_position: 'fit'
            });

            // Re-apply draggable after update
            setTimeout(() => {
                if (draggingEnabled) {
                    enableNodeDragging(window.f3);
                }
            }, 1000);
        } catch (error) {
            console.error('Error fitting chart to screen:', error);
        }
    };

    // Handle expand all nodes
    const handleExpandAll = () => {
        if (!chartRef.current) return;

        try {
            // Expand all nodes
            networkData.forEach(person => {
                if (person.id) {
                    expandNode(person.id);
                }
            });

            // Update the chart
            chartRef.current.updateTree();

            // Re-apply draggable after update
            setTimeout(() => {
                if (draggingEnabled) {
                    enableNodeDragging(window.f3);
                }
            }, 1000);
        } catch (error) {
            console.error('Error expanding nodes:', error);
        }
    };

    // Render error state
    if (error) {
        return (
            <div className="family-chart-error">
                <p>{error}</p>
                <button
                    className="chart-control-button"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </button>
            </div>
        );
    }

    // Render loading state
    if (isLoading) {
        return (
            <div className="family-chart-loading">
                <p>Loading family chart...</p>
            </div>
        );
    }

    // Render empty state
    if (networkData.length === 0) {
        return (
            <div className="family-chart-empty">
                <p>Search for a person to view their family tree</p>
            </div>
        );
    }

    return (
        <div className="family-chart-page">
            {/* Standalone drag toggle for better visibility */}
            <div className="drag-toggle-standalone">
                <button
                    className={`toggle-drag-button ${draggingEnabled ? 'active' : ''}`}
                    onClick={toggleDragging}
                >
                    {draggingEnabled ? "Dragging Enabled (Click to Disable)" : "Dragging Disabled (Click to Enable)"}
                </button>
            </div>

            <div className="family-chart-container">
                <div className="family-chart-controls">
                    <button
                        className="chart-control-button"
                        onClick={() => handleOrientationChange('vertical')}
                        title="Switch to Vertical Layout"
                    >
                        Vertical
                    </button>
                    <button
                        className="chart-control-button"
                        onClick={() => handleOrientationChange('horizontal')}
                        title="Switch to Horizontal Layout"
                    >
                        Horizontal
                    </button>
                    <button
                        className="chart-control-button"
                        onClick={handleFitToScreen}
                        title="Fit Tree to Screen"
                    >
                        Fit Screen
                    </button>
                    <button
                        className="chart-control-button"
                        onClick={handleExpandAll}
                        title="Expand All Nodes"
                    >
                        Expand All
                    </button>
                    <button
                        className="chart-control-button"
                        onClick={handleReset}
                        title="Reset the Network View"
                    >
                        Reset
                    </button>
                    <button
                        className="chart-control-button reset-positions-btn"
                        onClick={handleResetPositions}
                        title="Reset All Manual Positions"
                    >
                        Reset Positions
                    </button>
                </div>
                <div className="family-chart-info">
                    <p>{draggingEnabled
                        ? "Drag cards to reposition. Click to expand network."
                        : "Click on a person to expand their network."}</p>
                </div>
                <div ref={containerRef} className="family-chart-tree"></div>
            </div>
        </div>
    );
};

export default FamilyChartTree;