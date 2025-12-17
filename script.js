const API_URL = 'http://127.0.0.1:3000/api';
let fullRosterData = []; 

function setAssignmentDefaultDate() {
    const dateInput = document.getElementById('date_out');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // Initial data fetch for both sections
    fetchRoster();
    fetchInstruments(); 
    fetchUniforms();
    fetchAssignments();
    
    setAssignmentDefaultDate(); 
    
    // Attach event listeners for both forms
    document.getElementById('add-student-form').addEventListener('submit', handleAddStudent);
    document.getElementById('add-instrument-form').addEventListener('submit', handleAddInstrument);
    document.getElementById('add-uniform-form').addEventListener('submit', handleAddUniform);
    document.getElementById('add-assignment-form').addEventListener('submit', handleAddAssignment);

    populateAssignmentDropdowns();

    const rosterSearchInput = document.getElementById('roster-search-input');
    if (rosterSearchInput) {
        rosterSearchInput.addEventListener('keyup', filterRosterTable);
    }
});

async function populateAssignmentDropdowns() {
    try {
        const [rosterRes, instrumentRes, uniformRes, activeRes] =await Promise.all([
            fetch(`${API_URL}/roster`),
            fetch(`${API_URL}/instruments`),
            fetch(`${API_URL}/uniforms`),
            fetch(`${API_URL}/assignments/active-ids`)
        ]);

        const roster = await rosterRes.json();
        const instruments = await instrumentRes.json();
        const uniforms = await uniformRes.json();
        const activeAssignments = await activeRes.json();

        const activeInstrumentsIds = new Set(activeAssignments.map(a => a.instrument_id).filter(id => id !== null));
        const activeUniformIds = new Set(activeAssignments.map(a => a.uniform_id).filter(id => id !== null));

        const availableInstruments = instruments.filter(item => !activeInstrumentsIds.has(item.instrument_id));
        const availableUniforms = uniforms.filter(item => !activeUniformIds.has(item.uniform_id));

        //Populating the Student Dropdown
        const studentSelect = document.getElementById('student_fk');
        studentSelect.innerHTML = '<option value="" disabled selected>Select Student</option>';
        roster.forEach(student => {
            const option = document.createElement('option');
            option.value = student.student_id;
            option.textContent = `${student.full_name} (${student.graduation_year})`;
            studentSelect.appendChild(option);
        });

        //Populating the Instrument Dropdown
        const instrumentSelect = document.getElementById('instrument_fk');
        instrumentSelect.innerHTML = '<option value="" disabled selected>Select Instrument</option>';
        availableInstruments.forEach(inst => {
            const option = document.createElement('option');
            option.value = inst.instrument_id;
            option.textContent = `${inst.instrument_name} #${inst.instrument_number} (Locker: ${inst.locker_number})`;
            instrumentSelect.appendChild(option);
        });

        //Populating the Uniform Dropdown
        const uniformSelect = document.getElementById('uniform_fk');
        uniformSelect.innerHTML = '<option value="" disabled selected>Select Uniform</option>';
        availableUniforms.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni.uniform_id;
            option.textContent = `${uni.item_type} - Size: ${uni.size} (#${uni.item_number})`;
            uniformSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error populating assignment dropdowns:', error);
        alert(`Failed to load assignment options. Check sever connection and console for details. Error: ${error.message}`);
    }
    
}


