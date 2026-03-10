const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, { 
    runScripts: "dangerously", 
    resources: "usable",
    url: "http://localhost/",
    virtualConsole: new jsdom.VirtualConsole().sendTo(console)
});

dom.window.addEventListener('error', (e) => {
    console.error('DOM Error:', e.error || e.message);
});

dom.window.document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
});

setTimeout(() => {
    console.log('Timeout. Checking reminder options:');
    const select = dom.window.document.getElementById('reminder-sound');
    if (select) {
        console.log('Options count:', select.options.length);
        console.log('Last option text:', select.options[select.options.length - 1].textContent);
    } else {
        console.log('Select not found');
    }
}, 3000);
