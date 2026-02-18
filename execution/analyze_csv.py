import csv
import sys
import statistics

def analyze_csv(input_file, output_file):
    try:
        data = []
        with open(input_file, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
        
        if not data:
            print("No data found in input file.")
            return

        numeric_columns = {}
        for key in data[0].keys():
            try:
                values = [float(row[key]) for row in data if row[key]]
                if values:
                    numeric_columns[key] = values
            except ValueError:
                pass

        with open(output_file, 'w') as f:
            for col, values in numeric_columns.items():
                f.write(f"Column: {col}\n")
                f.write(f"  Mean: {statistics.mean(values)}\n")
                f.write(f"  Median: {statistics.median(values)}\n")
                try:
                    f.write(f"  Mode: {statistics.mode(values)}\n")
                except statistics.StatisticsError:
                    f.write("  Mode: No unique mode\n")
                f.write("\n")

        print(f"Analysis complete. Summary written to {output_file}")

    except Exception as e:
        print(f"Error analyzing CSV: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python analyze_csv.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    analyze_csv(input_file, output_file)
