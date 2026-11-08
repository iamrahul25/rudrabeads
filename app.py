import shutil
import subprocess
import sys


def start_app():
    print("Starting Expo app...")
    npm = shutil.which("npm")
    if not npm:
        print("Error: npm was not found. Install Node.js and ensure npm is on PATH.")
        return
    subprocess.run([npm, "start"], check=False)


def main():
    while True:
        print("\nOptions:")
        print("1. Start app")
        print("0. Exit app")
        choice = input("Enter choice: ").strip()

        if choice == "1":
            start_app()
        elif choice == "0":
            print("Exiting...")
            sys.exit(0)
        else:
            print("Invalid option. Please enter 1 or 0.")


if __name__ == "__main__":
    main()
