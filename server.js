const app = require('./src/app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` Test API: http://localhost:${PORT}/api/test`);
    console.log(` Products API: http://localhost:${PORT}/api/products`);
    console.log(` Admin API: http://localhost:${PORT}/api/admin`);
    console.log(` Auth API: http://localhost:${PORT}/api/auth`);
});