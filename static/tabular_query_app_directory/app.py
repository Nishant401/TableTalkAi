from flask import Flask, render_template, request, jsonify
from transformers import TapasTokenizer, TapasForQuestionAnswering
import pandas as pd
import re

app = Flask(__name__)

# Initialize TAPAS model and tokenizer
model_name = "google/tapas-base-finetuned-wtq"
tokenizer = TapasTokenizer.from_pretrained(model_name)
model = TapasForQuestionAnswering.from_pretrained(model_name)

# Initial table data
initial_data = {
    "Actors": ["Brad Pitt", "Leonardo DiCaprio", "George Clooney", "Tom Hanks", "Meryl Streep", 
               "Scarlett Johansson", "Robert Downey Jr.", "Natalie Portman", "Chris Hemsworth", "Emma Watson"],
    "Number of movies": ["87", "53", "69", "64", "76", "45", "62", "39", "50", "28"],
    "Age": ["56", "45", "59", "67", "74", "39", "58", "41", "34", "33"],
    "Awards Won": ["2", "1", "2", "2", "3", "0", "1", "1", "0", "0"],
    "Nationality": ["American", "American", "American", "American", "American", 
                    "American", "American", "American", "Australian", "British"]
}

# Global table variable that will be modified throughout the session
current_table = pd.DataFrame.from_dict(initial_data)

# Helper function to parse and execute SQL-like and mathematical queries
def execute_sql_query(query, table):
    query = query.lower().strip()
    
    # Patterns for SQL and mathematical queries
    select_pattern = r"select\s+(.+?)(?:\s+where\s+(.+))?(?:\s+order\s+by\s+(.+))?"
    group_pattern = r"select\s+(.+?)\s+group\s+by\s+(.+?)(?:\s+having\s+(.+))?"
    math_pattern = r"select\s+(sum|avg|min|max|count|\w+\s*[\+\-\*/]\s*\w+)(?:\s*\((.+?)\))?(?:\s+as\s+(.+))?"

    # Handle mathematical queries
    math_match = re.match(math_pattern, query)
    if math_match:
        operation, column, alias = math_match.groups()
        alias = alias or "Result"  # Default alias if not provided
        
        if operation in ["sum", "avg", "min", "max", "count"]:
            col_name = column.strip("()") if column else table.columns[0]  # Default to first column if none specified
            if col_name not in table.columns:
                return f"Error: Column '{col_name}' not found."
            numeric_col = pd.to_numeric(table[col_name], errors='coerce')
            if operation == "sum":
                result = numeric_col.sum()
            elif operation == "avg":
                result = numeric_col.mean()
            elif operation == "min":
                result = numeric_col.min()
            elif operation == "max":
                result = numeric_col.max()
            elif operation == "count":
                result = numeric_col.count()
            return pd.DataFrame({alias: [result]})
        
        # Handle arithmetic operations (e.g., Age + Number of movies)
        if "+" in operation or "-" in operation or "*" in operation or "/" in operation:
            parts = re.split(r"[\+\-\*/]", operation)
            op = re.search(r"[\+\-\*/]", operation).group()
            col1, col2 = [part.strip() for part in parts]
            if col1 not in table.columns or col2 not in table.columns:
                return f"Error: One or both columns '{col1}', '{col2}' not found."
            num_col1 = pd.to_numeric(table[col1], errors='coerce')
            num_col2 = pd.to_numeric(table[col2], errors='coerce')
            if op == "+":
                result = num_col1 + num_col2
            elif op == "-":
                result = num_col1 - num_col2
            elif op == "*":
                result = num_col1 * num_col2
            elif op == "/":
                result = num_col1 / num_col2
            return pd.DataFrame({alias: result})

    # Handle SELECT with WHERE and ORDER BY
    select_match = re.match(select_pattern, query)
    if select_match:
        columns_str, where_clause, order_by = select_match.groups()
        columns = [col.strip() for col in columns_str.split(",")]
        
        result = table.copy()
        if where_clause:
            conditions = where_clause.split("and")
            for cond in conditions:
                cond = cond.strip()
                if ">=" in cond:
                    col, val = cond.split(">=")
                    result = result[pd.to_numeric(result[col.strip()], errors='coerce') >= float(val.strip())]
                elif "<=" in cond:
                    col, val = cond.split("<=")
                    result = result[pd.to_numeric(result[col.strip()], errors='coerce') <= float(val.strip())]
                elif ">" in cond:
                    col, val = cond.split(">")
                    result = result[pd.to_numeric(result[col.strip()], errors='coerce') > float(val.strip())]
                elif "<" in cond:
                    col, val = cond.split("<")
                    result = result[pd.to_numeric(result[col.strip()], errors='coerce') < float(val.strip())]
                elif "=" in cond:
                    col, val = cond.split("=")
                    result = result[result[col.strip()] == val.strip()]

        if order_by:
            order_col = order_by.strip()
            result = result.sort_values(order_col)

        return result[columns] if columns != ["*"] else result

    # Handle GROUP BY with HAVING
    group_match = re.match(group_pattern, query)
    if group_match:
        columns_str, group_by, having_clause = group_match.groups()
        columns = [col.strip() for col in columns_str.split(",")]
        group_col = group_by.strip()

        agg_result = table.groupby(group_col).agg({
            col: "sum" if "sum" in col.lower() else "count" for col in columns if col != group_col
        }).reset_index()

        if having_clause:
            if ">=" in having_clause:
                col, val = having_clause.split(">=")
                agg_result = agg_result[pd.to_numeric(agg_result[col.strip()], errors='coerce') >= float(val.strip())]
            elif "<=" in having_clause:
                col, val = having_clause.split("<=")
                agg_result = agg_result[pd.to_numeric(agg_result[col.strip()], errors='coerce') <= float(val.strip())]
            elif ">" in having_clause:
                col, val = having_clause.split(">")
                agg_result = agg_result[pd.to_numeric(agg_result[col.strip()], errors='coerce') > float(val.strip())]
            elif "<" in having_clause:
                col, val = having_clause.split("<")
                agg_result = agg_result[pd.to_numeric(agg_result[col.strip()], errors='coerce') < float(val.strip())]

        return agg_result

    return None

