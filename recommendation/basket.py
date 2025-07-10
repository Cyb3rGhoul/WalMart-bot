from flask import Flask, request, jsonify
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

# Function to update the dataset file with the user's cart
def store_cart(cart, filename="GroceryStoreDataset.csv"):
    import pandas as pd
    import os

    cart_length = len(cart)
    if os.path.exists(filename):
        existing_df = pd.read_csv(filename)
        max_columns = existing_df.shape[1]
        # If cart is longer, add new columns
        if cart_length > max_columns:
            # Generate new column names
            new_cols = [f"item_{i+1}" for i in range(max_columns, cart_length)]
            for col in new_cols:
                existing_df[col] = ""
            existing_df.to_csv(filename, index=False)
            max_columns = cart_length
        else:
            new_cols = []
    else:
        max_columns = cart_length
        new_cols = []

    # Pad cart
    padded_cart = cart + [''] * (max_columns - len(cart))

    # Append to CSV
    df = pd.DataFrame([padded_cart])
    # If file exists, don't write header
    df.to_csv(filename, mode='a', index=False, header=not os.path.exists(filename))


# FP-Growth + Apriori
def suggest_items_combined(user_cart, df, top_n=5):
    transactions = df.apply(lambda row: row.dropna().tolist(), axis=1).tolist()

    te = TransactionEncoder()
    te_ary = te.fit(transactions).transform(transactions)
    df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

    # Run FP-Growth and Apriori
    fp_itemsets = fpgrowth(df_encoded, min_support=0.005, use_colnames=True)
    fp_rules = association_rules(fp_itemsets, metric="confidence", min_threshold=0.4)

    ap_itemsets = apriori(df_encoded, min_support=0.005, use_colnames=True)
    ap_rules = association_rules(ap_itemsets, metric="confidence", min_threshold=0.4)

    user_cart_set = set(user_cart)
    suggestions = []

    def extract_suggestions(rules, source):
        for _, row in rules.iterrows():
            antecedents = set(row['antecedents'])
            if user_cart_set & antecedents:
                match_score = len(user_cart_set & antecedents) / len(antecedents)
                suggestions.append({
                    'Recommend': list(row['consequents']),
                    'MatchScore': round(match_score, 2),
                    'Confidence': round(row['confidence'], 2),
                    'Source': source
                })

    extract_suggestions(fp_rules, 'FP-Growth')
    extract_suggestions(ap_rules, 'Apriori')

    # Sort by match and confidence
    suggestions = sorted(suggestions, key=lambda x: (x['MatchScore'], x['Confidence']), reverse=True)
    
    recommended_items = []
    for suggestion in suggestions:
        recommended_items.extend(suggestion['Recommend'])

    return list(dict.fromkeys(recommended_items))[:top_n]

# API route
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    # print(data)

    # Accept both 'cart' and 'groceryList'
    if 'cart' in data:
        user_cart = [item.upper() for item in data['cart']]
    elif 'groceryList' in data:
        user_cart = [item['name'].upper() for item in data['groceryList'] if 'name' in item]
    else:
        return jsonify({'error': 'Please provide a "cart" list or "groceryList".'}), 400

    # Update CSV
    store_cart(user_cart)

    # Reload updated dataset
    df = pd.read_csv("GroceryStoreDataset.csv")

    # Get recommendations
    recommendations = suggest_items_combined(user_cart, df, top_n=5)

    return jsonify({
        'input_cart': user_cart,
        'recommendations': recommendations
    })

if __name__ == '__main__':
    app.run(debug=True, port=5050)
