let idCounter = 0;
const users = [];

// Increment the last id generated and return it as a string
function generateNewId() {
    return String(++idCounter);
}

// Add a user object to the users array
function addUser(user) {
    users.push(user);
}

// Return the user object with the specified ID
function getUserById(id) {
    return users.find(user => user.id === id);
}

// Return the user object with the specified username
function findUserByUsername(username) {
    return users.find(user => user.username === username);
}

// Return true if a user with the given username exists already
function isUsernameTaken(username) {
    return findUserByUsername(username) !== undefined;
}

// Create a user object and add it to the users array, return the user object
function createUser(data) {
    const id = generateNewId(); // Generate ID

    // Create user object, fields with "|| null" are optional registration parameters
    const user = {
        id,
        username: data.username,
        password: data.password,
        image: data.image || null,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phoneNumber: data.phoneNumber || null,
        gender: data.gender || null,
        birthDate: data.birthDate || null
    };
    addUser(user); // Add to the array
    return user;
}

// Check that a user exists with the given username and password
function validateLogin(username, password) {
    const user = findUserByUsername(username);
    if (!user) return null;

    const isValidPassword = password === user.password;
    if (!isValidPassword) return null;

    return user;
}

module.exports = {
    findUserByUsername,
    getUserById,
    isUsernameTaken,
    createUser,
    validateLogin
};