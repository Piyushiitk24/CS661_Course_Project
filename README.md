# CS661 Course Project - Fake News Analysis Setup and Run Guide

This guide provides step-by-step instructions to set up and run the project after cloning it from GitHub.

## Prerequisites

*   **Git:** You need Git installed to clone the repository.
*   **Python 3:** Ensure Python 3 is installed. ([Download Python](https://www.python.org/downloads/))
*   **Node.js and npm:** Ensure Node.js (which includes npm) is installed. ([Download Node.js](https://nodejs.org/))

## Setup Instructions

1.  **Clone the Repository:**
    Open your terminal or command prompt and run:
    ```bash
    git clone https://github.com/Piyushiitk24/CS661_Course_Project.git
    cd CS661_Course_Project
    ```

2.  **Create and Activate Python Virtual Environment:**
    It's recommended to use a virtual environment.
    ```bash
    # Create a virtual environment named 'venv' (you can choose another name)
    python3 -m venv venv

    # Activate the virtual environment
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows:
    # .\venv\Scripts\activate
    ```
    You should see `(venv)` at the beginning of your terminal prompt.

3.  **Install Python Dependencies:**
    Install all required Python packages.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Install Node.js Dependencies for Module_Aakriti:**
    Navigate to the `Module_Aakriti` directory and install its dependencies.
    ```bash
    cd Module_Aakriti
    npm install
    cd ..
    ```

5.  **Install Node.js Dependencies for Module_Sankhadeep:**
    Navigate to the `Module_Sankhadeep/client` directory and install its dependencies.
    ```bash
    cd Module_Sankhadeep/client
    npm install
    cd ../..
    ```

## Running the Project

1.  **Start the Servers:**
    Make sure you are in the main project directory (`CS661_Course_Project`) and your virtual environment (`venv`) is activated. Run the start script:
    ```bash
    python start_all.py
    ```
    Leave this terminal running. It hosts all the necessary backend and frontend servers.

## Accessing the Project

1.  **Open in Browser:**
    Open your web browser and go to:
    [http://localhost:5173](http://localhost:5173)

## Stopping the Project

1.  **Close the Server Terminal:**
    First, close the terminal window where `python start_all.py` is running (e.g., by pressing `Ctrl+C` and then closing the window).

2.  **Run the Stop Script:**
    Open a *new* terminal, navigate to the project's root directory (`CS661_Course_Project`), and run:
    ```bash
    python stop_all.py
    ```
    *(Use `python3 stop_all.py` if `python` does not point to Python 3 on your system).*
    This ensures all server processes are properly stopped and ports are freed.

## Troubleshooting

*   **Error: "Address already in use" (e.g., Port 5001):**
    This usually means a previous server process didn't shut down correctly.
    1.  Make sure you have closed any previous server terminals.
    2.  Run the stop script from the project root directory:
        ```bash
        python stop_all.py
        ```
    3.  Try running `python start_all.py` again.
    4.  If the error persists, you might need to manually find and stop the process using the port. Replace `5001` with the specific port number from the error message:
        ```bash
        # Find the process ID (PID) using the port
        lsof -ti :5001

        # Stop the process using the PID found above (replace <PID> with the actual number)
        kill <PID>
        ```
        Then, try `python start_all.py` again.
*   **`npm install` fails:** Ensure Node.js and npm are correctly installed and accessible in your terminal path.
*   **`pip install` fails:** Ensure Python 3 and pip are correctly installed and your virtual environment is active. Check for any specific error messages during installation.
