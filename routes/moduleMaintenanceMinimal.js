// Minimal Module Maintenance - Debug Version
let modules = [];
let currentIndex = 0;

console.log('JavaScript file loaded at:', new Date().toLocaleTimeString());

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM loaded, starting initialization...');
  startApp();
});

function startApp() {
  console.log('Starting app...');

  // Hide loading message
  const loading = document.getElementById('loadingMessage');
  if (loading) {
    loading.style.display = 'none';
    console.log('✓ Loading message hidden');
  } else {
    console.log('✗ Loading message element not found');
  }

  // Show form section
  const form = document.getElementById('formSection');
  if (form) {
    form.style.display = 'block';
    console.log('✓ Form section shown');
  } else {
    console.log('✗ Form section element not found');
  }

  // Load data from API
  loadData();
}

async function loadData() {
  console.log('Loading data from API...');

  try {
    const response = await fetch('/api/module-maintenance/modules');
    console.log('API response:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    modules = await response.json();
    console.log('✓ Modules loaded:', modules.length);
    console.log('First 3 modules:', modules.slice(0, 3));

    if (modules.length > 0) {
      setupButtons();
      showRecord();
    }

  } catch (error) {
    console.error('✗ Error loading data:', error);
    showError('Failed to load module data: ' + error.message);
  }
}

function setupButtons() {
  console.log('Setting up all buttons...');

  // Navigation buttons
  const navButtons = {
    'firstBtn': () => { console.log('First clicked'); goToRecord(0); },
    'prevBtn': () => { console.log('Prev clicked'); goToRecord(currentIndex - 1); },
    'nextBtn': () => { console.log('Next clicked'); goToRecord(currentIndex + 1); },
    'lastBtn': () => { console.log('Last clicked'); goToRecord(modules.length - 1); },
    'requeryBtn': () => { console.log('Requery clicked'); loadData(); }
  };

  // Action buttons
  const actionButtons = {
    'updateBtn': updateRecord,
    'deleteBtn': deleteRecord,
    'newBtn': newRecord,
    'insertBtn': insertRecord,
    'cancelBtn': cancelAction,
    'listViewBtn': showListView,
    'applyBtn': applyFilter
  };

  // Setup navigation buttons
  let navCount = 0;
  for (let id in navButtons) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = navButtons[id];
      navCount++;
      console.log(`✓ Nav button ${id} setup`);
    } else {
      console.log(`✗ Nav button ${id} not found`);
    }
  }

  // Setup action buttons
  let actionCount = 0;
  for (let id in actionButtons) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = actionButtons[id];
      actionCount++;
      console.log(`✓ Action button ${id} setup`);
    } else {
      console.log(`✗ Action button ${id} not found`);
    }
  }

  // Setup list view buttons (just the navigation ones)
  const listButtons = {
    'listFirstBtn': () => { /* List view navigation - to be implemented */ },
    'listPrevBtn': () => { /* List view navigation - to be implemented */ },
    'listNextBtn': () => { /* List view navigation - to be implemented */ },
    'listLastBtn': () => { /* List view navigation - to be implemented */ },
    'listRequeryBtn': () => { loadData(); populateModuleList(); }
  };

  let listCount = 0;
  for (let id in listButtons) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.onclick = listButtons[id];
      listCount++;
      console.log(`✓ List button ${id} setup`);
    } else {
      console.log(`✗ List button ${id} not found`);
    }
  }

  console.log(`Total buttons setup: ${navCount + actionCount + listCount} (${navCount} nav + ${actionCount} action + ${listCount} list)`);

  // Set initial mode
  setMode('Edit');
}

function goToRecord(index) {
  console.log(`Going to record ${index}`);

  if (index < 0) {
    console.log('Cannot go before first record');
    return;
  }
  if (index >= modules.length) {
    console.log('Cannot go after last record');
    return;
  }

  currentIndex = index;
  showRecord();
}

function showRecord() {
  if (!modules || modules.length === 0) {
    console.log('No modules to display');
    // Clear form fields
    setFieldValue('ModuleID', '');
    setFieldValue('ModuleNo', '');
    setFieldValue('Description', '');
    setElementText('recordNumber', '0');
    setElementText('statusMessage', 'No modules available');
    return;
  }

  // Safety check: ensure currentIndex is valid
  if (currentIndex < 0 || currentIndex >= modules.length) {
    console.log(`Invalid currentIndex ${currentIndex}, adjusting to 0`);
    currentIndex = 0;
  }

  const module = modules[currentIndex];
  if (!module) {
    console.error(`Module at index ${currentIndex} is undefined`);
    return;
  }

  console.log(`Showing record ${currentIndex + 1}/${modules.length}:`, module);

  // Update form fields
  setFieldValue('ModuleID', module.ModuleID);
  setFieldValue('ModuleNo', module.ModuleNo);
  setFieldValue('Description', module.Description);

  // Update record display
  setElementText('recordNumber', currentIndex + 1);
  setElementText('statusMessage', `Record ${currentIndex + 1} of ${modules.length} - ${module.ModuleID}`);
}

function setFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.value = value || '';
    console.log(`✓ Set ${fieldId} = "${value}"`);
  } else {
    console.log(`✗ Field ${fieldId} not found`);
  }
}

function setElementText(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
    console.log(`✓ Set ${elementId} = "${text}"`);
  } else {
    console.log(`✗ Element ${elementId} not found`);
  }
}

function showError(message) {
  console.error('ERROR:', message);
  alert('Error: ' + message);

  // Also show in status message if available
  const status = document.getElementById('statusMessage');
  if (status) {
    status.textContent = 'ERROR: ' + message;
    status.style.color = 'red';
  }
}

// Mode management
let currentMode = 'Edit';

function setMode(mode) {
  currentMode = mode;
  console.log(`Setting mode to: ${mode}`);

  // Update hidden field
  setFieldValue('currentMode', mode);

  // Hide all action buttons first
  const actionButtons = ['updateBtn', 'deleteBtn', 'newBtn', 'insertBtn', 'cancelBtn', 'applyBtn'];
  actionButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'none';
  });

  // Show buttons based on mode
  let buttonsToShow = [];
  let statusText = '';

  switch (mode) {
    case 'Edit':
      buttonsToShow = ['updateBtn', 'deleteBtn', 'newBtn'];
      statusText = 'Current Filter: None';
      break;
    case 'New':
      buttonsToShow = ['insertBtn', 'cancelBtn'];
      statusText = 'Status: Ready for new record';
      break;
    case 'Filter':
      buttonsToShow = ['applyBtn', 'cancelBtn'];
      statusText = 'Status: Ready for filter criteria';
      break;
  }

  // Show the appropriate buttons
  buttonsToShow.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.style.display = 'inline';
      console.log(`✓ Showing button ${id}`);
    }
  });

  // Update status message
  setElementText('statusMessage', statusText);
}

// Action functions
async function updateRecord() {
  console.log('Update record clicked');

  try {
    const data = {
      originalModuleID: document.getElementById('ModuleID').value, // Current ID before changes
      ModuleID: document.getElementById('ModuleID').value,
      ModuleNo: parseInt(document.getElementById('ModuleNo').value) || 0,
      Description: document.getElementById('Description').value
    };

    console.log('Updating with data:', data);

    const response = await fetch('/api/module-maintenance/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Update result:', result);

    if (result.success) {
      setElementText('statusMessage', 'Module updated successfully');
      await loadData(); // Reload fresh data
    } else {
      showError(result.message || 'Failed to update module');
    }
  } catch (error) {
    console.error('Update error:', error);
    showError('Error updating module: ' + error.message);
  }
}

async function deleteRecord() {
  const moduleID = document.getElementById('ModuleID').value;
  if (!confirm(`Are you sure you want to delete module "${moduleID}"?`)) return;

  console.log('Delete record clicked for:', moduleID);

  try {
    const data = { ModuleID: moduleID };

    const response = await fetch('/api/module-maintenance/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Delete result:', result);

    if (result.success) {
      setElementText('statusMessage', 'Module deleted successfully');
      
      // Reload fresh data
      await loadData(); 
      
      // After loading data, adjust current index if needed
      if (modules.length === 0) {
        // No modules left, clear the form
        setFieldValue('ModuleID', '');
        setFieldValue('ModuleNo', '');
        setFieldValue('Description', '');
        setElementText('statusMessage', 'No modules available');
        setElementText('recordNumber', '0');
      } else {
        // Adjust current index if needed
        if (currentIndex >= modules.length) {
          currentIndex = modules.length - 1;
        }
        // Ensure currentIndex is not negative
        if (currentIndex < 0) {
          currentIndex = 0;
        }
        showRecord();
      }
    } else {
      // Show professional error message following original ASP pattern
      showError(result.message || 'Unable to delete the record from Modules.');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showError('Error deleting module: ' + error.message);
  }
}

function newRecord() {
  console.log('New record clicked');

  // Clear all fields
  setFieldValue('ModuleID', '');
  setFieldValue('ModuleNo', '');
  setFieldValue('Description', '');

  // Switch to New mode
  setMode('New');
}

async function insertRecord() {
  console.log('Insert record clicked');

  try {
    const data = {
      ModuleID: document.getElementById('ModuleID').value,
      ModuleNo: parseInt(document.getElementById('ModuleNo').value) || 0,
      Description: document.getElementById('Description').value
    };

    console.log('Inserting with data:', data);

    const response = await fetch('/api/module-maintenance/insert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Insert result:', result);

    if (result.success) {
      setElementText('statusMessage', 'Module inserted successfully');
      await loadData(); // Reload fresh data
      setMode('Edit');
      // Find the new record and show it
      const newIndex = modules.findIndex(m => m.ModuleID === data.ModuleID);
      if (newIndex >= 0) {
        currentIndex = newIndex;
        showRecord();
      }
    } else {
      showError(result.message || 'Failed to insert module');
    }
  } catch (error) {
    console.error('Insert error:', error);
    showError('Error inserting module: ' + error.message);
  }
}

// filterRecord function removed - not part of original ASP implementation

function cancelAction() {
  console.log('Cancel clicked');

  // Switch back to Edit mode and show current record
  setMode('Edit');
  showRecord();
}

async function applyFilter() {
  console.log('Apply filter clicked');

  try {
    const filter = {
      ModuleID: document.getElementById('ModuleID').value,
      ModuleNo: document.getElementById('ModuleNo').value,
      Description: document.getElementById('Description').value
    };

    console.log('Applying filter:', filter);

    const response = await fetch('/api/module-maintenance/filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter)
    });

    const result = await response.json();
    console.log('Filter result:', result);

    if (result.success) {
      modules = result.data;
      currentIndex = 0;
      setMode('Edit');
      showRecord();
      setElementText('statusMessage', `Filter applied: ${modules.length} records found`);
    } else {
      showError(result.message || 'Failed to apply filter');
    }
  } catch (error) {
    console.error('Filter error:', error);
    showError('Error applying filter: ' + error.message);
  }
}

