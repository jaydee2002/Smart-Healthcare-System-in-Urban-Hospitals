import express from 'express';

// Simulated in-memory database for stocks
let stocks = [
    { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
    { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
    { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
    { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
    { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
    // Additional initial stocks for larger dataset
    { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
    { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
    { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
    { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
    { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
];

// Simulated watchlist
let watchlist = [];

// Utility function to calculate market cap
function calculateMarketCap(stock) {
    return stock.price * stock.quantity;
}

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

// Utility function to validate watchlist data
function validateWatchlistData(stockId) {
    const stock = findStockById(stockId);
    if (!stock) {
        return 'Stock not found';
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
    const { minPrice, maxPrice, sector, sortBy, order } = query;
    if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
        return 'Invalid minPrice parameter';
    }
    if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
        return 'Invalid maxPrice parameter';
    }
    if (sector && typeof sector !== 'string') {
        return 'Invalid sector parameter';
    }
    if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
        return 'Invalid sortBy parameter';
    }
    if (order && !['asc', 'desc'].includes(order)) {
        return 'Invalid order parameter';
    }
    return null;
}

// Update market cap for all stocks
function updateAllMarketCaps() {
    stocks = stocks.map(stock => ({
        ...stock,
        marketCap: calculateMarketCap(stock)
    }));
}

// Controller to get all stocks with enhanced filtering and sorting
export function getAllStocks(req, res) {
    try {
        const { minPrice, maxPrice, sector, sortBy, order } = req.query;
        const validationError = validateQueryParams(req.query);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        updateAllMarketCaps();
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

        if (sortBy) {
            filteredStocks.sort((a, b) => {
                const valueA = a[sortBy];
                const valueB = b[sortBy];
                if (order === 'desc') {
                    return valueB - valueA;
                }
                return valueA - valueB;
            });
        }

        res.status(200).json({
            success: true,
            count: filteredStocks.length,
            data: filteredStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get a single stock by ID
export function getStockById(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        stock.marketCap = calculateMarketCap(stock);
        res.status(200).json({ success: true, data: stock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to create a new stock
export function createStock(req, res) {
    try {
        const newStock = {
            id: generateStockId(),
            symbol: req.body.symbol,
            name: req.body.name,
            price: req.body.price,
            quantity: req.body.quantity,
            sector: req.body.sector,
            lastUpdated: new Date(),
            marketCap: 0
        };

        const validationError = validateStockData(newStock);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        newStock.marketCap = calculateMarketCap(newStock);
        stocks.push(newStock);
        res.status(201).json({ success: true, data: newStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to update an existing stock
export function updateStock(req, res) {
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
            sector: req.body.sector || stocks[stockIndex].sector,
            lastUpdated: new Date()
        };

        const validationError = validateStockData(updatedStock);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        updatedStock.marketCap = calculateMarketCap(updatedStock);
        stocks[stockIndex] = updatedStock;
        res.status(200).json({ success: true, data: updatedStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to delete a stock
export function deleteStock(req, res) {
    try {
        const stockIndex = findStockIndexById(req.params.id);
        if (stockIndex === -1) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const deletedStock = stocks.splice(stockIndex, 1)[0];
        // Remove from watchlist if present
        watchlist = watchlist.filter(item => item !== deletedStock.id);
        res.status(200).json({ success: true, data: deletedStock });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stock statistics
export function getStockStats(req, res) {
    try {
        updateAllMarketCaps();
        const totalStocks = stocks.length;
        const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
        const sectors = [...new Set(stocks.map(stock => stock.sector))];
        const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
        const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalStocks,
                totalValue: parseFloat(totalValue.toFixed(2)),
                sectors,
                averagePrice: parseFloat(avgPrice.toFixed(2)),
                averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stocks by sector
export function getStocksBySector(req, res) {
    try {
        const sector = req.params.sector;
        if (!sector || typeof sector !== 'string') {
            return res.status(400).json({ error: 'Invalid sector parameter' });
        }

        updateAllMarketCaps();
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
}

// Controller to get stock price history (simulated)
export function getStockPriceHistory(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate 90 days of price history
        const history = Array.from({ length: 90 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
            volume: Math.floor(Math.random() * 1000000)
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
}

// Controller to bulk create stocks
export function bulkCreateStocks(req, res) {
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
                sector: stock.sector,
                lastUpdated: new Date(),
                marketCap: 0
            };

            const validationError = validateStockData(newStock);
            if (validationError) {
                return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
            }

            newStock.marketCap = calculateMarketCap(newStock);
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
}

// Controller to bulk delete stocks
export function bulkDeleteStocks(req, res) {
    try {
        const ids = req.body.ids;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Input must be an array of stock IDs' });
        }

        const deletedStocks = [];
        for (const id of ids) {
            const stockIndex = findStockIndexById(id);
            if (stockIndex !== -1) {
                const deletedStock = stocks.splice(stockIndex, 1)[0];
                watchlist = watchlist.filter(item => item !== deletedStock.id);
                deletedStocks.push(deletedStock);
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
}

// Controller to search stocks by symbol or name
export function searchStocks(req, res) {
    try {
        const query = req.query.q;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Invalid search query' });
        }

        updateAllMarketCaps();
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
}

// Controller to get top performing stocks
export function getTopPerformingStocks(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const metric = req.query.metric || 'price';
        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid limit parameter' });
        }
        if (!['price', 'marketCap', 'quantity'].includes(metric)) {
            return res.status(400).json({ error: 'Invalid metric parameter' });
        }

        updateAllMarketCaps();
        const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
        res.status(200).json({
            success: true,
            count: sortedStocks.length,
            data: sortedStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to update stock price
export function updateStockPrice(req, res) {
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
        stocks[stockIndex].lastUpdated = new Date();
        stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
        res.status(200).json({
            success: true,
            data: stocks[stockIndex]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to update stock quantity
export function updateStockQuantity(req, res) {
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
        stocks[stockIndex].lastUpdated = new Date();
        stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
        res.status(200).json({
            success: true,
            data: stocks[stockIndex]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get low stock alerts
export function getLowStockAlerts(req, res) {
    try {
        const threshold = parseInt(req.query.threshold) || 100;
        if (isNaN(threshold) || threshold < 0) {
            return res.status(400).json({ error: 'Invalid threshold parameter' });
        }

        updateAllMarketCaps();
        const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
        res.status(200).json({
            success: true,
            count: lowStocks.length,
            data: lowStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stock value
export function getStockValue(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const totalValue = calculateMarketCap(stock);
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
}

// Controller to export stock data (simulated CSV)
export function exportStockData(req, res) {
    try {
        updateAllMarketCaps();
        const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
        const csvData = stocks.map(stock =>
            `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
        ).join('\n');
        
        res.status(200).json({
            success: true,
            data: csvHeader + csvData
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to import stock data (simulated from CSV)
export function importStockData(req, res) {
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
                sector,
                lastUpdated: new Date(),
                marketCap: 0
            };

            const validationError = validateStockData(newStock);
            if (validationError) {
                return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
            }

            newStock.marketCap = calculateMarketCap(newStock);
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
}

// Controller to get stock performance metrics
export function getStockPerformance(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate performance metrics
        const performance = {
            symbol: stock.symbol,
            currentPrice: stock.price,
            changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
            volume: Math.floor(Math.random() * 1000000),
            marketCap: calculateMarketCap(stock),
            peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
            dividendYield: (Math.random() * 5).toFixed(2)
        };

        res.status(200).json({
            success: true,
            data: performance
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stock portfolio summary
export function getPortfolioSummary(req, res) {
    try {
        updateAllMarketCaps();
        const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
        const sectorBreakdown = stocks.reduce((acc, stock) => {
            acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
            return acc;
        }, {});
        const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

        res.status(200).json({
            success: true,
            data: {
                totalValue: parseFloat(totalValue.toFixed(2)),
                sectorBreakdown,
                topHoldings
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to add stock to watchlist
export function addToWatchlist(req, res) {
    try {
        const stockId = parseInt(req.params.id);
        const validationError = validateWatchlistData(stockId);
        if (validationError) {
            return res.status(404).json({ error: validationError });
        }

        if (watchlist.includes(stockId)) {
            return res.status(400).json({ error: 'Stock already in watchlist' });
        }

        watchlist.push(stockId);
        const stock = findStockById(stockId);
        res.status(200).json({
            success: true,
            data: {
                stockId,
                symbol: stock.symbol,
                watchlistCount: watchlist.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to remove stock from watchlist
export function removeFromWatchlist(req, res) {
    try {
        const stockId = parseInt(req.params.id);
        const validationError = validateWatchlistData(stockId);
        if (validationError) {
            return res.status(404).json({ error: validationError });
        }

        if (!watchlist.includes(stockId)) {
            return res.status(400).json({ error: 'Stock not in watchlist' });
        }

        watchlist = watchlist.filter(id => id !== stockId);
        const stock = findStockById(stockId);
        res.status(200).json({
            success: true,
            data: {
                stockId,
                symbol: stock.symbol,
                watchlistCount: watchlist.length
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get watchlist
export function getWatchlist(req, res) {
    try {
        updateAllMarketCaps();
        const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
        res.status(200).json({
            success: true,
            count: watchlistStocks.length,
            data: watchlistStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stock volatility (simulated)
export function getStockVolatility(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate volatility calculation
        const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
        const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
        const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
        const volatility = Math.sqrt(variance);

        res.status(200).json({
            success: true,
            data: {
                symbol: stock.symbol,
                volatility: parseFloat(volatility.toFixed(2)),
                meanPrice: parseFloat(meanPrice.toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get stock correlations (simulated)
export function getStockCorrelations(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        // Simulate correlations with other stocks
        const correlations = stocks
            .filter(s => s.id !== stock.id)
            .map(s => ({
                symbol: s.symbol,
                correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
            }));

        res.status(200).json({
            success: true,
            data: {
                symbol: stock.symbol,
                correlations
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get sector performance
export function getSectorPerformance(req, res) {
    try {
        updateAllMarketCaps();
        const sectorPerformance = stocks.reduce((acc, stock) => {
            if (!acc[stock.sector]) {
                acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
            }
            acc[stock.sector].totalMarketCap += stock.marketCap;
            acc[stock.sector].stockCount += 1;
            acc[stock.sector].avgPrice += stock.price;
            return acc;
        }, {});

        Object.keys(sectorPerformance).forEach(sector => {
            sectorPerformance[sector].avgPrice = parseFloat(
                (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
            );
            sectorPerformance[sector].totalMarketCap = parseFloat(
                sectorPerformance[sector].totalMarketCap.toFixed(2)
            );
        });

        res.status(200).json({
            success: true,
            data: sectorPerformance
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to simulate stock price update batch
export function batchUpdateStockPrices(req, res) {
    try {
        const updates = req.body.updates;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: 'Input must be an array of updates' });
        }

        const updatedStocks = [];
        for (const update of updates) {
            const stockIndex = findStockIndexById(update.id);
            if (stockIndex === -1) continue;

            const newPrice = update.price;
            if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
                continue;
            }

            stocks[stockIndex].price = newPrice;
            stocks[stockIndex].lastUpdated = new Date();
            stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
            updatedStocks.push(stocks[stockIndex]);
        }

        res.status(200).json({
            success: true,
            count: updatedStocks.length,
            data: updatedStocks
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to get historical stock value (simulated)
export function getHistoricalStockValue(req, res) {
    try {
        const stock = findStockById(req.params.id);
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        const days = parseInt(req.query.days) || 30;
        if (isNaN(days) || days <= 0) {
            return res.status(400).json({ error: 'Invalid days parameter' });
        }

        const history = Array.from({ length: days }, (_, i) => {
            const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
            return {
                date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                value: parseFloat((price * stock.quantity).toFixed(2))
            };
        }).reverse();

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
}



// //new
// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }


// //new
// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }


// //new
// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }


// //new
// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }


// //new
// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }


// //new

// let stocks = [
//     { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, quantity: 1000, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 2, symbol: 'MSFT', name: 'Microsoft Corporation', price: 305.50, quantity: 800, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 3, symbol: 'TSLA', name: 'Tesla, Inc.', price: 720.10, quantity: 500, sector: 'Automotive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 4, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, quantity: 300, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3400.75, quantity: 200, sector: 'Consumer Cyclical', lastUpdated: new Date(), marketCap: 0 },
//     // Additional initial stocks for larger dataset
//     { id: 6, symbol: 'NVDA', name: 'NVIDIA Corporation', price: 333.45, quantity: 600, sector: 'Technology', lastUpdated: new Date(), marketCap: 0 },
//     { id: 7, symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 165.20, quantity: 700, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 8, symbol: 'V', name: 'Visa Inc.', price: 230.10, quantity: 400, sector: 'Financial Services', lastUpdated: new Date(), marketCap: 0 },
//     { id: 9, symbol: 'WMT', name: 'Walmart Inc.', price: 140.55, quantity: 900, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
//     { id: 10, symbol: 'PG', name: 'Procter & Gamble Co.', price: 144.30, quantity: 500, sector: 'Consumer Defensive', lastUpdated: new Date(), marketCap: 0 },
// ];

// // Simulated watchlist
// let watchlist = [];

// // Utility function to calculate market cap
// function calculateMarketCap(stock) {
//     return stock.price * stock.quantity;
// }

// // Utility function to validate stock data
// function validateStockData(stock) {
//     if (!stock.symbol || typeof stock.symbol !== 'string' || stock.symbol.length > 10) {
//         return 'Invalid or missing stock symbol';
//     }
//     if (!stock.name || typeof stock.name !== 'string' || stock.name.length > 100) {
//         return 'Invalid or missing stock name';
//     }
//     if (!stock.price || typeof stock.price !== 'number' || stock.price <= 0) {
//         return 'Invalid or missing stock price';
//     }
//     if (!stock.quantity || typeof stock.quantity !== 'number' || stock.quantity < 0) {
//         return 'Invalid or missing stock quantity';
//     }
//     if (!stock.sector || typeof stock.sector !== 'string' || stock.sector.length > 50) {
//         return 'Invalid or missing stock sector';
//     }
//     return null;
// }

// // Utility function to validate watchlist data
// function validateWatchlistData(stockId) {
//     const stock = findStockById(stockId);
//     if (!stock) {
//         return 'Stock not found';
//     }
//     return null;
// }

// // Utility function to find stock by ID
// function findStockById(id) {
//     return stocks.find(stock => stock.id === parseInt(id));
// }

// // Utility function to find stock index by ID
// function findStockIndexById(id) {
//     return stocks.findIndex(stock => stock.id === parseInt(id));
// }

// // Utility function to generate a new stock ID
// function generateStockId() {
//     return stocks.length > 0 ? Math.max(...stocks.map(stock => stock.id)) + 1 : 1;
// }

// // Utility function to validate query parameters
// function validateQueryParams(query) {
//     const { minPrice, maxPrice, sector, sortBy, order } = query;
//     if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//         return 'Invalid minPrice parameter';
//     }
//     if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//         return 'Invalid maxPrice parameter';
//     }
//     if (sector && typeof sector !== 'string') {
//         return 'Invalid sector parameter';
//     }
//     if (sortBy && !['price', 'quantity', 'marketCap'].includes(sortBy)) {
//         return 'Invalid sortBy parameter';
//     }
//     if (order && !['asc', 'desc'].includes(order)) {
//         return 'Invalid order parameter';
//     }
//     return null;
// }

// // Update market cap for all stocks
// function updateAllMarketCaps() {
//     stocks = stocks.map(stock => ({
//         ...stock,
//         marketCap: calculateMarketCap(stock)
//     }));
// }

// // Controller to get all stocks with enhanced filtering and sorting
// export function getAllStocks(req, res) {
//     try {
//         const { minPrice, maxPrice, sector, sortBy, order } = req.query;
//         const validationError = validateQueryParams(req.query);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updateAllMarketCaps();
//         let filteredStocks = [...stocks];

//         if (minPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price >= parseFloat(minPrice));
//         }
//         if (maxPrice) {
//             filteredStocks = filteredStocks.filter(stock => stock.price <= parseFloat(maxPrice));
//         }
//         if (sector) {
//             filteredStocks = filteredStocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         }

//         if (sortBy) {
//             filteredStocks.sort((a, b) => {
//                 const valueA = a[sortBy];
//                 const valueB = b[sortBy];
//                 if (order === 'desc') {
//                     return valueB - valueA;
//                 }
//                 return valueA - valueB;
//             });
//         }

//         res.status(200).json({
//             success: true,
//             count: filteredStocks.length,
//             data: filteredStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get a single stock by ID
// export function getStockById(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }
//         stock.marketCap = calculateMarketCap(stock);
//         res.status(200).json({ success: true, data: stock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to create a new stock
// export function createStock(req, res) {
//     try {
//         const newStock = {
//             id: generateStockId(),
//             symbol: req.body.symbol,
//             name: req.body.name,
//             price: req.body.price,
//             quantity: req.body.quantity,
//             sector: req.body.sector,
//             lastUpdated: new Date(),
//             marketCap: 0
//         };

//         const validationError = validateStockData(newStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         newStock.marketCap = calculateMarketCap(newStock);
//         stocks.push(newStock);
//         res.status(201).json({ success: true, data: newStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update an existing stock
// export function updateStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const updatedStock = {
//             ...stocks[stockIndex],
//             symbol: req.body.symbol || stocks[stockIndex].symbol,
//             name: req.body.name || stocks[stockIndex].name,
//             price: req.body.price || stocks[stockIndex].price,
//             quantity: req.body.quantity || stocks[stockIndex].quantity,
//             sector: req.body.sector || stocks[stockIndex].sector,
//             lastUpdated: new Date()
//         };

//         const validationError = validateStockData(updatedStock);
//         if (validationError) {
//             return res.status(400).json({ error: validationError });
//         }

//         updatedStock.marketCap = calculateMarketCap(updatedStock);
//         stocks[stockIndex] = updatedStock;
//         res.status(200).json({ success: true, data: updatedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to delete a stock
// export function deleteStock(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const deletedStock = stocks.splice(stockIndex, 1)[0];
//         // Remove from watchlist if present
//         watchlist = watchlist.filter(item => item !== deletedStock.id);
//         res.status(200).json({ success: true, data: deletedStock });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock statistics
// export function getStockStats(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalStocks = stocks.length;
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectors = [...new Set(stocks.map(stock => stock.sector))];
//         const avgPrice = totalStocks > 0 ? (stocks.reduce((sum, stock) => sum + stock.price, 0) / totalStocks) : 0;
//         const avgMarketCap = totalStocks > 0 ? (totalValue / totalStocks) : 0;

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalStocks,
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectors,
//                 averagePrice: parseFloat(avgPrice.toFixed(2)),
//                 averageMarketCap: parseFloat(avgMarketCap.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stocks by sector
// export function getStocksBySector(req, res) {
//     try {
//         const sector = req.params.sector;
//         if (!sector || typeof sector !== 'string') {
//             return res.status(400).json({ error: 'Invalid sector parameter' });
//         }

//         updateAllMarketCaps();
//         const sectorStocks = stocks.filter(stock => stock.sector.toLowerCase() === sector.toLowerCase());
//         if (sectorStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for this sector' });
//         }

//         res.status(200).json({
//             success: true,
//             count: sectorStocks.length,
//             data: sectorStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock price history (simulated)
// export function getStockPriceHistory(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate 90 days of price history
//         const history = Array.from({ length: 90 }, (_, i) => ({
//             date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             price: stock.price * (1 + (Math.random() - 0.5) * 0.15), // Random variation ±7.5%
//             volume: Math.floor(Math.random() * 1000000)
//         })).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk create stocks
// export function bulkCreateStocks(req, res) {
//     try {
//         const newStocks = req.body;
//         if (!Array.isArray(newStocks)) {
//             return res.status(400).json({ error: 'Input must be an array of stocks' });
//         }

//         const createdStocks = [];
//         for (const stock of newStocks) {
//             const newStock = {
//                 id: generateStockId(),
//                 symbol: stock.symbol,
//                 name: stock.name,
//                 price: stock.price,
//                 quantity: stock.quantity,
//                 sector: stock.sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             createdStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: createdStocks.length,
//             data: createdStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to bulk delete stocks
// export function bulkDeleteStocks(req, res) {
//     try {
//         const ids = req.body.ids;
//         if (!Array.isArray(ids)) {
//             return res.status(400).json({ error: 'Input must be an array of stock IDs' });
//         }

//         const deletedStocks = [];
//         for (const id of ids) {
//             const stockIndex = findStockIndexById(id);
//             if (stockIndex !== -1) {
//                 const deletedStock = stocks.splice(stockIndex, 1)[0];
//                 watchlist = watchlist.filter(item => item !== deletedStock.id);
//                 deletedStocks.push(deletedStock);
//             }
//         }

//         if (deletedStocks.length === 0) {
//             return res.status(404).json({ error: 'No stocks found for provided IDs' });
//         }

//         res.status(200).json({
//             success: true,
//             count: deletedStocks.length,
//             data: deletedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to search stocks by symbol or name
// export function searchStocks(req, res) {
//     try {
//         const query = req.query.q;
//         if (!query || typeof query !== 'string') {
//             return res.status(400).json({ error: 'Invalid search query' });
//         }

//         updateAllMarketCaps();
//         const searchResults = stocks.filter(stock =>
//             stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
//             stock.name.toLowerCase().includes(query.toLowerCase())
//         );

//         res.status(200).json({
//             success: true,
//             count: searchResults.length,
//             data: searchResults
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get top performing stocks
// export function getTopPerformingStocks(req, res) {
//     try {
//         const limit = parseInt(req.query.limit) || 5;
//         const metric = req.query.metric || 'price';
//         if (isNaN(limit) || limit <= 0) {
//             return res.status(400).json({ error: 'Invalid limit parameter' });
//         }
//         if (!['price', 'marketCap', 'quantity'].includes(metric)) {
//             return res.status(400).json({ error: 'Invalid metric parameter' });
//         }

//         updateAllMarketCaps();
//         const sortedStocks = [...stocks].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
//         res.status(200).json({
//             success: true,
//             count: sortedStocks.length,
//             data: sortedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock price
// export function updateStockPrice(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newPrice = req.body.price;
//         if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//             return res.status(400).json({ error: 'Invalid price' });
//         }

//         stocks[stockIndex].price = newPrice;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to update stock quantity
// export function updateStockQuantity(req, res) {
//     try {
//         const stockIndex = findStockIndexById(req.params.id);
//         if (stockIndex === -1) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const newQuantity = req.body.quantity;
//         if (!newQuantity || typeof newQuantity !== 'number' || newQuantity < 0) {
//             return res.status(400).json({ error: 'Invalid quantity' });
//         }

//         stocks[stockIndex].quantity = newQuantity;
//         stocks[stockIndex].lastUpdated = new Date();
//         stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//         res.status(200).json({
//             success: true,
//             data: stocks[stockIndex]
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get low stock alerts
// export function getLowStockAlerts(req, res) {
//     try {
//         const threshold = parseInt(req.query.threshold) || 100;
//         if (isNaN(threshold) || threshold < 0) {
//             return res.status(400).json({ error: 'Invalid threshold parameter' });
//         }

//         updateAllMarketCaps();
//         const lowStocks = stocks.filter(stock => stock.quantity <= threshold);
//         res.status(200).json({
//             success: true,
//             count: lowStocks.length,
//             data: lowStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock value
// export function getStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const totalValue = calculateMarketCap(stock);
//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 totalValue: parseFloat(totalValue.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to export stock data (simulated CSV)
// export function exportStockData(req, res) {
//     try {
//         updateAllMarketCaps();
//         const csvHeader = 'ID,Symbol,Name,Price,Quantity,Sector,MarketCap,LastUpdated\n';
//         const csvData = stocks.map(stock =>
//             `${stock.id},${stock.symbol},${stock.name},${stock.price},${stock.quantity},${stock.sector},${stock.marketCap},${stock.lastUpdated.toISOString()}`
//         ).join('\n');
        
//         res.status(200).json({
//             success: true,
//             data: csvHeader + csvData
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to import stock data (simulated from CSV)
// export function importStockData(req, res) {
//     try {
//         const csvData = req.body.csv;
//         if (!csvData || typeof csvData !== 'string') {
//             return res.status(400).json({ error: 'Invalid CSV data' });
//         }

//         const lines = csvData.split('\n').slice(1); // Skip header
//         const importedStocks = [];

//         for (const line of lines) {
//             const [id, symbol, name, price, quantity, sector] = line.split(',');
//             const newStock = {
//                 id: parseInt(id) || generateStockId(),
//                 symbol,
//                 name,
//                 price: parseFloat(price),
//                 quantity: parseInt(quantity),
//                 sector,
//                 lastUpdated: new Date(),
//                 marketCap: 0
//             };

//             const validationError = validateStockData(newStock);
//             if (validationError) {
//                 return res.status(400).json({ error: `Validation failed for stock: ${validationError}` });
//             }

//             newStock.marketCap = calculateMarketCap(newStock);
//             stocks.push(newStock);
//             importedStocks.push(newStock);
//         }

//         res.status(201).json({
//             success: true,
//             count: importedStocks.length,
//             data: importedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock performance metrics
// export function getStockPerformance(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate performance metrics
//         const performance = {
//             symbol: stock.symbol,
//             currentPrice: stock.price,
//             changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
//             volume: Math.floor(Math.random() * 1000000),
//             marketCap: calculateMarketCap(stock),
//             peRatio: (stock.price / (Math.random() * 10 + 5)).toFixed(2),
//             dividendYield: (Math.random() * 5).toFixed(2)
//         };

//         res.status(200).json({
//             success: true,
//             data: performance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock portfolio summary
// export function getPortfolioSummary(req, res) {
//     try {
//         updateAllMarketCaps();
//         const totalValue = stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
//         const sectorBreakdown = stocks.reduce((acc, stock) => {
//             acc[stock.sector] = (acc[stock.sector] || 0) + stock.marketCap;
//             return acc;
//         }, {});
//         const topHoldings = [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5);

//         res.status(200).json({
//             success: true,
//             data: {
//                 totalValue: parseFloat(totalValue.toFixed(2)),
//                 sectorBreakdown,
//                 topHoldings
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to add stock to watchlist
// export function addToWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock already in watchlist' });
//         }

//         watchlist.push(stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to remove stock from watchlist
// export function removeFromWatchlist(req, res) {
//     try {
//         const stockId = parseInt(req.params.id);
//         const validationError = validateWatchlistData(stockId);
//         if (validationError) {
//             return res.status(404).json({ error: validationError });
//         }

//         if (!watchlist.includes(stockId)) {
//             return res.status(400).json({ error: 'Stock not in watchlist' });
//         }

//         watchlist = watchlist.filter(id => id !== stockId);
//         const stock = findStockById(stockId);
//         res.status(200).json({
//             success: true,
//             data: {
//                 stockId,
//                 symbol: stock.symbol,
//                 watchlistCount: watchlist.length
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get watchlist
// export function getWatchlist(req, res) {
//     try {
//         updateAllMarketCaps();
//         const watchlistStocks = watchlist.map(id => findStockById(id)).filter(stock => stock);
//         res.status(200).json({
//             success: true,
//             count: watchlistStocks.length,
//             data: watchlistStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock volatility (simulated)
// export function getStockVolatility(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate volatility calculation
//         const priceHistory = Array.from({ length: 30 }, (_, i) => stock.price * (1 + (Math.random() - 0.5) * 0.1));
//         const meanPrice = priceHistory.reduce((sum, price) => sum + price, 0) / priceHistory.length;
//         const variance = priceHistory.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / priceHistory.length;
//         const volatility = Math.sqrt(variance);

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 volatility: parseFloat(volatility.toFixed(2)),
//                 meanPrice: parseFloat(meanPrice.toFixed(2))
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get stock correlations (simulated)
// export function getStockCorrelations(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         // Simulate correlations with other stocks
//         const correlations = stocks
//             .filter(s => s.id !== stock.id)
//             .map(s => ({
//                 symbol: s.symbol,
//                 correlation: parseFloat((Math.random() * 2 - 1).toFixed(2)) // Random correlation between -1 and 1
//             }));

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 correlations
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get sector performance
// export function getSectorPerformance(req, res) {
//     try {
//         updateAllMarketCaps();
//         const sectorPerformance = stocks.reduce((acc, stock) => {
//             if (!acc[stock.sector]) {
//                 acc[stock.sector] = { totalMarketCap: 0, stockCount: 0, avgPrice: 0 };
//             }
//             acc[stock.sector].totalMarketCap += stock.marketCap;
//             acc[stock.sector].stockCount += 1;
//             acc[stock.sector].avgPrice += stock.price;
//             return acc;
//         }, {});

//         Object.keys(sectorPerformance).forEach(sector => {
//             sectorPerformance[sector].avgPrice = parseFloat(
//                 (sectorPerformance[sector].avgPrice / sectorPerformance[sector].stockCount).toFixed(2)
//             );
//             sectorPerformance[sector].totalMarketCap = parseFloat(
//                 sectorPerformance[sector].totalMarketCap.toFixed(2)
//             );
//         });

//         res.status(200).json({
//             success: true,
//             data: sectorPerformance
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to simulate stock price update batch
// export function batchUpdateStockPrices(req, res) {
//     try {
//         const updates = req.body.updates;
//         if (!Array.isArray(updates)) {
//             return res.status(400).json({ error: 'Input must be an array of updates' });
//         }

//         const updatedStocks = [];
//         for (const update of updates) {
//             const stockIndex = findStockIndexById(update.id);
//             if (stockIndex === -1) continue;

//             const newPrice = update.price;
//             if (!newPrice || typeof newPrice !== 'number' || newPrice <= 0) {
//                 continue;
//             }

//             stocks[stockIndex].price = newPrice;
//             stocks[stockIndex].lastUpdated = new Date();
//             stocks[stockIndex].marketCap = calculateMarketCap(stocks[stockIndex]);
//             updatedStocks.push(stocks[stockIndex]);
//         }

//         res.status(200).json({
//             success: true,
//             count: updatedStocks.length,
//             data: updatedStocks
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

// // Controller to get historical stock value (simulated)
// export function getHistoricalStockValue(req, res) {
//     try {
//         const stock = findStockById(req.params.id);
//         if (!stock) {
//             return res.status(404).json({ error: 'Stock not found' });
//         }

//         const days = parseInt(req.query.days) || 30;
//         if (isNaN(days) || days <= 0) {
//             return res.status(400).json({ error: 'Invalid days parameter' });
//         }

//         const history = Array.from({ length: days }, (_, i) => {
//             const price = stock.price * (1 + (Math.random() - 0.5) * 0.1);
//             return {
//                 date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 value: parseFloat((price * stock.quantity).toFixed(2))
//             };
//         }).reverse();

//         res.status(200).json({
//             success: true,
//             data: {
//                 symbol: stock.symbol,
//                 history
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }






































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































