# CS661 Course Project - Fake News Analysis Dashboard

## Project Overview
This repository contains the work for our CS661 Course Project: a Fake News Analysis Dashboard suite. The project consists of a central homepage and several distinct analysis modules developed by different team members.

-   **Homepage:** Developed using React + Vite + Node.js (Managed by Sankhadeep). Located in `Module_Sankhadeep/client/`.
-   **Modules:** Developed using Python + Flask + D3.js (and potentially other libraries). Located in their respective folders:
    -   `Module_Piyush_Ravi/`: Word Analysis Dashboard (Your Module)
    *   `Module_Ananya_Arpita/Celeb_news/`: Celebrity News Analysis Module
    *   (Add other Flask module folders here)
-   **Shared Data:** Located in the top-level `data/` folder.

This README provides guidance on both the development workflow and how to run the fully integrated project for presentation.

---

## Development Workflow (Using Git)

🚨 **Important:** Follow these steps carefully to collaborate effectively and avoid conflicts. **Do NOT make changes directly on the `main` branch during development.**

### Step 1: Initial Setup (First time only)
1.  **Clone the Repository**:
    Open the Terminal app on your Mac and run:
    ```bash
    git clone https://github.com/Piyushiitk24/CS661_Course_Project.git
    cd CS661_Course_Project
    ```
