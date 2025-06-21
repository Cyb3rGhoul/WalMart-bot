// Popup script for Walmart Grocery Extension
document.addEventListener('DOMContentLoaded', function() {
    console.log('Walmart Grocery Extension popup loaded');
    
    // Handle open app button
    const openAppBtn = document.getElementById('openApp');
    if (openAppBtn) {
        openAppBtn.addEventListener('click', function() {
            // Open the web app in a new tab
            chrome.tabs.create({
                url: 'http://localhost:5173', // Adjust this URL to your app's URL
                active: true
            });
            
            // Close the popup
            window.close();
        });
    }
    
    // Check if we're on Walmart page
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes('walmart.com')) {
            updateStatus('On Walmart - Ready to search!');
        } else {
            updateStatus('Navigate to Walmart.com for searching');
        }
    });
});

function updateStatus(message) {
    const statusText = document.querySelector('.status p');
    if (statusText) {
        statusText.textContent = message;
    }
}