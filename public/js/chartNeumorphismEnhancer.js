/**
 * Neumorphism Chart Enhancer
 * Applies neumorphic styling to family-chart elements
 */

export class ChartNeumorphismEnhancer {
    constructor() {
        this.isEnhanced = false;
        this.observers = [];
    }

    /**
     * Apply neumorphism to chart elements
     */
    enhanceChart() {
        const chartContainer = d3.select('#chart');
        
        if (chartContainer.empty()) {
            console.warn('Chart container not found for neumorphism enhancement');
            return;
        }

        // Apply base classes
        this.applyNodeEnhancements(chartContainer);
        this.applyConnectionEnhancements(chartContainer);
        this.setupInteractions(chartContainer);
        this.setupMutationObserver();
        
        this.isEnhanced = true;
        console.log('Neumorphism enhancements applied to chart');
    }

    /**
     * Apply styling to person nodes with advanced features
     */
    applyNodeEnhancements(container) {
        // Target multiple possible selectors for family-chart nodes
        const nodeSelectors = [
            '.person-node',
            '[data-d3fc-group="person"] .node',
            '.node',
            '.f3-node',
            'g.node'
        ];

        nodeSelectors.forEach(selector => {
            container.selectAll(selector)
                .each(function(d, i) {
                    const node = d3.select(this);
                    
                    // Add neumorphic classes
                    node.classed('neu-surface', true);
                    node.classed('neu-hover', true);
                    
                    // Set gender data attribute for styling
                    if (d && d.data) {
                        const gender = d.data.gender || d.data.Gender;
                        if (gender) {
                            node.attr('data-gender', gender);
                        }
                        
                        // Mark root node if it's the main person
                        if (d.data.isRoot || d.data.main || d.id === '1') {
                            node.classed('root', true);
                        }
                        
                        // Add loading class for nodes without complete data
                        if (!d.data.avatar && !d.data.photo) {
                            node.classed('loading', false); // Remove loading if no image expected
                        }
                    }
                    
                    // Add entrance animation for new nodes
                    if (node.classed('new-node')) {
                        node.classed('new', true);
                        // Remove the new class after animation
                        setTimeout(() => {
                            node.classed('new', false);
                        }, 600);
                    }
                    
                    // Enhance avatar if present
                    const avatar = node.select('img');
                    if (!avatar.empty()) {
                        avatar.classed('neu-avatar', true);
                        
                        // Handle avatar loading states
                        avatar.on('load', function() {
                            node.classed('loading', false);
                        });
                        
                        avatar.on('error', function() {
                            node.classed('error', true);
                            console.warn('Failed to load avatar for node:', d?.id);
                        });
                    }
                    
                    // Enhance text elements
                    const nameElement = node.select('.name, .person-name');
                    if (!nameElement.empty()) {
                        nameElement.classed('neu-text-shadow', true);
                    }
                    
                    // Add tabindex for accessibility
                    node.attr('tabindex', 0);
                });
        });
    }

    /**
     * Apply styling to connection lines
     */
    applyConnectionEnhancements(container) {
        const connectionSelectors = [
            '.link',
            'path.link',
            '.connection',
            'path.f3-link'
        ];

        connectionSelectors.forEach(selector => {
            container.selectAll(selector)
                .classed('neu-connection', true);
        });
    }

