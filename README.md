# 🚀 LeetCode GitHub Sync

Automatically sync your **Accepted LeetCode solutions** to GitHub.

**Solve → Submit → Accepted → Automatically saved to GitHub**

---

## ✨ Features

- ⚡ Automatically detects Accepted submissions
- 🐙 Syncs solutions directly to GitHub
- 📁 Creates a separate folder for every problem
- 📝 Saves the LeetCode problem description
- 💻 Supports different programming languages
- 🔐 Uses GitHub OAuth for authentication
- ♻️ Automatically handles GitHub token refresh
- 🚫 No local solution downloads
- 👥 Each user connects their own GitHub account

---

# 📦 Installation

The extension is **not currently published on the Chrome Web Store**.

You can install it manually as an unpacked Chrome extension.

## Requirements

- Google Chrome
- Git
- GitHub account
- LeetCode account

> Node.js is only required if you want to rebuild the project. The repository already contains the compiled `dist` folder.

---

# 1. Clone the Repository

Open PowerShell, Command Prompt, or Git Bash.

```bash
git clone https://github.com/RajputDhruv-FE/CodeGitSync.git
```

Then enter the project directory:

```bash
cd CodeGitSync
```

The project should contain:

```text
CodeGitSync/
├── src/
├── dist/
├── manifest.json
├── package.json
├── tsconfig.json
└── README.md
```

> The `dist` folder is already included, so you do not need to build the project before installing the extension.

---

# 2. Install the Extension in Chrome

### Step 1

Open:

```text
chrome://extensions
```

### Step 2

Enable **Developer mode**.

### Step 3

Click **Load unpacked**.

### Step 4

Select the `CodeGitSync` folder that you cloned.

Make sure the selected folder contains:

```text
manifest.json
dist/
```

The extension should now appear as:

**LeetCode GitHub Sync**

---

# 3. Install the GitHub App

The extension uses the **Code-GIt-Sync** GitHub App to access your GitHub repositories.

## Install Code-GIt-Sync

👉 https://github.com/apps/code-git-sync/installations/new

Choose your GitHub account and complete the installation.

If GitHub asks you to select repositories, make sure the repositories you want the extension to use are included.

> **Important:** Installing the GitHub App and connecting GitHub inside the extension are two separate steps. You need to complete both.

---

# 4. Connect Your GitHub Account

After installing the GitHub App:

1. Open LeetCode.
2. Open any problem.
3. Open **LeetCode GitHub Sync** from your Chrome extensions.
4. Click **Connect GitHub**.
5. GitHub will open the authorization page.
6. Sign in if necessary.
7. Approve the authorization.

After successful authorization, your GitHub account is connected.

---

# 5. Solve a LeetCode Problem

Go to:

👉 https://leetcode.com/problems/

Choose any problem.

Solve it normally and click **Submit**.

When the result becomes:

```text
Accepted
```

the extension automatically detects the successful submission.

You do **not** need to manually push the solution.

---

# 6. Check Your GitHub Repository

The extension stores solutions in the:

```text
leetcode-solutions
```

repository.

For example:

```text
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
```

For Python:

```text
0001-two-sum/
├── README.md
└── solution.py
```

For Java:

```text
0001-two-sum/
├── README.md
└── solution.java
```

---

# 📁 What Gets Saved?

Each accepted problem contains two files.

### `README.md`

Contains the LeetCode problem description.

### `solution.<extension>`

Contains your submitted solution.

For example:

```text
0001-two-sum/
├── README.md
└── solution.cpp
```

---

# 🔄 How It Works

```text
LeetCode
   ↓
Submit Solution
   ↓
Accepted
   ↓
Extension Detects Submission
   ↓
GitHub API
   ↓
leetcode-solutions
   ↓
Problem Folder
   ├── README.md
   └── solution.cpp
```

After the initial setup, your workflow is simply:

```text
Solve
  ↓
Submit
  ↓
Accepted
  ↓
GitHub
```

---

# 🔐 Security

The extension uses GitHub OAuth to authenticate your account.

## The extension does not:

- Ask for your GitHub password
- Store your GitHub password
- Download your solutions locally
- Require you to manually upload every solution