2.  **Install Prerequisites**:
    *   Ensure you have **Node.js** installed (check with `node -v`). Download from [nodejs.org](https://nodejs.org/) if needed (includes npm).
    *   Ensure you have **Python 3** installed (check with `python3 -V`).
    *   Ensure you have **Git** installed.

### Step 2: Create Your Own Branch (Essential!)
Always work on your own branch to isolate your changes. Replace `yourname_feature` with a descriptive name (e.g., `piyush_wordcloud_updates`).

1.  **Create & Switch to New Branch**:
    ```bash
    # Make sure you are up-to-date with main first (optional but good practice)
    # git checkout main
    # git pull origin main

    # Create your new branch
    git checkout -b yourname_feature
    ```
2.  **Verify Your Branch**:
    ```bash
    git branch
    ```
    Your branch should have a `*` next to it.

### Step 3: Work on Your Module
-   Make changes **only** within your assigned module's folder (e.g., `Module_Piyush_Ravi/` or `Module_Ananya_Arpita/Celeb_news/`).
-   For Flask modules, manage dependencies using a virtual environment *inside your module folder* (see Presentation Setup below for details). Update your module's `requirements.txt` if you add packages.
-   **Do NOT modify other team members' module folders or the React Homepage code unless coordinated.**

### Step 4: Save and Share Your Work
Commit your changes frequently and push your branch to GitHub.

1.  **Stage Changes**:
    ```bash
    # Stage changes only within your module folder
    git add Module_YourName/
    # Or stage all tracked changes if confident
    # git add .
    ```
2.  **Commit Changes**:
    ```bash
    git commit -m "Your descriptive commit message (e.g., Fix word cloud color scale)"
    ```
3.  **Push to GitHub**:
    ```bash
    git push origin yourname_feature
    ```

### Step 5: Create Pull Requests (PRs)
When a feature is complete or you want feedback, create a Pull Request on GitHub from your branch (`yourname_feature`) targeting the `main` branch. Add reviewers. **Do not merge your own PRs** until approved and coordinated for final integration.

### Step 6: Stay Synced
Regularly update your branch with changes from `main` to minimize merge conflicts later:
```bash
# Switch to main and pull latest changes
git checkout main
git pull origin main

# Switch back to your branch
git checkout yourname_feature

# Merge main into your branch
git merge main
```
Resolve any merge conflicts that arise (ask for help if needed).

---
---

## Running the Integrated Demo for Presentation

This section details how to set up and run the **entire project** (React Homepage + all Flask modules) on a single Mac for the final presentation using the **Hyperlink integration method**.

### Step 1: Prerequisites Check
Ensure the following are installed on the **presentation Mac**:
1.  **Node.js & npm:** Check with `node -v`.
2.  **Python 3 & pip:** Check with `python3 -V`.
3.  **Git:** Check with `git --version`.
4.  **VS Code (Recommended):** Useful for managing multiple terminals easily.

### Step 2: Setup Project on Presentation Mac
1.  **Clone ALL Repositories:** If not already done, clone the main project repository containing all modules.
    ```bash
    # Example: Clone into Desktop/CS661_Demo
    cd ~/Desktop
    git clone https://github.com/Piyushiitk24/CS661_Course_Project.git CS661_Demo
    cd CS661_Demo
    ```
2.  **Verify Project Structure:** Ensure you have the React project (`Module_Sankhadeep/client/`), all Flask module folders (`Module_Piyush_Ravi/`, `Module_Ananya_Arpita/Celeb_news/`, etc.), and the shared `data/` folder at the top level (`CS661_Demo/data/`).
3.  **Pull Latest Code:** Make sure all project parts are updated.
    ```bash
    git checkout main # Or the final integration branch
    git pull origin main # Or the final integration branch
    ```

### Step 3: Install Dependencies (Crucial: Separate Environments!)

**A. React Homepage Dependencies:**
1.  Open Terminal (or a pane in VS Code's integrated terminal).
2.  Navigate to the React **client** directory:
    ```bash
    cd Module_Sankhadeep/client
    ```
3.  Install Node modules:
    ```bash
    npm install
    ```

**B. Your Flask Module Dependencies (`Module_Piyush_Ravi`):**
1.  Open a **NEW** Terminal tab/pane.
2.  Navigate to **your** module directory:
    ```bash
    cd ../Module_Piyush_Ravi # Assuming you are still in Module_Sankhadeep/client
    # Or use full path: cd /path/to/CS661_Demo/Module_Piyush_Ravi
    ```
3.  Create and activate a **separate** virtual environment for this module:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    *(Your prompt should show `(venv)`)*
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

**C. Ananya/Arpita Flask Module Dependencies (`Celeb_news`):**
1.  Open a **NEW** Terminal tab/pane.
2.  Navigate to **their** module directory:
    ```bash
    cd ../Module_Ananya_Arpita/Celeb_news
    # Or use full path: cd /path/to/CS661_Demo/Module_Ananya_Arpita/Celeb_news
    ```
3.  Create and activate a **separate** virtual environment for this module:
    ```bash
    python3 -m venv venv2 # Using a different name like venv2 is fine
    source venv2/bin/activate
    ```
    *(Your prompt should show `(venv2)`)*
4.  Install dependencies (assuming they have `requirements.txt`):
    ```bash
    pip install -r requirements.txt
    ```
5.  **Install SpaCy Model (Specific to this module):**
    ```bash
    python -m spacy download en_core_web_sm
    ```

**D. Other Flask Modules:**
*   Repeat steps C.1-C.4 for **each** additional Flask module, creating a unique virtual environment (e.g., `venv3`, `venv4`) inside each module's directory and installing its specific dependencies.

### Step 4: Verify Port Assignments & React Links
1.  **Confirm Ports:** Ensure each server has a unique port assigned. The standard assignment is:
    *   React Homepage (`Module_Sankhadeep`): Port `5173` (typical for Vite) or `3000`. Check its startup message.
    *   Your Module (`Module_Piyush_Ravi`): Port `5001`.
    *   Ananya/Arpita Module (`Celeb_news`): Port `5002`.
    *   Other Flask Modules: Ports `5003`, `5004`, etc.
2.  **Verify React Links:** Double-check the React Homepage code (`Module_Sankhadeep/client/src/modules/Home.jsx` or similar) where the module buttons/links are defined. Ensure the `onClick` or `href` for each **Flask module** points to the correct `http://127.0.0.1:<AssignedPort>` and uses `target="_blank"` (for hyperlinks/`window.open`). URLs for routes handled *within* React should remain relative (e.g., `/timeline`).

### Step 5: Run All Servers Simultaneously (Checklist)

Open one terminal tab/pane **per server** (VS Code's integrated terminal is recommended). Keep them all running.

*   **Pane 1: React Homepage**
    ```bash
    cd /path/to/CS661_Demo/Module_Sankhadeep/client
    npm run dev
    # Note the URL printed, e.g., http://localhost:5173
    ```

*   **Pane 2: Your Flask Module (Port 5001)**
    ```bash
    cd /path/to/CS661_Demo/Module_Piyush_Ravi
    source venv/bin/activate
    flask run --port=5001
    ```

*   **Pane 3: Ananya/Arpita Module (Port 5002)**
    ```bash
    cd /path/to/CS661_Demo/Module_Ananya_Arpita/Celeb_news
    source venv2/bin/activate # Use the venv name you created for them
    # Run using --app flag since we might not be in the parent dir of the venv
    flask --app app_combine.py run
    # This will run on port 5002 as hardcoded in their app.py
    ```

*   **Pane 4, 5, etc.: Other Flask Modules (Ports 5003, 5004...)**
    ```bash
    # Example for Port 5003
    cd /path/to/CS661_Demo/Module_TeamMate3
    source venv3/bin/activate # Activate their specific venv
    flask run --port=5003
    ```
    *(Repeat for all other Flask modules, using their correct directory, venv, and assigned port)*

### Step 6: Test the Integrated Demo
1.  Open a web browser (Chrome, Safari, Firefox).
2.  Navigate to the **React Homepage URL** noted in Pane 1 (e.g., `http://localhost:5173`).
3.  Click the link/button corresponding to **your module**. Verify it opens in a new tab at `http://127.0.0.1:5001` and functions correctly.
4.  Go back to the React Homepage tab. Click the link for **Ananya/Arpita's module**. Verify it opens in a new tab at `http://127.0.0.1:5002` and functions correctly.
5.  Test links for **all other Flask modules**, ensuring they open at their assigned ports.
6.  Test links for any **internal React routes** (like `/timeline`) - they should navigate within the main React app tab.

### Step 7: Presentation
1.  Before starting, run all servers using the commands in Step 5.
2.  Open the React Homepage URL in the browser.
3.  Navigate the presentation by clicking links, which will open Flask modules in new tabs.
4.  Switch between the homepage tab and module tabs as needed.
5.  **Remember to keep all terminal windows/panes running throughout the demo!**

---

## How We’ll Combine Work Later (Final Integration)
-   (Keep existing section - This describes merging PRs for the final codebase merge, separate from the demo setup)
-   Each person’s branch (e.g., `Ananya_Arpita_feature`, `piyush_feature`) will be reviewed via Pull Requests.
-   Once everyone’s work is ready, we’ll merge all branches into `main`.
-   We’ll resolve any conflicts together as a team.

---