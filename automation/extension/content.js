// Content script for Walmart Grocery Extension
console.log('Walmart Grocery Extension content script loaded on:', window.location.href);

// Notify background script that content script is ready
chrome.runtime.sendMessage({ action: 'CONTENT_SCRIPT_READY' });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'SEARCH_GROCERY_ITEMS') {
    // Store grocery list in local storage with current index
    localStorage.setItem('groceryList', JSON.stringify(message.groceryList));
    localStorage.setItem('currentGroceryIndex', '0');
    
    searchGroceryItems(message.groceryList)
      .then(result => {
        console.log('Search completed:', result);
        sendResponse({ success: true, result: result });
      })
      .catch(error => {
        console.error('Search failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Keep the message channel open for async response
  }
});

async function searchGroceryItems(groceryList) {
  console.log('Starting search for grocery items:', groceryList);
  
  if (!groceryList || groceryList.length === 0) {
    throw new Error('No grocery items provided');
  }
  
  // Wait for page to be fully loaded
  await waitForPageLoad();
  
  // Find the search input
  const searchInput = await findSearchInput();
  if (!searchInput) {
    throw new Error('Could not find Walmart search input');
  }
  
  // For now, search for the first item in the list
  const firstItem = groceryList[0];
  console.log('Searching for first item:', firstItem);
  
  // Update the index in local storage after searching first item
  const currentIndex = parseInt(localStorage.getItem('currentGroceryIndex') || '0');
  localStorage.setItem('currentGroceryIndex', (currentIndex + 1).toString());
  console.log('Updated current index to:', currentIndex + 1);
  
  await searchForItem(searchInput, firstItem);
  
  return {
    searchedItem: firstItem,
    totalItems: groceryList.length,
    message: `Searched for "${firstItem}". ${groceryList.length - 1} more items in your list.`
  };
}

function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

async function findSearchInput() {
  // Multiple selectors to try for Walmart search input
  const selectors = [
    'input[data-automation-id="global-search-input"]',
    'input[name="query"]',
    'input[placeholder*="Search"]',
    'input[type="search"]',
    '#global-search-input',
    '[data-testid="search-input"]'
  ];
  
  // Try each selector with retries
  for (let attempt = 0; attempt < 10; attempt++) {
    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && input.offsetParent !== null) { // Check if element is visible
        console.log('Found search input with selector:', selector);
        return input;
      }
    }
    
    // Wait a bit before trying again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.error('Could not find search input after multiple attempts');
  return null;
}

// Utility function to wait for an element with polling
async function waitForElement(selector, timeout = 30000, interval = 2000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element && element.offsetParent !== null) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Element ${selector} not found after ${timeout}ms`);
}

// Utility function to wait for condition with polling
async function waitForCondition(condition, timeout = 30000, interval = 2000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met after ${timeout}ms`);
}

async function searchForItem(searchInput, item) {
  // Clear the input
  searchInput.value = '';
  searchInput.focus();
  
  // Trigger input events
  searchInput.dispatchEvent(new Event('focus', { bubbles: true }));
  
  // Type the item name character by character to simulate real typing
  for (let i = 0; i < item.name.length; i++) {
    searchInput.value = item.name.substring(0, i + 1);
    
    // Dispatch input events
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
    
    // Small delay between characters
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Finished typing:', item);
  
  // Wait for suggestions to appear
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Try to find and click the search button
  const searchButton = await findSearchButton();
  if (searchButton) {
    console.log('Clicking search button');
    searchButton.click();
  } else {
    // Fallback: press Enter key
    console.log('Search button not found, pressing Enter');
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
      key: 'Enter', 
      code: 'Enter', 
      keyCode: 13,
      bubbles: true 
    }));
  }
  
  // Wait for search results to load using polling
  try {
    await waitForElement('[data-testid="item-stack"] > div', 30000);
    
    // Get all item containers inside item-stack
    const itemDivs = document.querySelectorAll('[data-testid="item-stack"] > div');

    if (itemDivs.length > 0) {
      // Inside each item div, find the anchor tag
      const firstAnchor = itemDivs[0].querySelector('a');
      console.log('Found first item anchor:', firstAnchor);

      if (firstAnchor) {
        // Get the product URL
        const productUrl = firstAnchor.href;
        console.log('Navigating to product page:', productUrl);
        
        // Navigate to the product page
        window.location.href = productUrl;
        return;
      } else {
        console.warn('Anchor tag not found in first item');
      }
    } else {
      console.warn('No items found in item-stack');
    }
  } catch (error) {
    console.error('Error waiting for search results:', error);
  }
  
  console.log('Search completed for:', item);
}

async function findSearchButton() {
  const selectors = [
    'button[data-automation-id="global-search-submit"]',
    'button[type="submit"]',
    '[data-testid="search-submit"]',
    'button[aria-label*="Search"]',
    '.search-submit-btn'
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button && button.offsetParent !== null) {
      console.log('Found search button with selector:', selector);
      return button;
    }
  }
  
  console.log('Could not find search button');
  return null;
}

// Modify the handleProductPage function
async function handleProductPage() {
  try {
    // Wait for add to cart button with polling
    const addToCartButton = await waitForElement('button[data-automation-id="atc"]');
    console.log('Found Add to Cart button on product page');
    
    // Click the add to cart button
    console.log('Clicking Add to Cart button');
    addToCartButton.click();
    
    // Wait for PAC page to load
    await waitForCondition(() => window.location.href.includes('/pac?id='), 30000);
    console.log('Detected PAC page, proceeding to next item');
    
    // Get current grocery list and index from local storage
    const groceryList = JSON.parse(localStorage.getItem('groceryList') || '[]');
    const currentIndex = parseInt(localStorage.getItem('currentGroceryIndex') || '0');

    console.log('Grocery list:', groceryList);
    console.log('Current index:', currentIndex);
    const quantity = groceryList[currentIndex-1].quantity -1;
    console.log('Target quantity:', quantity);

    // Wait for the quantity button to be available
    const increaseQtyButton = await waitForElement('button[aria-label^="Increase quantity"]', 10000);
    console.log('Found increase quantity button:', increaseQtyButton);

    if (increaseQtyButton) {
      console.log('Clicking increase quantity button');
      for(let i = 0; i < quantity; i++) {
        // Add a small delay between clicks
        await new Promise(resolve => setTimeout(resolve, 500));
        increaseQtyButton.click();
        console.log(`Clicked quantity button ${i + 1} times`);
      }
    } else {
      console.warn('Increase quantity button not found');
    }
    
    // Check if there are more items to process
    if (currentIndex < groceryList.length) {
      const nextItem = groceryList[currentIndex];
      console.log('Processing next item:', nextItem);
      searchGroceryItems([nextItem]);
    } else {
      console.log('All items have been processed');
      // Clear the grocery list from storage
      localStorage.removeItem('groceryList');
      localStorage.removeItem('currentGroceryIndex');
    }
  } catch (error) {
    console.error('Error in handleProductPage:', error);
  }
}

// Modify the main content script to check for product page
if (window.location.href.includes('/ip/')) {
  console.log('Detected product page, handling add to cart');
  handleProductPage();
}
