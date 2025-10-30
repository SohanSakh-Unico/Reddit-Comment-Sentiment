// File: services/fetchLiveReviews.js (Final Version)

const axios = require('axios');

const API_CONFIG = {
    headers: {
        'User-Agent': 'SentimentPoC/1.0 (by u/SohanDev)' 
    }
};

// Helper function to extract and clean Reddit data
const mapAndCleanData = (rawPosts, source) => {
    return rawPosts.map(post => {
        const data = post.data;
        const postContent = data.title + ' - ' + (data.selftext || data.body || '');
        
        return {
            source_platform: source,
            source_id: data.id, 
            content: postContent, 
            reviewer_handle: data.author,
            // Simple proxy for rating
            rating_score: data.score > 10 ? 5 : (data.score < 0 ? 1 : 3), 
            published_date: new Date(data.created_utc * 1000),
        };
    });
};

/**
 * FETCH 1: Gets posts directly from a subreddit feed.
 */
async function fetchPostsFromSubreddit(subredditName, limit) {
    const url = `https://www.reddit.com/r/${subredditName}/new.json?limit=${limit}`;
    try {
        const response = await axios.get(url, API_CONFIG);
        const rawPosts = response.data.data.children;
        return mapAndCleanData(rawPosts, `r/${subredditName}`);
    } catch (error) {
        return [];
    }
}

/**
 * FETCH 2: Uses Reddit's search endpoint for a specific query.
 */
async function fetchPostsFromSearch(keyword, limit) {
    const encodedKeyword = encodeURIComponent(keyword);
    // Use the global search endpoint
    const url = `https://www.reddit.com/search.json?q=${encodedKeyword}&limit=${limit}&sort=new`;
    try {
        const response = await axios.get(url, API_CONFIG);
        const rawPosts = response.data.data.children;
        return mapAndCleanData(rawPosts, 'reddit_search');
    } catch (error) {
        return [];
    }
}

module.exports = { fetchPostsFromSubreddit, fetchPostsFromSearch };