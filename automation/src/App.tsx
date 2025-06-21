import React, { useState } from 'react';
import { ShoppingCart, Send, Plus, Trash2, Loader2 } from 'lucide-react';

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
}

function App() {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([
    { id: '1', name: 'Bananas', quantity: 1 },
    { id: '2', name: 'Milk', quantity: 1 },
    { id: '3', name: 'Bread', quantity: 1 },
  ]);
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      const newGroceryItem: GroceryItem = {
        id: Date.now().toString(),
        name: newItem.trim(),
        quantity: newQuantity,
      };
      setGroceryList([...groceryList, newGroceryItem]);
      setNewItem('');
      setNewQuantity(1);
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setGroceryList(groceryList.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id: string) => {
    setGroceryList(groceryList.filter(item => item.id !== id));
  };

  const sendToWalmart = async () => {
    if (groceryList.length === 0) {
      setMessage('Please add items to your grocery list first!');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Check if Chrome extension is available
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          '', // Replace with actual extension ID
          {
            action: 'SEND_GROCERY_LIST',
            groceryList: groceryList.map(item => ({
              name: item.name,
              quantity: item.quantity
            }))
          },
          (response) => {
            setIsLoading(false);
            if (chrome.runtime.lastError) {
              setMessage('Extension not found. Please install the Walmart Grocery Extension.');
            } else {
              setMessage('Grocery list sent to Walmart! Check your new tab.');
            }
          }
        );
      } else {
        // Fallback for testing without extension
        setMessage('Chrome extension not available. This would normally open Walmart with your grocery list.');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      setMessage('Error: Chrome extension not found or not installed.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addItem();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-800">Grocery to Walmart</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Build your grocery list and send it directly to Walmart for easy shopping
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Add Item Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Grocery Items</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter grocery item (e.g., Organic Apples)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                  className="w-20 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={addItem}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add
                </button>
              </div>
            </div>

            {/* Grocery List */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Your Grocery List ({groceryList.length} items)
              </h2>
              
              {groceryList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Your grocery list is empty</p>
                  <p className="text-sm">Add items above to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {groceryList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-gray-800 font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button */}
            <div className="text-center">
              <button
                onClick={sendToWalmart}
                disabled={isLoading || groceryList.length === 0}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-3 mx-auto text-lg font-semibold shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Opening Walmart...
                  </>
                ) : (
                  <>
                    <Send className="h-6 w-6" />
                    Send to Walmart
                  </>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg text-center ${
                message.includes('Error') || message.includes('not found') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Add grocery items to your list above</li>
              <li>Click "Send to Walmart" to open Walmart in a new tab</li>
              <li>The extension will automatically search for your first item</li>
              <li>Browse and add items to your Walmart cart</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              * Chrome Extension required. Install the Walmart Grocery Extension for full functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;