import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import {
    ensureFamilyChartLoaded,
    convertNetworkDataToFamilyChart,
    createCardDisplay
} from '../../utils/familyChartUtils';
import './FamilyChartTree.css';
const FamilyChartTree = () => {
    const containerRef = useRef(null);
    const { networkData, selectedPerson, expandNode, resetNetwork } = useNetwork();
    const chartRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [draggingEnabled, setDraggingEnabled] = useState(true);
    const [containerMounted, setContainerMounted] = useState(false);

    // Add a check for when the ref is mounted
    useEffect(() => {
        if (containerRef.current) {
            console.log("Container ref is now available");
            setContainerMounted(true);
        } else {
            console.log("Container ref is not available yet");
        }
    }, []);

    // Add this at the top of your component
    console.log("FamilyChartTree component rendering/re-rendering");

    // Add this useEffect
    useEffect(() => {
        console.log("Component mounted");

        // Log container existence immediately
        console.log("Container exists immediately?", containerRef.current !== null);

        // Check again after a short delay
        setTimeout(() => {
            console.log("Container exists after timeout?", containerRef.current !== null);
            if (containerRef.current) {
                console.log("Container dimensions:", {
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        }, 500);

        return () => {
            console.log("Component unmounting");
        };
    }, []);



    // Enable or disable dragging on nodes - wrapped in useCallback
    const enableNodeDragging = useCallback((f3) => {
        if (!containerRef.current || !chartRef.current) {
            console.log("Cannot enable dragging - container or chart ref not available");
            return;
        }

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




    // Create and setup the family chart - this will run whenever containerMounted changes
    useEffect(() => {
        if (!containerRef.current || !containerMounted) {
            console.log("Container is not yet mounted or ref is not available");
            return;
        }

        console.log("Container is mounted, proceeding with chart creation");

        // Load family chart library
        setIsLoading(true);
        ensureFamilyChartLoaded()
            .then(f3 => {
                setError(null);
                console.log("Family chart library loaded");

                // If no data, don't initialize the chart
                if (networkData.length === 0) {
                    console.log("No network data available");
                    setIsLoading(false);
                    return;
                }

                try {
                    // Clear container first
                    console.log("Clearing container content");
                    containerRef.current.innerHTML = '';

                    // Transform network data to format expected by family-chart
                    console.log("Converting network data format");
                    const formattedData = convertNetworkDataToFamilyChart(networkData, selectedPerson);

                    // Create family chart
                    console.log("Creating family chart");
                    const chart = f3.createChart(containerRef.current, formattedData);
                    console.log("Creating family chart 2 ", containerRef.current);
                    console.dir(chart);

                    // Configure chart
                    chart
                        .setCardYSpacing(120)
                        .setCardXSpacing(200)
                        .setOrientationVertical()
                        .setTransitionTime(800)
                        .setAfterUpdate((event) => {
                            // After chart updates, we can add drag behavior
                            console.log("Chart updated, applying drag behavior");
                            if (draggingEnabled) {
                                enableNodeDragging(f3);
                            }
                        });

                    // Configure card display
                    console.log("Configuring card display");
                    console.dir(chart);
                    console.log("ChartRef::::::::::::::::");
                    console.dir(chartRef);
                    console.log("Now the containerRef");
                    console.dir(containerRef);
                    const cardSvg = f3.CardSvg(containerRef.current, chart.store);
                    cardSvg.setCardDisplay(createCardDisplay());
                    console.dir("on Line 252 checing the containerRef ", containerRef);

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
                    console.log("Updating tree with initial view");
                    console.dir(chartRef);
                    console.log("ChartRef.current ", chartRef.current);
                    console.dir(chart);
                    console.log("=========================================");
                    try {
                        chart.updateTree({ initial: true });
                    } catch (err) {
                        console.error("ERRRR something happened ", err);
                    }


                    // Add drag behavior
                    // if (draggingEnabled) {
                    //     console.log("Enabling initial drag behavior");
                    //     enableNodeDragging(f3);
                    // }

                    // Store reference to chart
                    chartRef.current = chart;
                    console.log("Chart creation completed successfully");
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
    }, [networkData, selectedPerson, expandNode, draggingEnabled, enableNodeDragging, containerMounted]); // Added containerMounted dependency






    useEffect(() => {
        console.log("Simple component mounted");
        console.log("Container ref:", containerRef.current);
    }, []);

    return (
        <div style={{ padding: '20px', border: '5px solid red', minHeight: '300px' }}>
            <h2>Family Chart Tree</h2>
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    border: '2px dashed #333'
                }}
            >
                Container for chart
            </div>
        </div>
    );










};

export default FamilyChartTree;