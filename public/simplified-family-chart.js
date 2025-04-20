/**
 * Simplified Family Chart Library
 * A lightweight version of family-chart.js specific to this application
 */

(function (global) {
    // Define the f3 namespace if it doesn't exist
    if (typeof global.f3 !== 'undefined') {
        console.log('Family Chart library already loaded');
        return;
    }

    // Ensure D3 is available
    if (typeof d3 === 'undefined') {
        console.error('D3.js is required for family-chart to work');

        // Create minimal non-functional placeholders to prevent crashes
        global.f3 = createMinimalFallbackApi();
        return;
    }

    // Create the family chart API
    global.f3 = {
        createChart: createChart,
        CardHtml: { is_html: true }
    };

    // Function to create a chart
    function createChart(container, data) {
        console.log('Creating family chart with simplified implementation');

        // Get the container element
        const cont = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!cont) {
            console.error('Container not found');
            return createMinimalAPI();
        }

        // Create the DOM structure
        setupDOM(cont);

        // Initialize state
        const state = {
            data: data || [],
            mainId: data && data.length > 0 ? data[0].id : null,
            cardYSpacing: 120,
            cardXSpacing: 200,
            transitionTime: 800,
            orientation: 'vertical',
            cardDisplay: [d => `${d['first name'] || ''} ${d['last name'] || ''}`.trim()],
            cardStyle: 'default',
            cardDim: {
                w: 220,
                h: 80,
                text_x: 80,
                text_y: 20,
                img_w: 60,
                img_h: 60,
                img_x: 10,
                img_y: 10
            },
            miniTree: true,
            onCardClick: function (e, d) {
                if (d && d.data && d.data.id) {
                    state.mainId = d.data.id;
                    renderChart();
                }
            }
        };

        // Set up rendering
        const renderChart = function () {
            // Clear previous cards
            const cardsView = cont.querySelector('.cards_view');
            if (cardsView) {
                cardsView.innerHTML = '';
            }

            // Render cards for simplified view
            renderCards(cardsView, state);
        };

        // Define the API for method chaining
        const api = {
            setCardYSpacing: function (spacing) {
                state.cardYSpacing = spacing;
                return this;
            },
            setCardXSpacing: function (spacing) {
                state.cardXSpacing = spacing;
                return this;
            },
            setOrientationVertical: function () {
                state.orientation = 'vertical';
                return this;
            },
            setOrientationHorizontal: function () {
                state.orientation = 'horizontal';
                return this;
            },
            setTransitionTime: function (time) {
                state.transitionTime = time;
                return this;
            },
            updateMainId: function (id) {
                state.mainId = id;
                return this;
            },
            setCard: function (cardType) {
                // This would normally set the card type (SVG or HTML)
                // For our simplified version, just return the card API
                return {
                    setStyle: function (style) {
                        state.cardStyle = style;
                        return this;
                    },
                    setMiniTree: function (enabled) {
                        state.miniTree = enabled;
                        return this;
                    },
                    setCardDim: function (dim) {
                        Object.assign(state.cardDim, dim);
                        return this;
                    },
                    setOnCardClick: function (callback) {
                        state.onCardClick = callback;
                        return this;
                    },
                    setCardDisplay: function (displayFns) {
                        state.cardDisplay = Array.isArray(displayFns) ? displayFns : [displayFns];
                        return this;
                    },
                    setOnHoverPathToMain: function () {
                        // This would set up hover path highlighting
                        // Simplified version doesn't implement this
                        return this;
                    }
                };
            },
            updateTree: function (options) {
                // Render the chart
                renderChart();
                return this;
            }
        };

        return api;
    }

    // Set up the DOM structure for the chart
    function setupDOM(container) {
        // Create the main canvas element if it doesn't exist
        let f3Canvas = container.querySelector('#f3Canvas');
        if (!f3Canvas) {
            f3Canvas = document.createElement('div');
            f3Canvas.id = 'f3Canvas';
            f3Canvas.style.position = 'relative';
            f3Canvas.style.width = '100%';
            f3Canvas.style.height = '100%';
            f3Canvas.style.overflow = 'hidden';

            // Create the SVG for links
            const svgHtml = `
        <svg class="main_svg" width="100%" height="100%">
          <g class="view">
            <g class="links_view"></g>
          </g>
        </svg>
      `;

            f3Canvas.innerHTML = svgHtml;

            // Create the HTML layer for cards
            const htmlLayer = document.createElement('div');
            htmlLayer.id = 'htmlSvg';
            htmlLayer.style.position = 'absolute';
            htmlLayer.style.width = '100%';
            htmlLayer.style.height = '100%';
            htmlLayer.style.zIndex = '2';
            htmlLayer.style.top = '0';
            htmlLayer.style.left = '0';

            const cardsView = document.createElement('div');
            cardsView.className = 'cards_view';
            cardsView.style.transformOrigin = '0 0';

            htmlLayer.appendChild(cardsView);
            f3Canvas.appendChild(htmlLayer);

            container.appendChild(f3Canvas);
        }
    }

    // Render cards for the simplified implementation
    function renderCards(container, state) {
        if (!container || !state.data || state.data.length === 0) return;

        // Find the main person
        const mainPerson = state.data.find(d => d.id === state.mainId) || state.data[0];

        // Add a simplified notice
        const notice = document.createElement('div');
        notice.style.position = 'absolute';
        notice.style.top = '10px';
        notice.style.left = '10px';
        notice.style.padding = '10px';
        notice.style.background = 'rgba(255,255,255,0.8)';
        notice.style.borderRadius = '4px';
        notice.style.zIndex = '100';
        notice.style.fontSize = '12px';
        notice.style.color = '#4a5568';
        notice.innerHTML = 'Using simplified family chart view';
        container.appendChild(notice);

        // Create flexbox layout for cards
        const cardsContainer = document.createElement('div');
        cardsContainer.style.display = 'flex';
        cardsContainer.style.flexWrap = 'wrap';
        cardsContainer.style.justifyContent = 'center';
        cardsContainer.style.padding = '60px 20px 20px 20px';
        cardsContainer.style.gap = '20px';
        container.appendChild(cardsContainer);

        // Start with the main person and direct connections
        const directConnections = getDirectConnections(mainPerson, state.data);
        const displayData = [mainPerson, ...directConnections];

        // Render all cards
        displayData.forEach(person => {
            // Create card
            const card = createPersonCard(person, state);
            cardsContainer.appendChild(card);

            // Add click handler
            card.addEventListener('click', (e) => {
                if (state.onCardClick) {
                    state.onCardClick(e, { data: person });
                }
            });
        });
    }

    // Get direct connections to a person
    function getDirectConnections(person, allData) {
        if (!person || !allData) return [];

        const connections = [];
        const relationIds = new Set();

        // Add father
        if (person.rels && person.rels.father) {
            relationIds.add(person.rels.father);
        }

        // Add mother
        if (person.rels && person.rels.mother) {
            relationIds.add(person.rels.mother);
        }

        // Add spouses
        if (person.rels && person.rels.spouses) {
            if (Array.isArray(person.rels.spouses)) {
                person.rels.spouses.forEach(id => relationIds.add(id));
            } else {
                relationIds.add(person.rels.spouses);
            }
        }

        // Add children
        if (person.rels && person.rels.children) {
            if (Array.isArray(person.rels.children)) {
                person.rels.children.forEach(id => relationIds.add(id));
            } else {
                relationIds.add(person.rels.children);
            }
        }

        // Find the related people in the data
        relationIds.forEach(id => {
            const related = allData.find(d => d.id === id);
            if (related) {
                connections.push(related);
            }
        });

        return connections;
    }

    // Create a card for a person
    function createPersonCard(person, state) {
        const card = document.createElement('div');
        card.className = `card ${person.data.gender === 'M' ? 'card-male' : 'card-female'}`;
        card.style.width = `${state.cardDim.w}px`;
        card.style.backgroundColor = person.data.gender === 'M' ? '#4361ee' : '#f72585';
        card.style.borderRadius = '8px';
        card.style.overflow = 'hidden';
        card.style.color = 'white';
        card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

        // Highlight the main person
        if (person.id === state.mainId) {
            card.style.boxShadow = '0 0 0 3px white, 0 4px 10px rgba(0, 0, 0, 0.3)';
        }

        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.2)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = person.id === state.mainId
                ? '0 0 0 3px white, 0 4px 10px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px rgba(0, 0, 0, 0.1)';
        });

        // Create the card inner container
        const cardInner = document.createElement('div');
        cardInner.className = `card-inner card-${state.cardStyle || 'default'}`;
        cardInner.style.display = 'flex';
        cardInner.style.padding = '15px';

        // Add avatar
        const avatar = document.createElement('div');
        avatar.style.flexShrink = '0';
        avatar.style.marginRight = '15px';

        const img = document.createElement('img');
        img.src = person.data.avatar || "https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg";
        img.alt = `${person.data['first name'] || ''} ${person.data['last name'] || ''}`.trim();
        img.style.width = `${state.cardDim.img_w}px`;
        img.style.height = `${state.cardDim.img_h}px`;
        img.style.borderRadius = state.cardStyle === 'imageCircle' ? '50%' : '4px';
        img.style.objectFit = 'cover';
        img.style.border = '2px solid rgba(255, 255, 255, 0.7)';

        avatar.appendChild(img);
        cardInner.appendChild(avatar);

        // Add text content
        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.overflow = 'hidden';

        // Apply card display functions
        state.cardDisplay.forEach((displayFn, index) => {
            const text = displayFn(person.data);
            if (!text) return;

            const textDiv = document.createElement('div');
            textDiv.textContent = text;
            textDiv.style.overflow = 'hidden';
            textDiv.style.textOverflow = 'ellipsis';
            textDiv.style.whiteSpace = 'nowrap';

            // Style the first item as a title
            if (index === 0) {
                textDiv.style.fontWeight = 'bold';
                textDiv.style.fontSize = '16px';
                textDiv.style.marginBottom = '5px';
            } else {
                textDiv.style.fontSize = '12px';
                textDiv.style.marginBottom = '2px';
            }

            content.appendChild(textDiv);
        });

        cardInner.appendChild(content);
        card.appendChild(cardInner);

        // Add relationship info if it's not the main person
        if (person.id !== state.mainId) {
            const relationshipInfo = document.createElement('div');
            relationshipInfo.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';
            relationshipInfo.style.padding = '8px 15px';
            relationshipInfo.style.fontSize = '12px';

            // Determine relationship to main person
            const relationship = determineRelationship(person, state.data.find(d => d.id === state.mainId));
            relationshipInfo.textContent = relationship;

            card.appendChild(relationshipInfo);
        }

        return card;
    }

    // Determine relationship between two people
    function determineRelationship(person, mainPerson) {
        if (!person || !mainPerson) return 'Unknown relationship';

        // Check if person is parent of main person
        if (mainPerson.rels.father === person.id) {
            return 'Father';
        }

        if (mainPerson.rels.mother === person.id) {
            return 'Mother';
        }

        // Check if person is child of main person
        const mainPersonChildren = Array.isArray(mainPerson.rels.children)
            ? mainPerson.rels.children
            : (mainPerson.rels.children ? [mainPerson.rels.children] : []);

        if (mainPersonChildren.includes(person.id)) {
            return person.data.gender === 'M' ? 'Son' : 'Daughter';
        }

        // Check if person is spouse of main person
        const mainPersonSpouses = Array.isArray(mainPerson.rels.spouses)
            ? mainPerson.rels.spouses
            : (mainPerson.rels.spouses ? [mainPerson.rels.spouses] : []);

        if (mainPersonSpouses.includes(person.id)) {
            return person.data.gender === 'M' ? 'Husband' : 'Wife';
        }

        return 'Extended family';
    }

    // Create a minimal fallback API that doesn't crash
    function createMinimalFallbackApi() {
        // This creates a non-functional but safe API for when D3 is missing
        const dummyFunction = function () { return this; };
        const dummyObject = {
            setStyle: dummyFunction, setMiniTree: dummyFunction,
            setCardDim: dummyFunction, setOnCardClick: dummyFunction,
            setCardDisplay: dummyFunction, setOnHoverPathToMain: dummyFunction
        };

        return {
            createChart: function () {
                console.error('Family Chart cannot function without D3.js');
                return {
                    setCardXSpacing: dummyFunction, setCardYSpacing: dummyFunction,
                    setCardDisplay: dummyFunction, setOrientationVertical: dummyFunction,
                    setOrientationHorizontal: dummyFunction, setTransitionTime: dummyFunction,
                    updateMainId: dummyFunction, setCard: function () { return dummyObject; },
                    updateTree: dummyFunction
                };
            },
            CardHtml: { is_html: true }
        };
    }

    // Minimal API for when container is not found
    function createMinimalAPI() {
        const dummyFunction = function () { return this; };
        const dummyObject = {
            setStyle: dummyFunction, setMiniTree: dummyFunction,
            setCardDim: dummyFunction, setOnCardClick: dummyFunction,
            setCardDisplay: dummyFunction, setOnHoverPathToMain: dummyFunction
        };

        return {
            setCardXSpacing: dummyFunction, setCardYSpacing: dummyFunction,
            setCardDisplay: dummyFunction, setOrientationVertical: dummyFunction,
            setOrientationHorizontal: dummyFunction, setTransitionTime: dummyFunction,
            updateMainId: dummyFunction, setCard: function () { return dummyObject; },
            updateTree: dummyFunction
        };
    }

})(typeof window !== 'undefined' ? window : this);

// Log when the script has loaded
console.log('Simplified family-chart.js loaded successfully');