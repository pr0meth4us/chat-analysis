import os

def aggregate_file_contents(root_dir, output_file, exclude_dirs):
    """
    Recursively walks through a directory and writes the contents of all files
    to a single output file, excluding specified directories.

    Args:
        root_dir (str): The path to the root directory to start the scan from.
        output_file (str): The path to the file where all content will be saved.
        exclude_dirs (set): A set of directory names to exclude from the scan.
    """
    # Use a set for efficient lookup of excluded directories.
    excluded_folders = set(exclude_dirs)

    try:
        # Open the output file in write mode with UTF-8 encoding.
        with open(output_file, 'w', encoding='utf-8') as outfile:
            print(f"Starting scan in '{os.path.abspath(root_dir)}'...")
            print(f"Output will be written to '{os.path.abspath(output_file)}'.")
            print(f"Excluding directories named: {', '.join(excluded_folders)}\n")

            # os.walk generates the file and directory names in a tree.
            for dirpath, dirnames, filenames in os.walk(root_dir):

                # --- Exclusion Logic ---
                # Modify dirnames in-place to prevent os.walk from descending
                # into the excluded directories. We iterate over a copy [:]
                # because we are modifying the list as we loop.
                dirnames[:] = [d for d in dirnames if d not in excluded_folders]

                for filename in filenames:
                    # Construct the full path to the file.
                    file_path = os.path.join(dirpath, filename)

                    # Skip the output file itself to prevent it from reading itself.
                    if os.path.abspath(file_path) == os.path.abspath(output_file):
                        continue

                    # --- File Reading and Writing ---
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            print(f"Reading: {file_path}")
                            # Write a header to the output file to identify the source.
                            outfile.write("-" * 80 + "\n")
                            outfile.write(f"--- Contents of: {file_path} ---\n")
                            outfile.write("-" * 80 + "\n\n")

                            # Write the actual content of the file.
                            contents = infile.read()
                            outfile.write(contents)
                            outfile.write("\n\n")

                    except Exception as e:
                        # Handle potential errors like permission issues or binary files.
                        print(f"Could not read file {file_path}. Reason: {e}")

    except IOError as e:
        print(f"Error opening or writing to file: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    # --- Configuration ---
    # 1. The directory you want to scan. '.' means the current directory.
    ROOT_DIRECTORY = "."

    # 2. The name of the file to save all the text into.
    OUTPUT_FILENAME = "combined_code.txt"

    # 3. A list of folder names to completely ignore.
    #    The script will not look inside these folders at all.
    EXCLUDED_DIRECTORIES = {
        "venv",              # Python virtual environments
        "analyzer",          # As requested
        "parser",            # As requested
        ".git",              # Git version control folder
        "__pycache__",       # Python cache files
        "node_modules",      # Node.js dependencies
        ".vscode",           # VS Code editor settings
        "build",             # Common build output directory
        "dist",              # Common distribution output directory
    }

    # Run the function with your configuration.
    aggregate_file_contents(ROOT_DIRECTORY, OUTPUT_FILENAME, EXCLUDED_DIRECTORIES)

    print(f"\nProcess finished. All content aggregated into '{OUTPUT_FILENAME}'.")
