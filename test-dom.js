const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

dom.window.addEventListener('error', (e) => {
    console.error('DOM Error:', e.error);
});
dom.window.document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
});