// Assignment Functions
async function fetchAssignments() {
    const loadingMessage = document.getElementById('loading-message-assignments');
    const assignmentTable = document.getElementById('assignments-table');
    const assignmentBody = document.getElementById('assignments-body');

    if (!assignmentBody || !assignmentTable) {
        console.error('CRITICAL ERROR: Missing assignments-table or assignments-body elements in index.html');
        return;
    }

    assignmentBody.innerHTML = '';
    loadingMessage.textContent = 'Loading assignment data...';
    loadingMessage.style.display = 'block';
    assignmentTable.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/assignments`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}. Details: ${errorText}`);
        }

        const assignments = await response.json();

        loadingMessage.style.display = 'none';

        if (assignments.length === 0) {
            loadingMessage.textContent = 'No active or historical assignments found.';
            loadingMessage.style.display = 'block';
            assignmentTable.style.display = 'none';
            return;
        }

        assignmentTable.style.display = 'table';

        assignments.forEach(assignment => {
            const row = assignmentBody.insertRow();

            //Student Info
            row.insertCell().textContent = assignment.student_name || 'Error: Missing Student';
            row.insertCell().textContent = assignment.graduation_year || 'N/A';

            //Instrument Info
            const instrumentCell = row.insertCell();
            if (assignment.instrument_name) {
                instrumentCell.textContent = `${assignment.instrument_name} (#${assignment.instrument_number})`;
            } else {
                instrumentCell.textContent = 'N/A';
            }

            //Uniform Info
            const uniformCell = row.insertCell();
            if (assignment.item_type) {
                uniformCell.textContent = `${assignment.item_type} (#${assignment.uniform_number})`;
            } else {
                uniformCell.textContent = 'N/A';
            }

            //Date Info
            row.insertCell().textContent = assignment.date_out;
            row.insertCell().textContent = assignment.date_in || '- Active -';

            row.insertCell().textContent = 'Actions';
        });
    } catch (error) {
        console.error('Failed to fetch assignments. Check Networks Tab for response:', error);
        loadingMessage.textContent = 'Error loading assignment data. Check your server connection.';
        loadingMessage.style.color = 'red';
        loadingMessage.style.display = 'block';
    }
}

async function handleAddAssignment(event) {
    event.preventDefault();

    const form= event.target;

    const assignmentData = {
        student_fk: document.getElementById('student_fk').value,
        instrument_fk: document.getElementById('instrument_fk').value,
        uniform_fk: document.getElementById('uniform_fk').value,
        date_out: document.getElementById('date_out').value,
        date_in: document.getElementById('date_in').value || null
    };

    try {
        const response = await fetch(`${API_URL}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create assignment.');
        }

        alert('Assignment created successfully!');
        event.target.reset();
        fetchAssignments();
        populateAssignmentDropdowns();

    } catch (error) {
        console.error('Error creating assignment:', error);
        alert(`Error: ${error.message}`);
    }
}


// =========================================================================
//                             ROSTER FUNCTIONS
// =========================================================================

async function fetchRoster() {
    const loadingMessage = document.getElementById('loading-message-roster');
    const rosterTable = document.getElementById('roster-table');
    const rosterBody = document.getElementById('roster-body');
    rosterBody.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/roster`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const students = await response.json(); 
        
        loadingMessage.style.display = 'none';
        rosterTable.style.display = 'table';

        if (students.length === 0) {
            rosterBody.innerHTML = '<tr><td colspan="3">No students found. Add one above!</td></tr>';
            return;
        }

        students.forEach(student => {
            const row = rosterBody.insertRow();
            
            row.insertCell().textContent = student.full_name;
            row.insertCell().textContent = student.graduation_year;
            row.insertCell().textContent = student.instrument_played;
        });

    } catch (error) {
        console.error('Failed to fetch roster:', error);
        loadingMessage.textContent = 'Error loading data. Check your server connection.';
        loadingMessage.style.color = 'red';
    }
}

function renderRosterTable(rosterData) {
    const rosterBody = document.getElementById('roster-body');
    rosterBody.innerHTML = '';

    if (rosterData.length === 0) {
        rosterBody.innerHTML = '<tr><td colspan="4">No students found matching your search.</td></tr>';
        return;
    }

    rosterData.forEach(student => {
        const row = document.getElementById('tr');
        row.innerHTML = `
            <td>${student.full_name}</td>
            <td>${student.graduation_year}</td>
            <td>${student.instrument_played || 'N/A'}</td>
            <td><button class="edit-btn">Edit</button></td>
        `;
        rosterBody.appendChild(row);
    });
}

function filterRosterTable() {
    const searchInput = document.getElementById('roster-search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredData = fullRosterData.filter(student => {
        const nameMatch = student.full_name.toLowerCase().includes(searchTerm);
        const yearMatch = student.graduation_year.toString().includes(searchTerm);

        const instrumentPlayed = student.instrument_played ? student.instrument_played.toLowerCase() : '';
        const instrumentMatch = instrumentPlayed.includes(searchTerm);

        return nameMatch || yearMatch || instrumentMatch;
    });

    renderRosterTable(filteredData);
}

