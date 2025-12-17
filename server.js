// server.js

// --- 1. Import Packages and Initialize App ---
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Initialize the Express application
const app = express();
const PORT = 3000;

// --- 2. Middleware Setup ---
app.use(cors());
app.use(express.json());

// --- 3. Database Connection Configuration ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'BandInventory'
});

// Test the connection
db.connect(err => {
    if (err) {
        console.error('CRASH: Error connecting to MySQL:', err.stack);
        process.exit(1);
        // The previous 'return;' statement here was correctly grayed out and is now removed.
    }
    console.log('✅ Connected to MySQL database as ID ' + db.threadId);
});

// --- 4. API Routes: Roster (Students) ---

// Route to Fetch Roster Data (GET: /api/roster)
app.get('/api/roster', (req, res) => {
    const sql = 'SELECT * FROM Roster ORDER BY graduation_year, full_name';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error on /api/roster:', err);
            return res.status(500).json({ message: 'Error fetching roster data.' });
        }
        res.json(results);
    });
});

// Route to Add a New Student (POST: /api/roster)
app.post('/api/roster', (req, res) => {
    const { full_name, graduation_year, instrument_played } = req.body;

    if (!full_name || !graduation_year) {
        return res.status(400).json({ message: 'Student name and Graduation Year are required.' });
    }

    const sql = 'INSERT INTO Roster (full_name, graduation_year, instrument_played) VALUES (?, ?, ?)';
    const values = [full_name, graduation_year, instrument_played];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database INSERT error on /api/roster:', err);

            let statusCode = 500;
            let errorMessage = 'Error inserting new student data.';

            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                 statusCode = 409;
                 errorMessage = 'Error: This student already exists.';
            }

            return res.status(statusCode).json({ message: errorMessage });
        }
        res.status(201).json({ message: 'Student added successfully!', id: result.insertId });
    });
});


// --- 5. API Routes: Instruments ---

// Route to Fetch Instruments Data (GET: /api/instruments)
app.get('/api/instruments', (req, res) => {
    const sql = 'SELECT * FROM Instruments ORDER BY instrument_name, instrument_number';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error on /api/instruments:', err);
            return res.status(500).json({ message: 'Error fetching instrument data.' });
        }
        res.json(results);
    });
});

// Route to Add a New Instrument (POST: /api/instruments)
app.post('/api/instruments', (req, res) => {
    const { instrument_name, instrument_number, locker_number, locker_code, condition_notes } = req.body;

    if (!instrument_name || !instrument_number) {
        return res.status(400).json({ message: 'Instrument name and instrument number are required.' });
    }

    const sql = 'INSERT INTO Instruments (instrument_name, instrument_number, locker_number, locker_code, condition_notes) VALUES (?, ?, ?, ?, ?)';
    const values = [instrument_name, instrument_number, locker_number, locker_code, condition_notes];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database INSERT error on /api/instruments:', err);

            let statusCode = 500;
            let errorMessage = 'Error inserting new instrument data.';

            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                 statusCode = 409;
                 errorMessage = 'Error: An instrument with that number already exists.';
            }

            return res.status(statusCode).json({ message: errorMessage });
        }
        res.status(201).json({ message: 'Instrument added successfully!', id: result.insertId });
    });
});

// --- 6. API Routes: Uniforms ---

// Route to Fetch Uniforms Data (GET: /api/uniforms)
app.get('/api/uniforms', (req, res) => {
    const sql = 'SELECT * FROM Uniforms ORDER BY item_type, item_number';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error on /api/uniforms:', err);
            return res.status(500).json({ message: 'Error fetching uniform data.' });
        }
        res.json(results);
    });
});

// Route to Add a New Uniform (POST: /api/uniforms)
app.post('/api/uniforms', (req, res) => {
    const { item_type, item_number, size, status } = req.body;

    if (!item_type || !item_number) {
        return res.status(400).json({ message: 'Uniform type and item number are required.' });
    }

    const sql = 'INSERT INTO Uniforms (item_type, item_number, size, status) VALUES (?, ?, ?, ?)';
    const values = [item_type, item_number, size, status];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database INSERT error on /api/uniforms:', err);

            let statusCode = 500;
            let errorMessage = 'Error inserting new uniform data.';

            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                 statusCode = 409;
                 errorMessage = 'Error: A uniform piece with that Item Number already exists.';
            }

            return res.status(statusCode).json({ message: errorMessage });
        }
        res.status(201).json({ message: 'Uniform added successfully!', id: result.insertId });
    });
});

// --- 7. API Routes: Assignments ---

// Route to Fetch All Assignments (GET: /api/assignments)
app.get('/api/assignments', (req, res) => {
    const sql = `
        SELECT
            A.assignment_id,
            R.full_name AS student_name,
            I.instrument_name,
            I.instrument_number AS instrument_sn,
            U.item_type AS uniform_type,
            U.item_number AS uniform_item_number,
            A.date_out,
            A.date_in
        FROM Assignments A
        JOIN Roster R ON A.student_fk = R.student_id
        LEFT JOIN Instruments I ON A.instrument_fk = I.instrument_id
        LEFT JOIN Uniforms U ON A.uniform_fk = U.uniform_id
        ORDER BY A.date_out DESC;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error on /api/assignments:', err);
            return res.status(500).json({ message: 'Error fetching assignment data.' });
        }
        res.json(results);
    });
});

// Route to Add a New Assignment (POST: /api/assignments)
app.post('/api/assignments', (req, res) => {
    const { student_fk, instrument_fk, uniform_fk, date_out, date_in } = req.body;

    // Check that at least one item (instrument or uniform) is being assigned
    if (!student_fk && !date_out) {
        return res.status(400).json({ message: 'A student and the date out are required for an assignment.' });
    }

    if (!instrument_fk && !uniform_fk){
        return res.status(400).json({ message: 'You must select an instrument and/or a uniform piece to assign.'})
    }
    
    const sql = 'INSERT INTO Assignments (student_fk, instrument_fk, uniform_fk, date_out, date_in) VALUES (?, ?, ?, ?, ?)';
    const values = [student_fk, instrument_fk, uniform_fk, date_out, date_in || null];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database INSERT error on /api/assignments:', err);

            let statusCode = 500;
            let errorMessage = 'Error inserting assignment data.';

            if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                 statusCode = 400;
                 errorMessage = 'Error: One of the selected items (student, instrument, or uniform) does not exist.';
            }

            return res.status(statusCode).json({ message: errorMessage });
        }
        res.status(201).json({ message: 'Assignment created successfully!', id: result.insertId });
    });
});

app.get('/api/assignments/active-ids', (req, res) => {
    const sql = `
        SELECT
            instrument_fk AS instrument_id,
            uniform_fk AS uniform_id
        FROM
            Assignments
        WHERE
            date_in IS NULL;
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Database query error on /api/assignments/active-ids:', err);
            return res.status(500).json({ message: 'Error fetching active item IDs.' });
        }
        res.json(results);
    });
});

// --- 8. Start Server ---

app.use(express.static('.'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});