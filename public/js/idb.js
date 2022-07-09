// database connection
let db;

// connection to IndexedDB db called 'budget_tracker'
const request = indexedDB.open('budget_tracker', 1);

// event emits if the DB version changes
request.onupgradeneeded = function(event) {
    // reference to the database
    const db = event.target.result;
    // object store (table) named 'new_transaction'
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    // save in global variable
    db = event.target.result;

    // check if app is online and upload data if so
    if (navigator.online) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// execute if a new transaction is submitted while offline
function saveRecord(record) {
    // open a channel with the db and grant read/write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add new record to the store
    transactionObjectStore.add(record);
};

function uploadTransaction() {
    // open a channel with the db and grant read/write permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();
    
    // upon successful getAll
    getAll.onsuccess = function() {
        // if there was data in the store, send to server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another channel to db
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear store
                transactionObjectStore.clear();

                alert('All saved transactions have been applied.');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for the app to come back online
window.addEventListener('online', uploadTransaction);