The extension uses GitHub's API to create and update solution files.

## ⚠️ Important

Never share or commit:

```text
OAuth tokens
Refresh tokens
Client secrets
Private keys
.env files
.pem files
.key files
```

---

# 🛠️ Build From Source

Building is optional because the compiled `dist` folder is already included.

If you modify the TypeScript source code, run:

```bash
npm install
```

Then:

```bash
npm run build
```

For automatic rebuilding while developing:

```bash
npm run watch
```

After rebuilding:

1. Open `chrome://extensions`
2. Find **LeetCode GitHub Sync**
3. Click **Reload**

---

# 📂 Project Structure

```text
CodeGitSync/
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
```

## Main files

### `background.ts`

Handles GitHub authentication and GitHub API operations.

### `content.ts`

Handles accepted submissions and prepares files for GitHub.

### `interceptor.ts`

Detects LeetCode submission and result requests.

---

# 🐛 Troubleshooting

## GitHub connection does not work

Check the following:

- You are logged into the correct GitHub account.
- **Code-GIt-Sync** is installed on that account.
- You completed GitHub authorization.
- The Chrome extension is enabled.
- You are using the latest version of the project.

You can reload the extension from:

```text
chrome://extensions
```

Find the extension and click **Reload**.

---

## The solution was Accepted but is not on GitHub

Check:

1. The LeetCode submission says **Accepted**.
2. GitHub is connected.
3. The GitHub App is installed on the correct account.
4. The required repository permissions are available.
5. The extension is enabled.

Then reload the extension and try another accepted submission.

---

## `leetcode-solutions` repository cannot be created

Make sure the GitHub App has the required repository permissions.

Also check that the GitHub App was installed on the same GitHub account that you connected in the extension.

---

## Chrome shows an extension error

Open:

```text
chrome://extensions
```

Find **LeetCode GitHub Sync** and check the error details.

If you modified the source code, rebuild the project:

```bash
npm run build
```

Then click **Reload**.

---

# 👥 Using the Extension on Another Computer

If you want a friend to use the extension:

1. Your friend clones the repository.
2. Your friend loads it as an unpacked Chrome extension.
3. Your friend installs the **Code-GIt-Sync** GitHub App on their own GitHub account.
4. Your friend connects GitHub inside the extension.
5. Your friend solves a LeetCode problem.
6. The accepted solution is automatically synced to their GitHub.

Each person uses their **own GitHub account**.

You do not need to give your GitHub credentials to anyone.

---

# 🔄 Updating the Extension

When you release an update, users can get the latest project files with:

```bash
git pull
```

If the TypeScript source changed:

```bash
npm install
npm run build
```

Then reload the extension:

```text
chrome://extensions
```

→ **LeetCode GitHub Sync**

→ **Reload**

---

# ❓ FAQ

### Is the extension available on the Chrome Web Store?

No. It is currently installed manually as an unpacked extension.

### Do I need Node.js?

Not for normal installation. The repository already contains the compiled `dist` folder.

Node.js is only required if you want to modify or rebuild the source.

### Do I need to manually push every solution?

No. Accepted submissions are automatically synced after GitHub is connected.

### Are solutions downloaded to my computer?

No. The extension syncs the solution directly to GitHub.

### Can my friends use the extension?

Yes. They can clone the repository, install the GitHub App, and connect their own GitHub account.

### Can my friend access my GitHub account?

No. Each user authorizes their own GitHub account.

### Can I revoke access?

Yes. You can manage or revoke the application's access from your GitHub account settings.

---

# ⚠️ Current Distribution

LeetCode GitHub Sync is currently distributed as an **unpacked Chrome extension**.

It is **not published on the Chrome Web Store**.

Installation:

```text
Clone Repository
       ↓
Load Unpacked
       ↓
Install GitHub App
       ↓
Connect GitHub
       ↓
Solve LeetCode
       ↓
Accepted
       ↓
Automatically Synced
```

---

# ❤️ Keep Solving

You focus on solving problems.

The extension handles the repetitive work of organizing and syncing your solutions.

## 🧠 Solve + ✅ Get Accepted

🐙 **GitHub automatically updated**

**Happy Coding! 🚀**
