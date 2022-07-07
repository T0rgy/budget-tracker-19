// variable for the database connection
let db;
// create a connection to IndexDB "budget_tracker"
const request = indexedDB.open('budget_tracker', 1);


// emits if the DB version changes
request.onupgradeneeded = function(event) {
    // Makes reference to the database
    const db = event.target.result;

    db.createObjectStore('new_transaction', { autoIncrement: true });
};