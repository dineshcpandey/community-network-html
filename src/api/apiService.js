import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
console.log("The URL BEING READ IS : ", API_BASE_URL);
export const searchPeople = async (query) => {
    try {
        const response = await apiClient.get(`/details/search?name=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('Error searching people:', error);
        throw error;
    }
};

export const searchByLocation = async (location) => {
    try {
        const response = await apiClient.get(`/details/search?location=${encodeURIComponent(location)}`);
        return response.data;
    } catch (error) {
        console.error('Error searching by location:', error);
        throw error;
    }
};

export const getPersonDetails = async (personId) => {
    try {
        const response = await apiClient.get(`/details/${personId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching person details for ID ${personId}:`, error);
        throw error;
    }
};

export const getPersonNetwork = async (personId) => {
    try {
        const response = await apiClient.get(`/details/${personId}/network`);

        // Log the received network data to help with debugging
        console.log(`Network data for person ID ${personId}:`, response.data);

        return response.data;
    } catch (error) {
        console.error(`Error fetching network for person ID ${personId}:`, error);
        throw error;
    }
};

export const addNewPerson = async (personData) => {
    try {
        const response = await apiClient.post('/details/add', personData);
        return response.data;
    } catch (error) {
        console.error('Error adding new person:', error);
        throw error;
    }
};

export const updatePerson = async (personId, personData) => {
    try {
        const response = await apiClient.put(`/details/${personId}`, personData);
        return response.data;
    } catch (error) {
        console.error(`Error updating person ID ${personId}:`, error);
        throw error;
    }
};

const apiService = {
    searchPeople,
    searchByLocation,
    getPersonDetails,
    getPersonNetwork,
    addNewPerson,
    updatePerson,
};

export default apiService;