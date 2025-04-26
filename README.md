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
    *   Ensure you have **Node.js** installed (check with `node -v`). Download from [nodejs.org](https://nodejs.org/) if needed (includes npm). Use the LTS version recommended for the React project if known.
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
-   For Flask modules, manage dependencies using a virtual environment *inside your module folder* (see Presentation Setup below for details). Update your module's `requirements.txt` if you add packages (`pip freeze > requirements.txt`).
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

## Running the Integrated Demo for Presentation (Checklist)

This section details how to set up and run the **entire project** (React Homepage + all Flask modules) on a single Mac for the final presentation using the **Hyperlink integration method**. Follow these steps precisely on the chosen presentation Mac.

### ✅ Step 1: Prerequisites Check
Ensure the following are installed and working on the **presentation Mac**:
1.  [ ] **Node.js & npm:** Check with `node -v` in Terminal. (Install from [nodejs.org](https://nodejs.org/) if needed).
2.  [ ] **Python 3 & pip:** Check with `python3 -V` in Terminal. (Should be pre-installed on macOS).
3.  [ ] **Git:** Check with `git --version`. (Should be pre-installed on macOS).
4.  [ ] **VS Code (Recommended):** For easily managing multiple terminals.

### ✅ Step 2: Setup Project Folder & Code
1.  [ ] **Clone/Locate Project:** Ensure the main project folder (`CS661_Course_Project`) exists on the presentation Mac (e.g., `~/Desktop/CS661_Demo`).
    ```bash
    # Example: Navigate to the project folder
    cd /path/to/your/CS661_Demo
    ```
2.  [ ] **Verify Structure:** Confirm all module folders (`Module_Sankhadeep`, `Module_Piyush_Ravi`, `Module_Ananya_Arpita`, etc.) and the shared `data/` folder are present inside `CS661_Demo`.
3.  [ ] **Pull Latest Code:** Get the most recent, integrated version.
    ```bash
    # Ensure you are in the main project directory (e.g., CS661_Demo)
    git checkout main # Or the final presentation branch name
    git pull origin main # Or the final presentation branch name
    ```

### ✅ Step 3: Install Dependencies (Separate Environments!)

**(A) React Homepage Dependencies (`Module_Sankhadeep/client/`)**
1.  [ ] Open Terminal (or a pane in VS Code's integrated terminal).
2.  [ ] Navigate to the React **client** directory:
    ```bash
    cd /path/to/your/CS661_Demo/Module_Sankhadeep/client
    ```
3.  [ ] **Troubleshooting:** If `node_modules` exists and you face issues, try removing it first: `rm -rf node_modules package-lock.json` (Use with caution!).
4.  [ ] Install Node modules:
    ```bash
    npm install
    ```
    *(Watch for any errors during installation. If errors occur, check Node.js version compatibility or specific package issues and ask the React teammate.)*

**(B) Your Flask Module Dependencies (`Module_Piyush_Ravi`)**
1.  [ ] Open a **NEW** Terminal tab/pane.
2.  [ ] Navigate to **your** module directory:
    ```bash
    cd /path/to/your/CS661_Demo/Module_Piyush_Ravi
    ```
3.  [ ] Create/Activate **separate** virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    *(Prompt should show `(venv)`)*
4.  [ ] Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

**(C) Ananya/Arpita Flask Module Dependencies (`Celeb_news`)**
1.  [ ] Open a **NEW** Terminal tab/pane.
2.  [ ] Navigate to **their** module directory:
    ```bash
    cd /path/to/your/CS661_Demo/Module_Ananya_Arpita/Celeb_news
    ```
3.  [ ] Create/Activate **separate** virtual environment:
    ```bash
    python3 -m venv venv2 # Or any unique name
    source venv2/bin/activate
    ```
    *(Prompt should show `(venv2)`)*
4.  [ ] Install dependencies:
    ```bash
    pip install -r requirements.txt # Assuming they have one
    # If no requirements.txt, install manually: pip install Flask Flask-Cors pandas spacy
    ```
5.  [ ] **Install SpaCy Model:**
    ```bash
    python -m spacy download en_core_web_sm
    ```

**(D) Other Flask Modules:**
1.  [ ] Repeat steps C.1-C.4 for **each** additional Flask module. Use a unique virtual environment name (e.g., `venv3`, `venv4`) inside each module's directory. Install dependencies via `requirements.txt` or manually.

### ✅ Step 4: Verify Port Assignments & React Links
1.  [ ] **Confirm Ports:** Ensure each server has a unique port. Default plan:
    *   React Homepage: Port `5173` (Vite default) or `3000`. **Check its startup message.**
    *   Your Module: Port `5001`.
    *   Ananya/Arpita Module: Port `5002`.
    *   Other Flask Modules: Ports `5003`, `5004`, etc.
2.  [ ] **Verify React Links:** Confirm the React Homepage code (`Module_Sankhadeep/client/src/modules/Home.jsx` or similar) has the correct `http://127.0.0.1:<PORT>` URLs in the `onClick={() => window.open(module.url, '_blank')}` or `<a href="..." target="_blank">` for each **Flask module**. Internal React routes should use relative paths (e.g., `/timeline`).

### ✅ Step 5: Run All Servers Simultaneously (The Demo!)

Open one terminal tab/pane **per server**. Use VS Code's integrated terminal for easier management. Keep all panes running.

*   **Pane 1: React Homepage**
    1.  Navigate:
        ```bash
        cd /path/to/your/CS661_Demo/Module_Sankhadeep/client
        ```
    2.  Run (check `package.json` for the exact script name):
        ```bash
        npm run dev
        ```
    3.  **Note the URL printed (e.g., `http://localhost:5173`)**

*   **Pane 2: Your Flask Module (Port 5001)**
    1.  Navigate:
        ```bash
        cd /path/to/your/CS661_Demo/Module_Piyush_Ravi
        ```
    2.  Activate venv:
        ```bash
        source venv/bin/activate
        ```
    3.  Run Flask:
        ```bash
        flask run --port=5001
        ```

*   **Pane 3: Ananya/Arpita Module (Port 5002)**
    1.  Navigate:
        ```bash
        cd /path/to/your/CS661_Demo/Module_Ananya_Arpita/Celeb_news
        ```
    2.  Activate venv:
        ```bash
        source venv2/bin/activate # Use their venv name
        ```
    3.  Run Flask (using explicit app path):
        ```bash
        flask --app app_combine.py run
        ```
        *(This will use Port 5002 as defined in their `app.py`)*

*   **Pane 4, 5, etc.: Other Flask Modules (Ports 5003, 5004...)**
    1.  Navigate to the specific module directory.
    2.  Activate its specific virtual environment (`source venvX/bin/activate`).
    3.  Run Flask on its assigned port:
        ```bash
        # Example for Port 5003
        flask run --port=5003
        ```
    *(Repeat for all other Flask modules)*

### ✅ Step 6: Test the Integrated Demo
1.  [ ] Open a web browser.
2.  [ ] Go to the **React Homepage URL** from Pane 1 (e.g., `http://localhost:5173`).
3.  [ ] Click the link/button for **your module**. Verify it opens in a new tab at `http://127.0.0.1:5001` and works.
4.  [ ] Go back to the React Homepage tab. Click the link for **Ananya/Arpita's module**. Verify it opens at `http://127.0.0.1:5002` and works.
5.  [ ] Test links for **all other Flask modules**.
6.  [ ] Test links for any **internal React routes**.

### ✅ Step 7: Presentation Execution
1.  Before starting, run all servers using the commands in Step 5. **Ensure no errors.**
2.  Open the React Homepage URL in the browser.
3.  Click links to open Flask modules in new tabs.
4.  Switch between tabs to demo.
5.  **Keep all terminal windows/panes running!**

---

## Final Integration (Post-Demo / Code Merge)
-   (Keep existing section - This describes merging PRs for the final codebase merge, separate from the demo setup)
-   Each person’s branch (e.g., `Ananya_Arpita_feature`, `piyush_feature`) will be reviewed via Pull Requests.
-   Once everyone’s work is ready, we’ll merge all branches into `main`.
-   We’ll resolve any conflicts together as a team.

---