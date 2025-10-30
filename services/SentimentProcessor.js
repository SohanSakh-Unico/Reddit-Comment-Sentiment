// File: services/SentimentProcessor.js

const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

function calculateSentiment(reviewText) {
    if (!reviewText || typeof reviewText !== 'string' || reviewText.trim() === '') {
        return { score: 0.0000, label: "Neutral" };
    }
    
    const analysis = sentimentAnalyzer.analyze(reviewText); 
    
    let label = 'Neutral';
    if (analysis.score > 2) { 
        label = 'Positive';
    } else if (analysis.score < -2) {
        label = 'Negative';
    }
    
    return {
        score: parseFloat(analysis.score.toFixed(4)), 
        label: label,
    };
}

module.exports = { calculateSentiment };