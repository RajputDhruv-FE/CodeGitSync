🚀 LeetCode GitHub Sync

Automatically sync your Accepted LeetCode solutions to GitHub.

Solve → Submit → Accepted → Automatically saved to GitHub

✨ Features

⚡ Automatically detects Accepted submissions

🐙 Syncs solutions directly to GitHub

📁 Creates a separate folder for every problem

📝 Saves the LeetCode problem description

💻 Supports different programming languages

🔐 Uses GitHub OAuth for authentication

♻️ Automatically handles GitHub token refresh

🚫 No local solution downloads

👥 Each user connects their own GitHub account

📦 Installation

The extension is not currently published on the Chrome Web Store.

You can install it manually as an unpacked Chrome extension.

Requirements

Google Chrome

Git

GitHub account

LeetCode account

Node.js is only required if you want to rebuild the project. The repository already contains the compiled dist folder.

1. Clone the Repository

Open PowerShell, Command Prompt, or Git Bash.

git clone https://github.com/RajputDhruv-FE/CodeGitSync.git

Then:

cd <REPOSITORY>

The project should contain:

project/
├── src/
├── dist/
├── manifest.json
├── package.json
├── tsconfig.json
└── README.md

The dist folder is already included, so you do not need to build the project before installing the extension.

2. Install the Extension in Chrome

Step 1

Open:

chrome://extensions

Step 2

Enable Developer mode.

Step 3

Click Load unpacked.

Step 4

Select the project folder you cloned.

Make sure the selected folder contains:

manifest.json
dist/

The extension should now appear in Chrome as:

LeetCode GitHub Sync

3. Install the GitHub App

The extension uses the Code-GIt-Sync GitHub App to access your GitHub repositories.

Install Code-GIt-Sync

👉 https://github.com/apps/code-git-sync/installations/new

Choose your GitHub account and complete the installation.

If GitHub asks you to select repositories, make sure the repositories you want the extension to use are included.

Installing the GitHub App and connecting GitHub inside the extension are two separate steps. You need to complete both.

4. Connect Your GitHub Account

After installing the GitHub App:

Open LeetCode.

Open any problem.

Open LeetCode GitHub Sync from your Chrome extensions.

Click Connect GitHub.

GitHub will open the authorization page.

Sign in if necessary.

Approve the authorization.

After successful authorization, your GitHub account is connected.

5. Solve a LeetCode Problem

Go to:

https://leetcode.com/problems/

Choose any problem.

Solve it normally and click Submit.

When the result becomes:

Accepted

the extension automatically detects the successful submission.

You do not need to manually push the solution.

6. Check Your GitHub Repository

The extension stores solutions in:

leetcode-solutions/

For example:

leetcode-solutions/
├── 0001-two-sum/
│   ├── README.md
│   └── solution.cpp
│
├── 0002-add-two-numbers/
│   ├── README.md
│   └── solution.cpp
│
└── 0003-longest-substring-without-repeating-characters/
    ├── README.md
    └── solution.cpp

For Python:

0001-two-sum/
├── README.md
└── solution.py

For Java:

0001-two-sum/
├── README.md
└── solution.java

📁 What Gets Saved?

Each accepted problem contains two files.

README.md

Contains the LeetCode problem description.

solution.<extension>

Contains your submitted solution.

For example:

0001-two-sum/
├── README.md
└── solution.cpp

🔄 How It Works

LeetCode
   |
   v
Submit Solution
   |
   v
Accepted
   |
   v
Extension Detects Submission
   |
   v
GitHub API
   |
   v
leetcode-solutions
   |
   v
Problem Folder
   |
   +── README.md
   |
   +── solution.cpp

After the initial setup, your workflow is simply:

Solve
  ↓
Submit
  ↓
Accepted
  ↓
GitHub

🔐 Security

The extension uses GitHub OAuth to authenticate your account.

The extension does not:

Ask for your GitHub password

Store your GitHub password

Download your solutions locally

