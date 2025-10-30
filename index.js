// File: index.js (Final Version)

const express = require('express');
const app = express();
const PORT = 3000;

// Import core services (we'll consolidate fetch logic next)
const { fetchPostsFromSubreddit, fetchPostsFromSearch } = require('./services/fetchLiveReviews');
const { calculateSentiment } = require('./services/SentimentProcessor');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// THE FINAL DYNAMIC API ROUTE
app.get('/api/sentiment', async (req, res) => {
    try {
        // 1. INPUT VALIDATION & DEFAULT VALUES
        const subreddit = req.query.subreddit || 'GreeceTravel';
        const query = req.query.query ? req.query.query.trim() : null; // Check if query is provided
        const limit = parseInt(req.query.limit, 10) || 15;

        if (limit < 1 || limit > 50) { 
            return res.status(400).json({ success: false, error: "Limit must be between 1 and 50 posts." });
        }

        let rawReviews = [];
        let source_used = '';

        // 2. DYNAMIC IDENTIFICATION LOGIC (The Core Architectural Decision)
        if (query) {
            // PRIORITY 1: If QUERY is provided, use the global SEARCH feed (best for specific brands)
            console.log(`-> Running Search Query: "${query}" (Limit: ${limit})...`);
            rawReviews = await fetchPostsFromSearch(query, limit);
            source_used = 'Reddit Search';
        } else {
            // PRIORITY 2: Use the relevant SUBREDDIT feed (best for general community pulse)
            console.log(`-> Running Subreddit Feed: r/${subreddit} (Limit: ${limit})...`);
            rawReviews = await fetchPostsFromSubreddit(subreddit, limit);
            source_used = `r/${subreddit} Feed`;
        }

        // 3. ERROR CHECK
        if (rawReviews.length === 0) {
            return res.status(503).json({ success: false, error: `Could not fetch live data from ${source_used}.` });
        }

        // 4. PROCESS SENTIMENT
        const processedReviews = rawReviews.map(review => {
            const sentimentResult = calculateSentiment(review.content);
            return {
                ...review,
                sentiment_score: sentimentResult.score,
                sentiment_label: sentimentResult.label,
                content_snippet: review.content.substring(0, 180).replace(/\s\s+/g, ' ') + '...' 
            };
        });

        // 5. Send results back, including the parameters used
        res.json({ 
            success: true, 
            reviews: processedReviews, 
            parameters: { subreddit, query, limit, source_used } 
        });

    } catch (error) {
        console.error("Critical error in /api/sentiment:", error.message);
        res.status(500).json({ success: false, error: "Internal Server Error during analysis." });
    }
});

app.listen(PORT, () => {
    console.log(`\n✨ PoC Server READY! View the demo at: http://localhost:${PORT}`);
    console.log("---------------------------------------------------------------");
});