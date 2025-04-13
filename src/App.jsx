import React, { useState } from 'react';
import { NetworkProvider } from './context/NetworkContext';
import SearchComponent from './components/Search/SearchComponent';
import FamilyChart from './components/FamilyChart/FamilyChart';
import FamilyChartTree from './components/FamilyChart/FamilyChartTree';
import AddMemberForm from './components/AddMember/AddMemberForm';
import './App.css';

function App() {
    const [showAddForm, setShowAddForm] = useState(false);
    const [visualizationType, setVisualizationType] = useState('default'); // 'default' or 'family-chart'

    return (
        <NetworkProvider>
            <div className="app-container">
                <header className="app-header">
                    <h1>Family Tree Network</h1>
                    <div className="app-header-actions">
                        <div className="visualization-toggle">
                            <button
                                className={`toggle-button ${visualizationType === 'default' ? 'active' : ''}`}
                                onClick={() => setVisualizationType('default')}
                            >
                                Default View
                            </button>
                            <button
                                className={`toggle-button ${visualizationType === 'family-chart' ? 'active' : ''}`}
                                onClick={() => setVisualizationType('family-chart')}
                            >
                                Family Chart View
                            </button>
                        </div>
                        <button
                            className="add-member-button"
                            onClick={() => setShowAddForm(true)}
                        >
                            Add New Member
                        </button>
                    </div>
                </header>

                <main className="app-main">
                    <div className="search-section">
                        <SearchComponent />
                    </div>

                    <div className="network-section">
                        {visualizationType === 'default' ? (
                            <FamilyChart />
                        ) : (
                            <FamilyChartTree />
                        )}
                    </div>

                    {showAddForm && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <AddMemberForm onClose={() => setShowAddForm(false)} />
                            </div>
                        </div>
                    )}
                </main>

                <footer className="app-footer">
                    <p>Family Tree Visualization - {new Date().getFullYear()}</p>
                </footer>
            </div>
        </NetworkProvider>
    );
}

export default App;