import React, { useState } from 'react';
import { NetworkProvider } from './context/NetworkContext';
import SearchComponent from './components/Search/SearchComponent';
import NetworkDiagram from './components/NetworkDiagram/NetworkDiagram';
import AddMemberForm from './components/AddMember/AddMemberForm';
import './App.css';

function App() {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <NetworkProvider>
            <div className="app-container">
                <header className="app-header">
                    <h1>Community Network</h1>
                    <button
                        className="add-member-button"
                        onClick={() => setShowAddForm(true)}
                    >
                        Add New Member
                    </button>
                </header>

                <main className="app-main">
                    <div className="search-section">
                        <SearchComponent />
                    </div>

                    <div className="network-section">
                        <NetworkDiagram />
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
                    <p>Community Network Visualization - {new Date().getFullYear()}</p>
                </footer>
            </div>
        </NetworkProvider>
    );
}

export default App;