Require you to manually upload every solution

The extension uses GitHub's API to create and update solution files.

Important

Never share or commit:

OAuth tokens
Refresh tokens
Client secrets
Private keys
.env files
.pem files
.key files

🛠️ Build From Source

Building is optional because the compiled dist folder is already included.

If you modify the TypeScript source code, run:

npm install

Then:

npm run build

For automatic rebuilding while developing:

npm run watch

After rebuilding:

Open chrome://extensions

Find LeetCode GitHub Sync

Click Reload

📂 Project Structure

project/
│
├── src/
│   ├── background.ts
│   ├── content.ts
│   └── interceptor.ts
│
├── dist/
│   ├── background.js
│   ├── content.js
│   └── interceptor.js
│
├── manifest.json
├── package.json
├── tsconfig.json
└── README.md

Main files

background.ts

Handles GitHub authentication and GitHub API operations.

content.ts

Handles accepted submissions and prepares files for GitHub.

interceptor.ts

Detects LeetCode submission and result requests.

🐛 Troubleshooting

GitHub connection does not work

Check the following:

You are logged into the correct GitHub account.

Code-GIt-Sync is installed on that account.

You completed GitHub authorization.

The Chrome extension is enabled.

You are using the latest version of the project.

You can reload the extension from:

chrome://extensions

Find the extension and click Reload.

The solution was Accepted but is not on GitHub

Check:

The LeetCode submission says Accepted.

GitHub is connected.

The GitHub App is installed on the correct account.

The required repository permissions are available.

The extension is enabled.

Then reload the extension and try another accepted submission.

leetcode-solutions repository cannot be created

Make sure the GitHub App has the required repository permissions.

Also check whether the GitHub App was installed on the same GitHub account that you connected in the extension.

Chrome shows an extension error

Open:

chrome://extensions

Find LeetCode GitHub Sync and check the error details.

If you modified the source code, rebuild the project:

npm run build

Then click Reload.

👥 Using the Extension on Another Computer

If you want a friend to use the extension:

Your friend clones the repository.

Your friend loads it as an unpacked Chrome extension.

Your friend installs the Code-GIt-Sync GitHub App on their own GitHub account.

Your friend connects GitHub inside the extension.

Your friend solves a LeetCode problem.

The accepted solution is automatically synced to their GitHub.

Each person uses their own GitHub account.

You do not need to give your GitHub credentials to anyone.

🔄 Updating the Extension

When you release an update, users can get the latest project files with:

git pull

If the TypeScript source changed:

npm install
npm run build

Then reload the extension:

chrome://extensions

→ LeetCode GitHub Sync

→ Reload

❓ FAQ

Is the extension available on the Chrome Web Store?

No. It is currently installed manually as an unpacked extension.

Do I need Node.js?

Not for normal installation. The repository already contains the compiled dist folder.

Node.js is only required if you want to modify or rebuild the source.

Do I need to manually push every solution?

No. Accepted submissions are automatically synced after GitHub is connected.

Are solutions downloaded to my computer?

No. The extension syncs the solution directly to GitHub.

Can my friends use the extension?

Yes. They can clone the repository, install the GitHub App, and connect their own GitHub account.

Can my friend access my GitHub account?

No. Each user authorizes their own GitHub account.

Can I revoke access?

Yes. You can manage or revoke the application's access from your GitHub account settings.

⚠️ Current Distribution

LeetCode GitHub Sync is currently distributed as an unpacked Chrome extension.

It is not published on the Chrome Web Store.

Installation:

Clone Repository
       ↓
Load Unpacked
       ↓
Connect GitHub
       ↓
Install GitHub App
       ↓
Solve LeetCode
       ↓
Accepted
       ↓
Automatically Synced

❤️ Keep Solving

You focus on solving problems.

The extension handles the repetitive work of organizing and syncing your solutions.

🧠 Solve
   +
✅ Get Accepted
   =
🐙 GitHub automatically updated

Happy Coding! 🚀