# Helper function for TAPAS math-related natural language queries
def handle_math_natural_language(query, table):
    query = query.lower()
    if "total" in query or "sum" in query:
        if "movies" in query:
            return str(pd.to_numeric(table["Number of movies"], errors='coerce').sum())
        elif "age" in query:
            return str(pd.to_numeric(table["Age"], errors='coerce').sum())
    elif "average" in query or "avg" in query:
        if "movies" in query:
            return str(pd.to_numeric(table["Number of movies"], errors='coerce').mean())
        elif "age" in query:
            return str(pd.to_numeric(table["Age"], errors='coerce').mean())
    elif "minimum" in query or "min" in query:
        if "movies" in query:
            return str(pd.to_numeric(table["Number of movies"], errors='coerce').min())
        elif "age" in query:
            return str(pd.to_numeric(table["Age"], errors='coerce').min())
    elif "maximum" in query or "max" in query:
        if "movies" in query:
            return str(pd.to_numeric(table["Number of movies"], errors='coerce').max())
        elif "age" in query:
            return str(pd.to_numeric(table["Age"], errors='coerce').max())
    return None

# Process query using TAPAS model
def process_tapas_query(query, table):
    inputs = tokenizer(
        table=table,
        queries=[query],
        padding="max_length",
        return_tensors="pt"
    )

    outputs = model(**inputs)
    predicted_answer_coordinates, predicted_aggregation_indices = tokenizer.convert_logits_to_predictions(
        inputs,
        outputs.logits.detach(),
        outputs.logits_aggregation.detach()
    )

    id2aggregation = {0: "NONE", 1: "SUM", 2: "AVERAGE", 3: "COUNT"}
    predicted_agg = id2aggregation[predicted_aggregation_indices[0]]
    coordinates = predicted_answer_coordinates[0]

    if len(coordinates) == 1:
        answer = table.iat[coordinates[0]]
    else:
        cell_values = [table.iat[coordinate] for coordinate in coordinates]
        answer = ", ".join(cell_values)

    if predicted_agg == "NONE":
        return answer
    else:
        return f"{answer}"

@app.route('/')
def index():
    return render_template('index.html', table=current_table.to_dict('records'), 
                           columns=current_table.columns.tolist())

@app.route('/query', methods=['POST'])
def query():
    global current_table
    query_text = request.form.get('query', '')
    
    # Check if it's an add command
    if query_text.lower() == 'add':
        return jsonify({'result': 'redirect_add'})
    
    # Check if it's an SQL-like or mathematical query
    if query_text.lower().startswith("select"):
        result = execute_sql_query(query_text, current_table)
        if result is not None:
            if isinstance(result, str) and "Error" in result:
                return jsonify({'result': result, 'query': query_text})
            
            if isinstance(result, pd.DataFrame):
                return jsonify({
                    'result': 'table',
                    'data': result.to_dict('records'),
                    'columns': result.columns.tolist(),
                    'query': query_text
                })

    # Check for natural language math queries
    math_result = handle_math_natural_language(query_text, current_table)
    if math_result:
        return jsonify({'result': math_result, 'query': query_text})

    # Use TAPAS for natural language queries
    try:
        answer = process_tapas_query(query_text, current_table)
        return jsonify({'result': answer, 'query': query_text})
    except Exception as e:
        return jsonify({'result': f"Error processing query: {str(e)}", 'query': query_text})

@app.route('/add', methods=['GET'])
def add_form():
    return render_template('add.html', columns=current_table.columns.tolist())

@app.route('/add', methods=['POST'])
def add_actor():
    global current_table
    
    new_row = {}
    for column in current_table.columns:
        new_row[column] = request.form.get(column, '')
    
    current_table = pd.concat([current_table, pd.DataFrame([new_row])], ignore_index=True)
    
    return jsonify({'success': True})

@app.route('/reset', methods=['POST'])
def reset_table():
    global current_table
    current_table = pd.DataFrame.from_dict(initial_data)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)