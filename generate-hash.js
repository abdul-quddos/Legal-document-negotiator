const bcrypt = require('bcryptjs'); 
const password = 'password123'; 
const hash = bcrypt.hashSync(password, 10); 
console.log('Hash:', hash); 
