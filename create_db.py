import sqlite3

# Connect to the database (this creates it if it doesn't exist)
conn = sqlite3.connect('cypher.db')

# Create a cursor
c = conn.cursor()

# Create a sample table
c.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL
    )
''')

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database 'cypher.db' created successfully.")