// addPerson.js
import { createNewPerson } from './api.js';
import { updateChartData } from './chart.js';
import { searchByName } from './api.js';
import { chartData } from './app.js';

// Global state for selected relatives
let selectedRelatives = {
    father: null,
    mother: null,
    spouse: null,
    children: []
};

/**
 * Show the add person form
 */
export function showAddPersonForm() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'add-person-modal';

    // Create form content
    modal.innerHTML = `
    <div class="add-person-header">
      <h2>Add New Person</h2>
      <button class="close-modal-btn">&times;</button>
    </div>
    
    <form id="add-person-form" class="add-person-form">
      <div class="form-columns">
        <div class="form-column">
          <h3>Basic Information</h3>
          
          <div class="form-field">
            <label>First Name <span class="required">*</span></label>
            <input type="text" name="first-name" required>
          </div>
          
          <div class="form-field">
            <label>Last Name <span class="required">*</span></label>
            <input type="text" name="last-name" required>
          </div>
          
          <div class="form-field">
            <label>Gender <span class="required">*</span></label>
            <div class="radio-group">
              <label><input type="radio" name="gender" value="M" checked> Male</label>
              <label><input type="radio" name="gender" value="F"> Female</label>
            </div>
          </div>
          
          <div class="form-field">
            <label>Birthday</label>
            <input type="text" name="birthday" placeholder="YYYY-MM-DD">
          </div>
          
          <div class="form-field">
            <label>Location</label>
            <input type="text" name="location">
          </div>
          
          <div class="form-field">
            <label>Work</label>
            <input type="text" name="work">
          </div>
          
          <div class="form-field">
            <label>Avatar URL</label>
            <input type="text" name="avatar" value="https://static8.depositphotos.com/1009634/988/v/950/depositphotos_9883921-stock-illustration-no-user-profile-picture.jpg">
          </div>
        </div>
        
        <div class="form-column relationships-column">
          <h3>Family Relationships</h3>
          
          <div class="form-field">
            <label>Father</label>
            <div class="relationship-selector" id="father-selector">
              <input type="text" class="relationship-search" data-rel-type="father" placeholder="Search for father...">
              <div class="search-results" data-for="father"></div>
              <div class="selected-relative" data-for="father">
                <p class="no-selection">No father selected</p>
              </div>
            </div>
          </div>
          
          <div class="form-field">
            <label>Mother</label>
            <div class="relationship-selector" id="mother-selector">
              <input type="text" class="relationship-search" data-rel-type="mother" placeholder="Search for mother...">
              <div class="search-results" data-for="mother"></div>
              <div class="selected-relative" data-for="mother">
                <p class="no-selection">No mother selected</p>
              </div>
            </div>
          </div>
          
          <div class="form-field">
            <label>Spouse</label>
            <div class="relationship-selector" id="spouse-selector">
              <input type="text" class="relationship-search" data-rel-type="spouse" placeholder="Search for spouse...">
              <div class="search-results" data-for="spouse"></div>
              <div class="selected-relative" data-for="spouse">
                <p class="no-selection">No spouse selected</p>
              </div>
            </div>
          </div>
          
          <div class="form-field">
            <label>Children</label>
            <div class="relationship-selector" id="children-selector">
              <input type="text" class="relationship-search" data-rel-type="children" placeholder="Search for children...">
              <div class="search-results" data-for="children"></div>
              <div class="selected-relatives" data-for="children">
                <p class="no-selection">No children selected</p>
                <div class="selected-children-list"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="cancel-btn">Cancel</button>
        <button type="submit" class="submit-btn">Create Person</button>
      </div>
    </form>
  `;

    document.body.appendChild(modal);

    // Add event listeners
    setupFormEventListeners(modal);

    // Add animation
    setTimeout(() => {
        backdrop.classList.add('visible');
        modal.classList.add('visible');
    }, 10);
}