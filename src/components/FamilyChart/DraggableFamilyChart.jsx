import React, { useEffect, useRef } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import './FamilyChart.css';

const DraggableFamilyChart = () => {
    const { networkData, selectedPerson, expandNode, resetNetwork } = useNetwork();
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        // Only initialize or update when we have data
        if (!containerRef.current || networkData.length === 0) {
            return;
        }

        // Clean up any existing chart
        if (chartRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Format data for family-chart library
        const formattedData = formatDataForFamilyChart(networkData);

        // Initialize the family chart
        console.log("f3");
        console.dir(window.f3);
        const chart = window.f3.createChart(containerRef.current, formattedData);
        console.log("Configure the Chart: ", f3)
        // Configure the chart
        chart
            .setCardXSpacing(200)
            .setCardYSpacing(120)
            .setCardDisplay([
                datum => `${datum.data["first name"]} ${datum.data["last name"]}`,
                datum => datum.data.location || '',
                datum => datum.data.work || ''
            ])
            .setOrientationVertical()
            .setTransitionTime(1000);

        // Use CardHtml style for richer styling
        const cardHtml = chart.setCard(f3.CardHtml)
            .setStyle('imageCircle')
            .setMiniTree(true)
            .setCardDim({
                w: 220,
                h: 80,
                img_w: 60,
                img_h: 60,
                img_x: 5,
                img_y: 5
            });

        // Set click handler to make the clicked node the main node
        cardHtml.setOnCardClick((_, d) => {
            if (d.data.id !== selectedPerson) {
                expandNode(d.data.id);
            }
        });

        // Configure visual highlighting of related family members
        cardHtml.setOnHoverPathToMain();

        // Update tree
        chart.updateTree();

        // Store chart reference for cleanup
        chartRef.current = chart;

        return () => {
            // Cleanup
            if (chartRef.current) {
                containerRef.current.innerHTML = '';
                chartRef.current = null;
            }
        };
    }, [networkData, selectedPerson, expandNode]);

    // Format networkData to match the family-chart format
    const formatDataForFamilyChart = (data) => {
        console.log("trying to formatDataForFamilyChart ", data);
        return data.map(person => ({
            id: person.id,
            data: person.data,
            rels: {
                father: person.rels.father || null,
                mother: person.rels.mother || null,
                spouses: person.rels.spouses || [],
                children: person.rels.children || []
            }
        }));
    };

    if (networkData.length === 0) {
        return (
            <div className="family-chart-empty">
                <p>Search for a person to view their family tree</p>
            </div>
        );
    }

    return (
        <div className="family-chart-container">
            <div className="family-chart-controls">
                <button
                    className="chart-control-button"
                    onClick={() => chartRef.current?.updateTree()}
                >
                    Recalculate Layout
                </button>
                <button
                    className="chart-control-button"
                    onClick={resetNetwork}
                >
                    Clear Network
                </button>
            </div>
            <div ref={containerRef} className="family-chart" style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default DraggableFamilyChart;