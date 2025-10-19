const express = require('express');

// Simulated in-memory database for stocks
let stocks = [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology' },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology' },
    { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive' },
    // Add more initial stocks to simulate a larger dataset
];

// Utility function to validate stock data
function validateStockData(stock) {
    if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
        return 'Invalid or missing stock symbol';
    }
    if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
        return 'Invalid or missing stock name';
    }
    if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
        return 'Invalid or missing stock price';
    }
    if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
        return 'Invalid or missing stock quantity';
    }
    if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
        return 'Invalid or missing stock sector';
    }
    return null;
}

// Utility function to find stock by ID
function findStockById(id) {
    return stocks.find(stock => stock.id === parseInt(id));
}

// Utility function to find stock index by ID
function findStockIndexById(id) {
    return stocks.findIndex(stock => stock.id === parseInt(id));
}

// Utility function to generate a new stock ID
function generateStockId() {
    return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
}

// Utility function to validate query parameters
function validateQueryParams(query) {
    const { minPrice, maxPrice, sector } = query;
    if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
        return 'Invalid minPrice parameter';
    }
    if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
        return 'Invalid maxPrice parameter';
    }
    if (sector && typeof sector !== 'string') {
        return 'Invalid sector parameter';
    }
    return null;
}

// Controller to get all stocks with optional filtering
exports.getAllStocks = (req, res) => {
    try {
        const { minPrice, maxPrice, sector } = req.query;
        const validationError = validateQueryParams(req.query);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        let filteredStocks = [...stocks];

        if (minPrice) {
            filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
        }
        if (maxPrice) {
            filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
        }
        if (sector) {
            filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
        }

        res.status(200).json({
            success: true,
            count: filteredStocks.length,
            data: filteredStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get a single stock by ID
exports.getStockById = (req, res) => {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        res.status(200).json({ success: true, data: stock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to create a new stock
exports.createStock = (req, res) => {
    try {
        const newStock = {
            id: generateStockId(),
            symbol: req.body.symbol,
            name: req.body.name,
            price: req.body.price,
            quantity: req.body.quantity,
            sector: req.body.sector
        };

        const validationError = validateStockData(newStock);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        stocks.push(newStock);
        res.status(201).json({ success: true, data: newStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to update an existing stock
exports.updateStock = (req, res) => {
    try {
        const stockIndex = findStockIndexById(req.params.id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const updatedStock = {
            ...stocks[stockIndex],
            symbol: req.body.symbol || stocks[stockIndex].symbol,
            name: req.body.name || stocks[stockIndex].name,
            price: req.body.price || stocks[stockIndex].price,
            quantity: req.body.quantity || stocks[stockIndex].quantity,
            sector: req.body.sector || stocks[stockIndex].sector
        };

        const validationError = validateStockData(updatedStock);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        stocks[stockIndex] = updatedStock;
        res.status(200).json({ success: true, data: updatedStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to delete a stock
exports.deleteStock = (req, res) => {
    try {
        const stockIndex = findStockIndexById(req.params.id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const deletedStock = stocks.splice(stockIndex, 1)[0];
        res.status(200).json({ success: true, data: deletedStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stock statistics
exports.getStockStats = (req, res) => {
    try {
        const totalStocks = stocks.length;
        const totalValue = stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0);
        const sectors = [...new Set(stocks.map(stock => stock.sector))];
        const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalStocks,
                totalValue,
                sectors,
                averagePrice: parseFloat(avgPrice.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stocks by sector
exports.getStocksBySector = (req, res) => {
    try {
        const sector = req.params.sector;
        if (!sector || typeof sector !== 'string') {
            return res.status(400).json({ error: 'Invalid sector parameter' });
        }

        const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
        if (sectorStocks.length === 0) {
            return res.status(404).json({ error: 'No stocks found for this sector' });
        }

        res.status(200).json({
            success: true,
            count: sectorStocks.length,
            data: sectorStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stock price history (simulated)
exports.getStockPriceHistory = (req, res) => {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate price history data
        const history = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            price: stock.price * (1 + (Math.random() - 0.5) * 0.1) // Random variation ±5%
        })).reverse();

        res.status(200).json({
            success: true,
            data: {
                symbol: stock.symbol,
                history
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to bulk create stocks
exports.bulkCreateStocks = (req, res) => {
    try {
        const newStocks = req.body;
        if (!Array.isArray(newStocks)) {
            return res.status(400).json({ error: 'Input must be an array of stocks' });
        }

        const createdStocks = [];
        for (const stock of newStocks) {
            const newStock = {
                id: generateStockId(),
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price,
                quantity: stock.quantity,
                sector: stock.sector
            };

            const validationError = validateStockData(newStock);
            if (validationError) {
                return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
            }

            stocks.push(newStock);
            createdStocks.push(newStock);
        }

        res.status(201).json({
            success: true,
            count: createdStocks.length,
            data: createdStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to bulk delete stocks
exports.bulkDeleteStocks = (req, res) => {
    try {
        const ids = req.body.ids;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Input must be an array of stock IDs' });
        }

        const deletedStocks = [];
        for (const id of ids) {
            const stockIndex = findStockIndexById(id);
            if (stockIndex !== -1) {
                deletedStocks.push(stocks.splice(stockIndex, 1)[0]);
            }
        }

        if (deletedStocks.length === 0) {
            return res.status(404).json({ error: 'No stocks found for provided IDs' });
        }

        res.status(200).json({
            success: true,
            count: deletedStocks.length,
            data: deletedStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to search stocks by symbol or name
exports.searchStocks = (req, res) => {
    try {
        const query = req.query.q;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Invalid search query' });
        }

        const searchResults = stocks.filter(stock =>
            stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock.name.toLowerCase().includes(query.toLowerCase())
        );

        res.status(200).json({
            success: true,
            count: searchResults.length,
            data: searchResults
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get top performing stocks
exports.getTopPerformingStocks = (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid limit parameter' });
        }

        const sortedStocks = [...stocks].sort((a, b) => b.price - a.price).slice(0, limit);
        res.status(200).json({
            success: true,
            count: sortedStocks.length,
            data: sortedStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to update stock price
exports.updateStockPrice = (req, res) => {
    try {
        const stockIndex = findStockIndexById(req.params.id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const newPrice = req.body.price;
        if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        stocks[stockIndex].price = newPrice;
        res.status(200).json({
            success: true,
            data: stocks[stockIndex]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to update stock quantity
exports.updateStockQuantity = (req, res) => {
    try {
        const stockIndex = findStockIndexById(req.params.id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const newQuantity = req.body.quantity;
        if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        stocks[stockIndex].quantity = newQuantity;
        res.status(200).json({
            success: true,
            data: stocks[stockIndex]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get low stock alerts
exports.getLowStockAlerts = (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 100;
        if (isNaN(threshold) || threshold < 0) {
            return res.status(400).json({ error: 'Invalid threshold parameter' });
        }

        const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
        res.status(200).json({
            success: true,
            count: lowStocks.length,
            data: lowStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stock value
exports.getStockValue = (req, res) => {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const totalValue = stock.price * stock.quantity;
        res.status(200).json({
            success: true,
            data: {
                symbol: stock.symbol,
                totalValue: parseFloat(totalValue.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to export stock data (simulated CSV)
exports.exportStockData = (req, res) => {
    try {
        const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector\n';
        const csvData = stocks.map(stock =>
            `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector}`
        ).join('\n');
        
        res.status(200).json({
            success: true,
            data: csvHeader + csvData
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to import stock data (simulated from CSV)
exports.importStockData = (req, res) => {
    try {
        const csvData = req.body.csv;
        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({ error: 'Invalid CSV data' });
        }

        const lines = csvData.split('\n').slice(1); // Skip header
        const importedStocks = [];

        for (const line of lines) {
            const [id, symbol, name, price, quantity, sector] = line.split(',');
            const newStock = {
                id: parseInt(id) || generateStockId(),
                symbol,
                name,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                sector
            };

            const validationError = validateStockData(newStock);
            if (validationError) {
                return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
            }

            stocks.push(newStock);
            importedStocks.push(newStock);
        }

        res.status(201).json({
            success: true,
            count: importedStocks.length,
            data: importedStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stock performance metrics
exports.getStockPerformance = (req, res) => {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate performance metrics
        const performance = {
            symbol: stock.symbol,
            currentPrice: stock.price,
            changePercent: ((Math.random() - 0.5) * 10).toFixed(2), // Random ±5%
            volume: Math.floor(Math.random() * 1000000),
            marketCap: (stock.price * stock.quantity).toFixed(2)
        };

        res.status(200).json({
            success: true,
            data: performance
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller to get stock portfolio summary
exports.getPortfolioSummary = (req, res) => {
    try {
        const totalValue = stocks.reduce((sum, stock) => sum + (stock.price * stock.quantity), 0);
        const sectorBreakdown = stocks.reduce((acc, stock) => {
            acc[stock.sector] = (acc[stock.sector] || 0) + (stock.price * stock.quantity);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            data: {
                totalValue: parseFloat(totalValue.toFixed(2)),
                sectorBreakdown
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
