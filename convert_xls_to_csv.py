import pandas as pd
import os

# Define the input and output file paths
input_file = "data/master_dataset.xls"  # File is in the data/ folder
output_file = "data/master_dataset.csv"  # Output path in the data/ folder

# Check if the input file exists
if not os.path.exists(input_file):
    print(f"Error: Input file '{input_file}' does not exist.")
    exit(1)

# Check if we have read permissions for the input file
if not os.access(input_file, os.R_OK):
    print(f"Error: Cannot read input file '{input_file}'. Check permissions.")
    exit(1)

# Check if the output directory exists and is writable
output_dir = os.path.dirname(output_file)
if not os.path.exists(output_dir):
    print(f"Error: Output directory '{output_dir}' does not exist.")
    exit(1)
if not os.access(output_dir, os.W_OK):
    print(f"Error: Cannot write to output directory '{output_dir}'. Check permissions.")
    exit(1)

try:
    print(f"Attempting to read '{input_file}'...")
    # Read the XLS file using xlrd engine
    df = pd.read_excel(input_file, engine="xlrd")
    print("Successfully read the XLS file.")
    
    # Save as CSV
    print(f"Attempting to write to '{output_file}'...")
    df.to_csv(output_file, index=False)
    print(f"Converted '{input_file}' to '{output_file}'")
except FileNotFoundError as e:
    print(f"FileNotFoundError: Could not find the file '{input_file}'. {e}")
except ImportError as e:
    print(f"ImportError: Required library (e.g., xlrd) might not be installed or compatible. {e}")
except Exception as e:
    print(f"An error occurred: {type(e).__name__}: {e}")
finally:
    print("Script execution completed.")