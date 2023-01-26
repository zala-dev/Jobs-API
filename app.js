require('dotenv').config();
require('express-async-errors');

const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');
const swaggerUI = require('swagger-ui-express');

const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const express = require('express');
const app = express();

const connectDB = require('./db/connect');
const authenticateUserMiddleware = require('./middleware/authentication');
const authRouter = require('./routes/auth.js');
const jobRouter = require('./routes/jobs.js');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());

app.get('/', (req, res) => {
  res.send('<h1>jobs API </h1> <a href="/api-docs"> documentation </a>');
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUserMiddleware, jobRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start();
