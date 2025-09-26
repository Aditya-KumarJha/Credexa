require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { validateEmailConfig } = require('./src/config/emailConfig');

connectDB();

// Validate email configuration on startup
validateEmailConfig();

const PORT = process.env.PORT;

app.listen(PORT, () => {    
    console.log("Server is running on port " + PORT);
});
