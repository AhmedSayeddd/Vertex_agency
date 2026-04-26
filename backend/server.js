require('dotenv').config();
const express = require('express');
const cors = require('cors');

const applicationsRoutes = require('./routes/applications');
const offersRoutes = require('./routes/offers');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// All routes are public — no authentication required
app.use('/api/applications', applicationsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/match', require('./routes/match'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Vertex backend running on port ${PORT}`);
});