async function handleAddStudent(event) {
    event.preventDefault(); 

    const form = event.target;
    const studentData = {
        full_name: document.getElementById('full_name').value,
        graduation_year: document.getElementById('graduation_year').value,
        instrument_played: document.getElementById('instrument_played').value
    };

    try {
        const response = await fetch(`${API_URL}/roster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add student to the database.');
        }

        alert('Student added successfully!');
        event.target.reset();
        document.getElementById('roster-body').innerHTML = '';
        fetchRoster();
        populateAssignmentDropdowns();

    } catch (error) {
        console.error('Error adding student:', error);
        alert(`Error: ${error.message}`);
    }
}


// =========================================================================
//                            INSTRUMENTS FUNCTIONS
// =========================================================================

async function fetchInstruments() {
    const loadingMessage = document.getElementById('loading-message-instruments');
    const instrumentTable = document.getElementById('instrument-table');
    const instrumentBody = document.getElementById('instrument-body');
    instrumentBody.innerHTML = ''; // Clear old data

    try {
        const response = await fetch(`${API_URL}/instruments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const instruments = await response.json(); 
        
        loadingMessage.style.display = 'none';
        instrumentTable.style.display = 'table';

        if (instruments.length === 0) {
            instrumentBody.innerHTML = '<tr><td colspan="5">No instruments found. Add one above!</td></tr>';
            return;
        }

        instruments.forEach(instrument => {
            const row = instrumentBody.insertRow();
            
            row.insertCell().textContent = instrument.instrument_name;
            row.insertCell().textContent = instrument.instrument_number;
            row.insertCell().textContent = instrument.locker_number;
            row.insertCell().textContent = instrument.locker_code;
            row.insertCell().textContent = instrument.condition_notes;
        });

    } catch (error) {
        console.error('Failed to fetch instruments:', error);
        loadingMessage.textContent = 'Error loading data. Check your server connection.';
        loadingMessage.style.color = 'red';
    }
}


async function handleAddInstrument(event) {
    event.preventDefault(); 

    const instrumentData = {
        instrument_name: document.getElementById('instrument_name').value,
        instrument_number: document.getElementById('instrument_number').value,
        locker_number: document.getElementById('locker_number').value,
        locker_code: document.getElementById('locker_code').value,
        condition_notes: document.getElementById('condition_notes').value
    };

    try {
        const response = await fetch(`${API_URL}/instruments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(instrumentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add instrument to the database.');
        }

        alert('Instrument added successfully!');
        event.target.reset(); 
        fetchInstruments();
        populateAssignmentDropdowns();

    } catch (error) {
        console.error('Error adding instrument:', error);
        alert(`Error: ${error.message}`);
    }
}

//Uniforms Functions

async function fetchUniforms() {
    const loadingMessage = document.getElementById('loading-message-uniforms');
    const uniformTable = document.getElementById('uniform-table');
    const uniformBody = document.getElementById('uniform-body');
    uniformBody.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/uniforms`);

        if (!response.ok) {
            throw new Error('HTTP error! Status: ${response.status}');
        }

        const uniforms = await response.json();

        loadingMessage.style.display = 'none';
        uniformTable.style.display = 'table';

        if (uniforms.length === 0) {
            uniformBody.innerHTML = '<tr><td colspan="4">No uniform pieces found. Add one above!</td></tr>';
            return;
        }

        uniforms.forEach(uniform => {
            const row = uniformBody.insertRow();

            row.insertCell().textContent = uniform.item_type;
            row.insertCell().textContent = uniform.item_number;
            row.insertCell().textContent = uniform.size;
            row.insertCell().textContent = uniform.status;
        });
    } catch (error) {
        console.error('Failed to fetch uniforms:', error);
        loadingMessage.textContent = 'Error loading data. Checek your server connection.';
        loadingMessage.style.color = 'red';
    }
}

async function handleAddUniform(event) {
    event.preventDefault();

    const uniformData = {
        item_type: document.getElementById('item_type').value,
        item_number: document.getElementById('item_number').value,
        size: document.getElementById('size').value,
        status: document.getElementById('status').value
    };

    try {
        const response = await fetch(`${API_URL}/uniforms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uniformData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add uniform to the database.');
        }

        alert('Uniform added successfully!');
        event.target.reset();
        fetchUniforms();
        populateAssignmentDropdowns();

    } catch (error) {
        console.error('Error adding uniform:', error);
        alert(`Error: ${error.message}`);
    }
}