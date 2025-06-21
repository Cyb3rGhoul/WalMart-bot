# Grocery to Walmart Chrome Extension

A complete system that allows users to create grocery lists and automatically search for items on Walmart.com using Chrome Extension technology.

## 🚀 Features

- **Beautiful React Frontend**: Modern, responsive grocery list interface
- **Chrome Extension Integration**: Seamless communication between web app and extension
- **Automated Walmart Search**: Automatically opens Walmart and searches for grocery items
- **Standalone HTML Version**: Works without React for simple deployment
- **Production Ready**: Beautiful design with animations and proper error handling

## 📁 Project Structure

```
project/
├── src/                          # React frontend
│   ├── App.tsx                   # Main React component
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind CSS
├── extension/                    # Chrome Extension files
│   ├── manifest.json             # Extension manifest (v3)
│   ├── background.js             # Service worker for extension
│   ├── content.js                # Content script for Walmart.com
│   ├── popup.html                # Extension popup interface
│   ├── popup.js                  # Popup functionality
│   └── icons/                    # Extension icons (16, 48, 128px)
├── standalone/                   # Standalone HTML version
│   └── index.html                # Complete HTML/CSS/JS implementation
└── README.md                     # This file
```

## 🛠️ Setup Instructions

### 1. Frontend Setup (React)

The React frontend is already configured with Vite and Tailwind CSS:

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see the grocery list interface.

### 2. Chrome Extension Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `extension/` folder
4. Note the extension ID from the extensions page
5. Update the extension ID in the frontend code:
   - In `src/App.tsx`, replace `'your-extension-id'` with your actual extension ID
   - In `standalone/index.html`, replace `'your-extension-id'` with your actual extension ID

### 3. Adding Extension Icons

Create PNG icons for the extension:
- `extension/icons/icon16.png` (16x16px)
- `extension/icons/icon48.png` (48x48px) 
- `extension/icons/icon128.png` (128x128px)

Use a shopping cart or grocery theme with Walmart's blue color (#0071ce).

## 🔧 How It Works

### Message Flow

1. **Frontend → Extension**: User clicks "Send to Walmart" button
2. **Extension Background**: Receives grocery list, opens Walmart tab
3. **Content Script**: Injected into Walmart page, searches for items
4. **User**: Sees search results and can add items to cart

### Key Components

- **React Frontend**: Beautiful UI for managing grocery lists
- **Background Script**: Handles tab creation and message routing
- **Content Script**: Manipulates Walmart's DOM to perform searches
- **Popup**: Extension interface with status and controls

## 🎯 Usage

### Using the React Frontend

1. Start the development server: `npm run dev`
2. Add grocery items to your list
3. Click "Send to Walmart" to trigger the extension
4. Watch as Walmart opens and automatically searches for your first item

### Using the Standalone Version

1. Open `standalone/index.html` in your browser
2. Add items to your grocery list
3. Click "Send to Walmart" (requires extension to be installed)

## 🔒 Security & Permissions

The extension requests minimal permissions:
- `activeTab`: To interact with the current Walmart tab
- `tabs`: To create new tabs
- `storage`: For saving user preferences
- `https://www.walmart.com/*`: To inject content scripts

## 🚀 Deployment Options

### Frontend Deployment
- **Netlify**: `npm run build` then drag dist folder to Netlify
- **Vercel**: Connect GitHub repo for automatic deployment
- **Static Hosting**: Use the `standalone/index.html` for simple hosting

### Chrome Extension Publishing
1. Zip the `extension/` folder
2. Upload to Chrome Web Store Developer Dashboard
3. Fill out store listing with screenshots and descriptions
4. Submit for review

## 🛠️ Development Tips

### Testing the Extension
- Use `chrome://extensions/` to reload the extension during development
- Check console logs in background script, content script, and popup
- Use "Inspect views" links in the extensions page for debugging

### Modifying Search Behavior
Edit `extension/content.js` to:
- Search for multiple items sequentially
- Add items to cart automatically
- Handle different Walmart page layouts

### Customizing the UI
- Modify `src/App.tsx` for React version changes
- Edit `standalone/index.html` for standalone version updates
- Update colors, fonts, and layout in the respective CSS sections

## 🐛 Troubleshooting

### Extension Not Found
- Ensure extension is loaded in `chrome://extensions/`
- Check that extension ID is correctly set in frontend code
- Verify `externally_connectable` matches your frontend URL

### Search Not Working
- Check Walmart hasn't changed their DOM structure
- Update selectors in `content.js` if needed
- Ensure content script is injected (check console)

### Frontend Communication Issues
- Verify extension ID is correct
- Check browser console for error messages
- Ensure extension has proper permissions

## 📝 License

This project is for educational purposes. Walmart is a trademark of Walmart Inc.

## 🤝 Contributing

Feel free to fork, modify, and improve this project. Consider:
- Adding support for more grocery stores
- Implementing user accounts and saved lists
- Adding price comparison features
- Improving the search accuracy

---

**Note**: This extension is not affiliated with Walmart Inc. It's an educational project demonstrating Chrome Extension development and web automation techniques.