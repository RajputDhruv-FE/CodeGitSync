"use strict";
// ==================================================
// Types
// ==================================================
// ==================================================
// Configuration
// ==================================================
const GITHUB_CLIENT_ID = "Iv23liMHh6YPolYNJoPW";
const GITHUB_REDIRECT_URI = "https://kpidkggeaoidlnojddjchfcngfhmmdnb.chromiumapp.org/";
const BACKEND_URL = "https://code-git-sync.onrender.com";
// "http://localhost:4000";
const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
console.log("🚀 Background service worker loaded");
// ==================================================
// PKCE Helpers
// ==================================================
function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomValues)
        .map((value) => characters[value % characters.length])
        .join("");
}
async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}
// ==================================================
// GitHub Authentication
// ==================================================
async function connectGitHub() {
    console.log("🔐 Starting GitHub authentication...");
    // ------------------------------------------------
    // Generate OAuth state
    // ------------------------------------------------
    const state = generateRandomString(32);
    // ------------------------------------------------
    // Generate PKCE verifier
    // ------------------------------------------------
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    console.log("🔑 PKCE credentials generated");
    // ------------------------------------------------
    // Build GitHub authorization URL
    // ------------------------------------------------
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    console.log("🌐 Opening GitHub authorization...");
    console.log("GitHub OAuth URL:", authUrl.toString());
    // ------------------------------------------------
    // Open GitHub authorization page
    // ------------------------------------------------
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true
    });
    if (!redirectUrl) {
        throw new Error("GitHub authorization failed");
    }
    console.log("↩️ GitHub authorization completed");
    // ------------------------------------------------
    // Parse callback URL
    // ------------------------------------------------
    const callbackUrl = new URL(redirectUrl);
    const returnedState = callbackUrl.searchParams.get("state");
    const code = callbackUrl.searchParams.get("code");
    const error = callbackUrl.searchParams.get("error");
    // ------------------------------------------------
    // Check GitHub error
    // ------------------------------------------------
    if (error) {
        const errorDescription = callbackUrl.searchParams.get("error_description");
        throw new Error(errorDescription ||
            error);
    }
    // ------------------------------------------------
    // Validate OAuth state
    // ------------------------------------------------
    if (returnedState !== state) {
        throw new Error("Invalid OAuth state");
    }
    // ------------------------------------------------
    // Validate authorization code
    // ------------------------------------------------
    if (!code) {
        throw new Error("GitHub did not return an authorization code");
    }
    console.log("✅ Authorization code received");
    // ------------------------------------------------
    // Send code to backend
    // ------------------------------------------------
    console.log("📡 Sending authorization code to backend...");
    const response = await fetch(`${BACKEND_URL}/auth/github`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            code,
            code_verifier: codeVerifier
        })
    });
    const data = await response.json();
    // ------------------------------------------------
    // Check backend response
    // ------------------------------------------------
    if (!response.ok) {
        console.error("❌ GitHub token exchange failed:", data);
        throw new Error(data.error_description ||
            data.error ||
            "GitHub authentication failed");
    }
    console.log("✅ GitHub authentication successful");
    // ------------------------------------------------
    // Store authentication information
    // ------------------------------------------------
    await chrome.storage.local.set({
        githubAuth: data
    });
    console.log("💾 GitHub authentication stored");
    return data;
}
// ==================================================
// GitHub API Helper
// ==================================================
async function githubRequest(token, endpoint, options = {}) {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
        ...options,
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });
    //   console.log("GitHub API:", endpoint);
    //   console.log("Status:", response.status);
    //   console.log(
    //     "Required permissions:",
    //     response.headers.get("X-Accepted-GitHub-Permissions")
    //   );
    return response;
}
// ==================================================
// Get GitHub User
// ==================================================
async function getGitHubUser(token) {
    const response = await githubRequest(token, "/user");
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get GitHub user: ${response.status} ${error}`);
    }
    return response.json();
}
// ==================================================
// Get Repository
// ==================================================
async function getRepository(token, owner, repoName) {
    const response = await githubRequest(token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`);
    // Repository doesn't exist
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to check repository: ${response.status} ${error}`);
    }
    return response.json();
}
// ==================================================
// Create Repository
// ==================================================
async function createRepository(token, repoName, privateRepo) {
    console.log(`📦 Repository "${repoName}" does not exist. Creating it...`);
    const response = await githubRequest(token, "/user/repos", {
        method: "POST",
        body: JSON.stringify({
            name: repoName,
            description: "LeetCode solutions synced automatically",
            private: privateRepo,
            // Creates initial commit
            // and default branch
            auto_init: true
        })
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create repository: ${response.status} ${error}`);
    }
    const repository = (await response.json());
    console.log(`✅ Repository created: ${repository.full_name}`);
    return repository;
}
// ==================================================
// Encode Content to Base64
// ==================================================
function encodeBase64(content) {
    const bytes = new TextEncoder().encode(content);
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}
// ==================================================
// Get Existing File SHA
// ==================================================
async function getFileSha(token, owner, repoName, path) {
    const encodedPath = path
        .split("/")
        .map(encodeURIComponent)
        .join("/");
    const response = await githubRequest(token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${encodedPath}`);
    // File doesn't exist
    if (response.status === 404) {
        return undefined;
    }
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to check file ${path}: ${response.status} ${error}`);
    }
    const data = await response.json();
    return data.sha;
}
// ==================================================
// Push One File
// ==================================================
async function pushFile(token, owner, repoName, file, branch) {
    console.log(`📤 Preparing to push: ${file.path}`);
    // Check whether file already exists
    const sha = await getFileSha(token, owner, repoName, file.path);
    const body = {
        message: `Add/update ${file.path}`,
        content: encodeBase64(file.content),
        branch
    };
    // Required when updating an existing file
    if (sha) {
        body.sha = sha;
    }
    const encodedPath = file.path
        .split("/")
        .map(encodeURIComponent)
        .join("/");
    const response = await githubRequest(token, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${encodedPath}`, {
        method: "PUT",
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to push ${file.path}: ${response.status} ${error}`);
    }
    console.log(`✅ Pushed: ${file.path}`);
}
// ==================================================
// Push Complete Solution
// ==================================================
async function pushSolution(repoName, files, privateRepo = false, submissionId) {
    // ------------------------------------------------
    // Validate repository name
    // ------------------------------------------------
    if (!repoName.trim()) {
        throw new Error("Repository name is required");
    }
    // ------------------------------------------------
    // Validate files
    // ------------------------------------------------
    if (!files ||
        files.length === 0) {
        throw new Error("No solution files to push");
    }
    // ------------------------------------------------
    // Get stored GitHub authentication
    // ------------------------------------------------
    const auth = await chrome.storage.local.get("githubAuth");
    /*
     * IMPORTANT:
     *
     * chrome.storage.local.get()
     * returns an object whose properties
     * are not automatically typed.
     *
     * We explicitly cast githubAuth here.
     */
    const githubAuth = auth.githubAuth;
    if (!githubAuth ||
        !githubAuth.access_token) {
        throw new Error("GitHub is not connected");
    }
    const token = githubAuth.access_token;
    console.log("🔑 GitHub access token found");
    if (submissionId) {
        console.log(`🆔 Syncing submission: ${submissionId}`);
    }
    // ------------------------------------------------
    // Get GitHub username
    // ------------------------------------------------
    const user = await getGitHubUser(token);
    console.log(`👤 GitHub user: ${user.login}`);
    // ------------------------------------------------
    // Check repository
    // ------------------------------------------------
    let repository = await getRepository(token, user.login, repoName);
    // ------------------------------------------------
    // Create repository if required
    // ------------------------------------------------
    if (!repository) {
        repository =
            await createRepository(token, repoName, privateRepo);
    }
    else {
        console.log(`📦 Repository already exists: ${repository.full_name}`);
    }
    // ------------------------------------------------
    // Push files one by one
    // ------------------------------------------------
    for (const file of files) {
        await pushFile(token, user.login, repoName, file, repository.default_branch);
    }
    console.log("🎉 All solution files pushed successfully");
    return {
        success: true,
        repository: repository.full_name,
        url: repository.html_url
    };
}
// ==================================================
// Message Listener
// ==================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // ==================================================
    // CONNECT GITHUB
    // ==================================================
    if (message.type ===
        "CONNECT_GITHUB") {
        console.log("🔐 Connect GitHub requested");
        connectGitHub()
            .then((data) => {
            sendResponse({
                success: true,
                data
            });
        })
            .catch((error) => {
            console.error("❌ GitHub connection failed:", error);
            sendResponse({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "GitHub authentication failed"
            });
        });
        // Keep message channel open
        return true;
    }
    // ==================================================
    // PUSH SOLUTION
    // ==================================================
    if (message.type ===
        "PUSH_SOLUTION") {
        console.log("📤 Push solution requested");
        pushSolution(message.repoName, message.files, message.privateRepo ??
            false, message.submissionId)
            .then((result) => {
            console.log("🚀 Solution pushed successfully:", result);
            sendResponse(result);
        })
            .catch((error) => {
            console.error("❌ Failed to push solution:", error);
            sendResponse({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to push solution"
            });
        });
        // Keep message channel open
        return true;
    }
    // ==================================================
    // DOWNLOAD SOLUTION PACKAGE
    // ==================================================
    if (message.type ===
        "DOWNLOAD_SOLUTION_PACKAGE") {
        console.log("📦 Received solution package");
        const files = message.files;
        // ------------------------------------------------
        // Validate files
        // ------------------------------------------------
        if (!files ||
            files.length === 0) {
            console.error("❌ No files received");
            sendResponse({
                success: false,
                error: "No files received"
            });
            return;
        }
        console.log(`📦 Number of files: ${files.length}`);
        // ------------------------------------------------
        // Download every file
        // ------------------------------------------------
        for (const file of files) {
            console.log("📄 Preparing file:", file.path);
            // ------------------------------------------------
            // Convert content into data URL
            // ------------------------------------------------
            const dataUrl = "data:text/plain;charset=utf-8," +
                encodeURIComponent(file.content);
            chrome.downloads.download({
                url: dataUrl,
                filename: file.path,
                saveAs: false,
                conflictAction: "overwrite"
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Download failed:", chrome.runtime
                        .lastError
                        .message);
                    return;
                }
                console.log("✅ Download started:", file.path);
                console.log("Download ID:", downloadId);
            });
        }
        // ------------------------------------------------
        // Tell sender the package was received
        // ------------------------------------------------
        sendResponse({
            success: true
        });
        return;
    }
    // ==================================================
    // Unknown Message
    // ==================================================
    console.warn("⚠️ Unknown background message:", message);
    return;
});