    /**
     * Setup enhanced interactions with advanced feedback
     */
    setupInteractions(container) {
        const nodeSelectors = [
            '.person-node',
            '[data-d3fc-group="person"] .node',
            '.node',
            '.f3-node'
        ];

        nodeSelectors.forEach(selector => {
            container.selectAll(selector)
                .on('mouseenter.neu', function(event, d) {
                    const node = d3.select(this);
                    node.classed('neu-hover-active', true);
                    
                    // Add enhanced glow effect with color coding
                    const gender = d?.data?.gender || d?.data?.Gender;
                    let glowColor = 'rgba(102, 126, 234, 0.3)'; // default blue
                    
                    if (gender === 'F' || gender === 'Female') {
                        glowColor = 'rgba(240, 147, 251, 0.3)'; // pink
                    } else if (gender === 'M' || gender === 'Male') {
                        glowColor = 'rgba(79, 172, 254, 0.3)'; // blue
                    }
                    
                    node.style('filter', `drop-shadow(0 0 12px ${glowColor})`);
                    
                    // Highlight connected relationships
                    this.highlightConnectedNodes(d, container);
                }.bind(this))
                .on('mouseleave.neu', function(event, d) {
                    const node = d3.select(this);
                    node.classed('neu-hover-active', false);
                    
                    // Remove glow effect
                    node.style('filter', null);
                    
                    // Remove relationship highlights
                    this.removeHighlights(container);
                }.bind(this))
                .on('click.neu', function(event, d) {
                    // Handle selection state with animation
                    container.selectAll('.node, .person-node')
                        .classed('selected', false);
                    
                    const selectedNode = d3.select(this);
                    selectedNode.classed('selected', true);
                    
                    // Add selection animation
                    selectedNode.transition()
                        .duration(200)
                        .style('transform', 'scale(1.02)')
                        .transition()
                        .duration(200)
                        .style('transform', 'scale(1)');
                    
                    // Update selected node info
                    this.updateSelectedNodeInfo(d);
                    
                    // Announce for screen readers
                    this.announceSelection(d);
                }.bind(this))
                .on('keydown.neu', function(event, d) {
                    // Handle keyboard navigation
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        d3.select(this).dispatch('click');
                    }
                }.bind(this));
        });
    }

    /**
     * Highlight connected nodes and relationships
     */
    highlightConnectedNodes(selectedData, container) {
        if (!selectedData || !selectedData.data) return;
        
        const selectedId = selectedData.id;
        const relationships = selectedData.data.rels || {};
        
        // Get connected node IDs
        const connectedIds = new Set();
        Object.values(relationships).forEach(rel => {
            if (Array.isArray(rel)) {
                rel.forEach(id => connectedIds.add(id));
            } else if (rel) {
                connectedIds.add(rel);
            }
        });
        
        // Highlight connected nodes
        container.selectAll('.node, .person-node')
            .style('opacity', function(d) {
                const nodeId = d?.id || d?.data?.id;
                return connectedIds.has(nodeId) || nodeId === selectedId ? 1 : 0.4;
            });
        
        // Highlight connection lines
        container.selectAll('.link, path.link')
            .style('opacity', 0.2)
            .filter(function(d) {
                return d && (
                    connectedIds.has(d.source?.id) || 
                    connectedIds.has(d.target?.id) ||
                    d.source?.id === selectedId ||
                    d.target?.id === selectedId
                );
            })
            .style('opacity', 1)
            .style('stroke-width', '4px');
    }

    /**
     * Remove all highlights
     */
    removeHighlights(container) {
        container.selectAll('.node, .person-node')
            .style('opacity', 1);
        
        container.selectAll('.link, path.link')
            .style('opacity', 0.8)
            .style('stroke-width', null);
    }

    /**
     * Announce selection for accessibility
     */
    announceSelection(nodeData) {
        if (!nodeData || !nodeData.data) return;
        
        const name = nodeData.data.label || 
                    `${nodeData.data['first name'] || ''} ${nodeData.data['last name'] || ''}`.trim() ||
                    nodeData.data.personname || 
                    'Unknown person';
        
        // Create or update screen reader announcement
        let announcer = document.getElementById('sr-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.position = 'absolute';
            announcer.style.left = '-10000px';
            announcer.style.width = '1px';
            announcer.style.height = '1px';
            announcer.style.overflow = 'hidden';
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = `Selected ${name}`;
    }

    /**
     * Setup mutation observer to catch dynamically added nodes
     */
    setupMutationObserver() {
        const chartElement = document.querySelector('#chart');
        if (!chartElement) return;

        const observer = new MutationObserver((mutations) => {
            let shouldRefresh = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node contains chart elements
                            const hasChartElements = node.querySelector && (
                                node.querySelector('.node') ||
                                node.querySelector('.person-node') ||
                                node.querySelector('.link')
                            );
                            
                            if (hasChartElements || node.classList?.contains('node')) {
                                shouldRefresh = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldRefresh) {
                // Debounce refresh calls
                clearTimeout(this.refreshTimeout);
                this.refreshTimeout = setTimeout(() => {
                    this.refresh();
                }, 100);
            }
        });

        observer.observe(chartElement, {
            childList: true,
            subtree: true
        });

        this.observers.push(observer);
    }

    /**
     * Update selected node information display
     */
    updateSelectedNodeInfo(nodeData) {
        const infoElement = document.getElementById('selectedNodeInfo');
        const nameElement = document.getElementById('selectedNodeName');
        
        if (!infoElement || !nameElement) return;

        if (nodeData && nodeData.data) {
            const data = nodeData.data;
            const name = data.label || data['first name'] + ' ' + data['last name'] || data.personname || 'Unknown';
            const id = nodeData.id || data.id || 'Unknown';
            
            nameElement.textContent = `${name} (ID: ${id})`;
            infoElement.style.display = 'block';
        } else {
            infoElement.style.display = 'none';
        }
    }

    /**
     * Refresh enhancements after chart update
     */
    refresh() {
        if (this.isEnhanced) {
            // Wait for DOM updates to complete
            setTimeout(() => {
                console.log('Refreshing neumorphism enhancements...');
                this.enhanceChart();
            }, 150);
        }
    }

    /**
     * Force immediate enhancement
     */
    forceEnhance() {
        console.log('Force enhancing chart with neumorphism...');
        this.enhanceChart();
    }

    /**
     * Destroy enhancer and clean up observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.isEnhanced = false;
        
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }
    }
}

// Create and export global instance
export const chartEnhancer = new ChartNeumorphismEnhancer();

// Auto-enhance when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            chartEnhancer.enhanceChart();
        }, 1000);
    });
} else {
    // DOM already loaded
    setTimeout(() => {
        chartEnhancer.enhanceChart();
    }, 500);
}
