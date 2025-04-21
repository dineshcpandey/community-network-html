// API service functions

const API_BASE_URL = 'http://localhost:5050/api/details';

/**
 * Fetch initial family tree data
 * @returns {Promise<Array>} The initial chart data
 */
export async function fetchInitialData() {
    try {
        const response = await fetch('./data/data2.json');
        if (!response.ok) {
            throw new Error(`Failed to load initial data: ${response.status}`);
        }
        const data = await response.json();
        console.log('Initial data loaded:', data.length, 'items');
        return data;
    } catch (error) {
        console.error('Error fetching initial data:', error);
        throw error;
    }
}

/**
 * Fetch network data for a specific person
 * @param {string} personId - The ID of the person
 * @returns {Promise<Array>} The network data for the person
 */
export async function fetchNetworkData(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/${personId}/network`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        console.log(`API.js Received network data for ID ${personId}:`, data.length, 'items');
        return data;
    } catch (error) {
        console.error('Error fetching network data:', error);
        throw error;
    }
}

/**
 * Search for people by name
 * @param {string} name - Name to search for
 * @returns {Promise<Array>} Search results
 */
export async function searchByName(name) {
    try {
        const response = await fetch(`${API_BASE_URL}/search?name=${encodeURIComponent(name)}`);
        if (!response.ok) {
            throw new Error(`Search API error: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Search results for name "${name}":`, data.length, 'items');
        return data;
    } catch (error) {
        console.error('Error searching by name:', error);
        throw error;
    }
}

/**
 * Search for people by location
 * @param {string} location - Location to search for
 * @returns {Promise<Array>} Search results
 */
export async function searchByLocation(location) {
    try {
        const response = await fetch(`${API_BASE_URL}/search?location=${encodeURIComponent(location)}`);
        if (!response.ok) {
            throw new Error(`Search API error: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Search results for location "${location}":`, data.length, 'items');
        return data;
    } catch (error) {
        console.error('Error searching by location:', error);
        throw error;
    }
}

/**
 * Update person data
 * @param {string} personId - The ID of the person to update
 * @param {Object} personData - The updated person data
 * @returns {Promise<Object>} The updated person data
 */
export async function updatePersonData(personId, personData) {
    try {
        // Format the data according to the API requirements
        const apiPayload = formatPersonDataForApi(personData);

        // Make the PUT request
        const response = await fetch(`${API_BASE_URL}/${personId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            throw new Error(`Update API error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Updated person data for ID ${personId}:`, data);
        return data;
    } catch (error) {
        console.error('Error updating person data:', error);
        throw error;
    }
}

/**
 * Format person data for API
 * @param {Object} personData - The person data from the chart
 * @returns {Object} Formatted data for the API
 */
function formatPersonDataForApi(personData) {
    // Extract person's first and last names
    const firstName = personData.data["first name"] || "";
    const lastName = personData.data["last name"] || "";

    // Create the API payload according to the expected format
    return {
        personname: `${firstName} ${lastName}`.trim(),
        birthdate: personData.data.birthday || null,
        gender: personData.data.gender || "",
        currentlocation: personData.data.location || "",
        fatherid: personData.rels?.father || null,
        motherid: personData.rels?.mother || null,
        spouseid: personData.rels?.spouses?.length > 0 ? personData.rels.spouses[0] : null,
        worksat: personData.data.work || null,
        nativeplace: personData.data.nativePlace || null,
        phone: personData.data.contact?.phone || null,
        mail_id: personData.data.contact?.email || null,
        living: "Y", // Default to living
        data: {
            ...personData.data
        },
        rels: {
            ...personData.rels
        }
    };
}