function showListView() {
  console.log('List view clicked');

  // Hide form section, show list section
  document.getElementById('formSection').style.display = 'none';
  document.getElementById('listSection').style.display = 'block';

  // Update the button in header from "List View" to "Form View"
  const listViewBtn = document.getElementById('listViewBtn');
  if (listViewBtn) {
    listViewBtn.value = 'Form View';
    listViewBtn.onclick = showFormView;
  }

  // Hide all action buttons in list view (following original ASP behavior)
  const actionButtons = ['updateBtn', 'deleteBtn', 'newBtn', 'insertBtn', 'cancelBtn', 'applyBtn'];
  actionButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = 'none';
  });

  // Update status message
  setElementText('statusMessage', 'Current Filter: None');

  // Populate the list with current modules
  populateModuleList();
}

function showFormView() {
  console.log('Form view clicked');

  // Hide list section, show form section
  document.getElementById('listSection').style.display = 'none';
  document.getElementById('formSection').style.display = 'block';

  // Update the button in header from "Form View" to "List View"
  const listViewBtn = document.getElementById('listViewBtn');
  if (listViewBtn) {
    listViewBtn.value = 'List View';
    listViewBtn.onclick = showListView;
  }

  // Restore Edit mode buttons (Update, Delete, New)
  setMode('Edit');

  // Show the current record
  showRecord();
}

function populateModuleList() {
  const tbody = document.getElementById('moduleListBody');
  if (!tbody) {
    console.log('Module list table body not found');
    return;
  }

  // Clear existing rows
  tbody.innerHTML = '';

  if (!modules || modules.length === 0) {
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 4;
    cell.textContent = 'No modules found';
    cell.style.textAlign = 'center';
    return;
  }

  // Add rows for each module (matching original ASP list format)
  modules.forEach((module, index) => {
    const row = tbody.insertRow();

    // Row number (# column)
    const numberCell = row.insertCell(0);
    numberCell.textContent = index + 1;
    numberCell.style.textAlign = 'center';

    // Module ID
    const idCell = row.insertCell(1);
    idCell.textContent = module.ModuleID;

    // Module No
    const noCell = row.insertCell(2);
    noCell.textContent = module.ModuleNo;
    noCell.style.textAlign = 'center';

    // Description
    const descCell = row.insertCell(3);
    descCell.textContent = module.Description;

    // Make row clickable to edit (like original ASP)
    row.style.cursor = 'pointer';
    row.onclick = () => {
      currentIndex = index;
      showFormView();
    };

    // Alternate row colors (like original ASP)
    if (index % 2 === 0) {
      row.style.backgroundColor = '#f0f0f0';
    }
  });

  console.log(`List view populated with ${modules.length} modules`);
}// Global test function for debugging
window.testModules = function () {
  console.log('=== MODULE TEST ===');
  console.log('Modules array:', modules);
  console.log('Current index:', currentIndex);
  console.log('Current mode:', currentMode);
  console.log('Current module:', modules[currentIndex]);
  console.log('DOM elements:');
  ['loadingMessage', 'formSection', 'ModuleID', 'ModuleNo', 'Description', 'recordNumber', 'statusMessage'].forEach(id => {
    const el = document.getElementById(id);
    console.log(`  ${id}:`, el ? 'found' : 'NOT FOUND');
  });
};

console.log('✓ Module maintenance script loaded completely');
