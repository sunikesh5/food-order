import fs from 'node:fs/promises';
import path from 'path'; // Import the path module
import { fileURLToPath } from 'url'; // Required to get __dirname in ES modules

import bodyParser from 'body-parser';
import express from 'express';

const app = express();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
// app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static('public'));

// Set CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// GET /meals route
app.get('/meals', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'data', 'available-meals.json');
    const meals = await fs.readFile(filePath, 'utf8');
    res.json(JSON.parse(meals));
  } catch (error) {
    console.error('Error reading meals file:', error);
    res.status(500).json({ message: 'Failed to retrieve meals.' });
  }
});

// POST /orders route
app.post('/orders', async (req, res) => {
  try {
    const orderData = req.body.order;

    if (
      !orderData ||
      !orderData.items ||
      orderData.items.length === 0 ||
      !orderData.customer.email ||
      !orderData.customer.email.includes('@') ||
      !orderData.customer.name ||
      orderData.customer.name.trim() === '' ||
      !orderData.customer.street ||
      orderData.customer.street.trim() === '' ||
      !orderData.customer['postal-code'] ||
      orderData.customer['postal-code'].trim() === '' ||
      !orderData.customer.city ||
      orderData.customer.city.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Invalid data: Email, name, street, postal code, or city is missing or invalid.',
      });
    }

    const newOrder = {
      ...orderData,
      id: (Math.random() * 1000).toString(),
    };

    const filePath = path.join(__dirname, 'data', 'orders.json');
    let allOrders = [];

    try {
      const orders = await fs.readFile(filePath, 'utf8');
      allOrders = JSON.parse(orders);
    } catch (readError) {
      // If file doesn't exist, start with an empty array
      if (readError.code !== 'ENOENT') {
        throw readError;
      }
    }

    allOrders.push(newOrder);
    await fs.writeFile(filePath, JSON.stringify(allOrders, null, 2));
    res.status(201).json({ message: 'Order created!', order: newOrder });
  } catch (error) {
    console.error('Error handling order:', error);
    res.status(500).json({ message: 'Failed to process order.' });
  }
});

// Handle OPTIONS and 404 requests
app.use((req, res) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: 'Not found' });
});

// Export the app for use in serverless environments or local testing
app.listen(3000)
export default app;