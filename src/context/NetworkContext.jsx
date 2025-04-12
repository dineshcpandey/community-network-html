import React, { createContext, useState, useContext, useEffect } from 'react';
import { getPersonDetails, getPersonNetwork } from '../api/apiService';

const NetworkContext = createContext();

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [networkData, setNetworkData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    useEffect(() => {
        if (selectedPerson) {
            loadPersonDetails(selectedPerson);
        }
    }, [selectedPerson]);

    const loadPersonDetails = async (personId) => {
        try {
            setLoading(true);
            setError(null);

            const personData = await getPersonDetails(personId);

            if (!expandedNodes.has(personId)) {
                setNetworkData((prevData) => {
                    // If person already exists in the network, update it
                    const existingIndex = prevData.findIndex(p => p.id === personId);
                    if (existingIndex >= 0) {
                        const updatedData = [...prevData];
                        updatedData[existingIndex] = personData;
                        return updatedData;
                    }

                    // Otherwise add to network
                    return [...prevData, personData];
                });
            }

            setSelectedPerson(personId);
        } catch (err) {
            setError(err.message || 'Failed to load person details');
            console.error('Error loading person details:', err);
        } finally {
            setLoading(false);
        }
    };

    const expandNode = async (personId) => {
        if (expandedNodes.has(personId)) return;

        try {
            setLoading(true);
            setError(null);

            const networkRelations = await getPersonNetwork(personId);

            setNetworkData((prevData) => {
                // Add new relations to network, avoid duplicates
                const existingIds = new Set(prevData.map(p => p.id));
                const newRelations = networkRelations.filter(p => !existingIds.has(p.id));

                return [...prevData, ...newRelations];
            });

            setExpandedNodes(prev => new Set([...prev, personId]));
        } catch (err) {
            setError(err.message || 'Failed to expand network');
            console.error('Error expanding network:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetNetwork = () => {
        setNetworkData([]);
        setSelectedPerson(null);
        setExpandedNodes(new Set());
    };

    const addPersonToNetwork = (personData) => {
        setNetworkData(prevData => [...prevData, personData]);
    };

    const updatePersonInNetwork = (personId, personData) => {
        setNetworkData(prevData =>
            prevData.map(person =>
                person.id === personId ? { ...person, ...personData } : person
            )
        );
    };

    return (
        <NetworkContext.Provider
            value={{
                selectedPerson,
                networkData,
                loading,
                error,
                expandedNodes,
                setSelectedPerson,
                loadPersonDetails,
                expandNode,
                resetNetwork,
                addPersonToNetwork,
                updatePersonInNetwork
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
};

export default NetworkContext;