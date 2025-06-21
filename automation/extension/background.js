// Background script for Walmart Grocery Extension
console.log('Walmart Grocery Extension background script loaded');

// Listen for messages from the webpage
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'SEND_GROCERY_LIST') {
    handleGroceryList(message.groceryList, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received internal message:', message);
  
  if (message.action === 'CONTENT_SCRIPT_READY') {
    // Content script is ready, we can send the grocery list
    console.log('Content script is ready');
    sendResponse({ status: 'acknowledged' });
  }
  
  return true;
});

async function handleGroceryList(groceryList, sendResponse) {
  try {
    console.log('Processing grocery list:', groceryList);
    
    // Create a new tab with Walmart
    const tab = await chrome.tabs.create({
      url: 'https://www.walmart.com',
      active: true
    });
    
    console.log('Created Walmart tab:', tab.id);
    
    // Wait for the tab to complete loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tabInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        console.log('Walmart tab loaded completely');
        
        // Remove the listener to avoid multiple calls
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Send the grocery list to the content script
          chrome.tabs.sendMessage(tab.id, {
            action: 'SEARCH_GROCERY_ITEMS',
            groceryList: groceryList
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message to content script:', chrome.runtime.lastError);
              sendResponse({ 
                success: false, 
                error: 'Failed to communicate with Walmart page' 
              });
            } else {
              console.log('Successfully sent grocery list to content script');
              sendResponse({ 
                success: true, 
                message: 'Grocery list sent to Walmart successfully' 
              });
            }
          });
        }, 2000); // 2 second delay
      }
    });
    
  } catch (error) {
    console.error('Error in handleGroceryList:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Walmart Grocery Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Show welcome message or setup instructions
    console.log('Extension installed for the first time');
  }
});