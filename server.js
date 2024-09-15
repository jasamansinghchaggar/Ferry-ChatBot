const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const natural = require('natural');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve index.html on the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Load FAQs from JSON file
const faq = JSON.parse(fs.readFileSync(path.join(__dirname, 'faq.json'), 'utf8'));
console.log(faq);
app.post('/chat', (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    let botReply = "Sorry, I don't understand that question.";
    let suggestions = [];

    // Tokenize and stem the user message
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;
    const tokens = tokenizer.tokenize(userMessage).map(token => stemmer.stem(token));

    // Check for keyword matches using cosine similarity
    let maxSimilarity = 0;
    let bestMatch = null;
    faq.forEach(faqItem => {
        const keyTokens = tokenizer.tokenize(faqItem.question).map(token => stemmer.stem(token));
        const similarity = natural.JaroWinklerDistance(tokens.join(' '), keyTokens.join(' '));
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = faqItem;
        }
        if (similarity > 0.5 && similarity < 0.9) {
            suggestions.push(faqItem.question);
        }
    });

    if (maxSimilarity >= 0.9) {
        botReply = bestMatch.answer;
    } else if (suggestions.length > 0) {
        botReply = "Are you searching for: " + suggestions.join(', ') + "?";
    }

    res.json({ reply: botReply });
});

app.listen(port, () => {
    console.log(`Chatbot server running at http://localhost:${port}`);
});