"use strict";
const GITHUB_REPO_NAME = "leetcode-solutions";
const GITHUB_PRIVATE_REPO = false;
let currentSubmission = null;
let waitingForSubmission = false;
let acceptedSubmissionId = null;
console.log("🚀 LeetCode GitHub Sync loaded");
/**
 * Detect when the user clicks the Submit button.
 *
 * This resets the state before a new submission starts.
 */
function detectSubmitClick() {
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!target) {
            return;
        }
        const button = target.closest("button");
        if (!button) {
            return;
        }
        const buttonText = button.innerText.trim().toLowerCase();
        if (buttonText !== "submit") {
            return;
        }
        console.log("📤 Submit button clicked");
        waitingForSubmission = true;
        acceptedSubmissionId = null;
        currentSubmission = null;
        console.log("⏳ Waiting for NEW submission result...");
    }, true);
}
/**
 * Handle messages coming from interceptor.ts.
 */
window.addEventListener("message", (event) => {
    if (event.source !== window) {
        return;
    }
    const data = event.data;
    if (!data ||
        data.source !== "leetcode-github-sync") {
        return;
    }
    if (data.type === "SUBMISSION_CREATED") {
        handleSubmissionCreated(data.payload);
        return;
    }
    if (data.type === "SUBMISSION_CHECK") {
        handleSubmissionCheck(data.payload);
    }
});
/**
 * Capture the newly created submission.
 */
function handleSubmissionCreated(payload) {
    const request = payload?.request;
    const response = payload?.response;
    if (!request || !response) {
        console.error("❌ Submission data is missing");
        return;
    }
    const submissionId = response.submission_id;
    const questionId = request.question_id;
    const language = request.lang;
    const code = request.typed_code;
    if (submissionId === undefined ||
        questionId === undefined ||
        language === undefined ||
        code === undefined) {
        console.error("❌ Required submission information is missing", {
            submissionId,
            questionId,
            language,
            code
        });
        return;
    }
    currentSubmission = {
        submissionId: String(submissionId),
        questionId: String(questionId),
        language: String(language),
        code: String(code)
    };
    // The network event itself is enough to identify a new submission,
    // even if the user submitted through a keyboard shortcut.
    waitingForSubmission = true;
    acceptedSubmissionId = null;
    console.log("🎯 Submission captured!", currentSubmission);
}
/**
 * Handle LeetCode submission status updates.
 */
function handleSubmissionCheck(result) {
    if (!result) {
        return;
    }
    const status = result.status_msg ?? result.state;
    console.log("🔍 Submission status:", status);
    if (!waitingForSubmission || !currentSubmission) {
        return;
    }
    // Ignore status events belonging to a different submission.
    if (result.submission_id !== undefined &&
        String(result.submission_id) !== currentSubmission.submissionId) {
        console.log("⏭️ Ignoring status for a different submission:", {
            received: String(result.submission_id),
            current: currentSubmission.submissionId
        });
        return;
    }
    // LeetCode's accepted response has status_code 10 and status_msg
    // "Accepted". We also keep state/finished as compatible fallbacks.
    const isAccepted = result.status_msg === "Accepted" &&
        (result.status_code === 10 ||
            result.state === "SUCCESS" ||
            result.finished === true);
    if (!isAccepted) {
        return;
    }
    handleAcceptedSubmission(result);
}
/**
 * Handle a successfully accepted submission.
 */
function handleAcceptedSubmission(result) {
    if (!currentSubmission) {
        console.error("❌ Accepted submission received, but submission data is missing.");
        return;
    }
    const submissionId = currentSubmission.submissionId;
    // Prevent duplicate Accepted status responses for the same submission.
    if (acceptedSubmissionId === submissionId) {
        return;
    }
    acceptedSubmissionId = submissionId;
    waitingForSubmission = false;
    const problemInfo = getProblemInfo();
    if (!problemInfo) {
        console.error("❌ Could not get problem information.");
        showNotification("⚠️ Accepted, but problem information could not be read.", false);
        return;
    }
    const submission = {
        submissionId,
        questionId: currentSubmission.questionId,
        language: currentSubmission.language,
        code: currentSubmission.code,
        status: "Accepted",
        problem: problemInfo
    };
    console.log("🎉 ACCEPTED SUBMISSION", submission);
    createSolutionPackage(submission);
}
/**
 * Create the files used by both local download and GitHub sync.
 *
 * GitHub paths:
 *   0001-two-sum/README.md
 *   0001-two-sum/solution.cpp
 *
 * Local download paths:
 *   leetcode-solutions/0001-two-sum/README.md
 *   leetcode-solutions/0001-two-sum/solution.cpp
 */
function createSolutionPackage(submission) {
    console.log("📁 Creating solution package...");
    const problem = submission.problem;
    const folderName = createFolderName(problem.number, problem.slug);
    const extension = getFileExtension(submission.language);
    const githubFiles = [
        {
            path: `${folderName}/README.md`,
            content: problem.description
        },
        {
            path: `${folderName}/solution.${extension}`,
            content: submission.code
        }
    ];
    const downloadFiles = githubFiles.map((file) => ({
        path: `leetcode-solutions/${file.path}`,
        content: file.content
    }));
    console.log("📦 Package folder:", folderName);
    console.log("📄 GitHub files:", githubFiles);
    // Always keep the existing local download behavior.
    chrome.runtime.sendMessage({
        type: "DOWNLOAD_SOLUTION_PACKAGE",
        files: downloadFiles
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Failed to communicate with background worker for download:", chrome.runtime.lastError.message);
            return;
        }
        if (response?.success) {
            console.log("✅ Local solution package download started.");
        }
        else {
            console.error("❌ Local solution package download failed:", response?.error);
        }
    });
    // Automatically push the accepted solution to GitHub.
    showNotification("🎉 Accepted! Syncing solution to GitHub...", true);
    chrome.runtime.sendMessage({
        type: "PUSH_SOLUTION",
        repoName: GITHUB_REPO_NAME,
        files: githubFiles,
        privateRepo: GITHUB_PRIVATE_REPO,
        submissionId: submission.submissionId
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ Failed to communicate with background worker for GitHub push:", chrome.runtime.lastError.message);
            showNotification("⚠️ Saved locally, but GitHub sync failed.", false);
            return;
        }
        console.log("🚀 GitHub push response:", response);
        if (response?.success) {
            showNotification(`✅ Synced to GitHub: ${response.repository}`, true);
        }
        else {
            showNotification(`⚠️ Saved locally, but GitHub sync failed: ${response?.error ?? "Unknown error"}`, false);
        }
    });
}
/**
 * Create the solution folder name.
 */
function createFolderName(number, slug) {
    const paddedNumber = String(number).padStart(4, "0");
    const safeSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${paddedNumber}-${safeSlug}`;
}
/**
 * Convert LeetCode's language name into a file extension.
 */
function getFileExtension(language) {
    const normalized = language.toLowerCase().trim();
    const extensions = {
        cpp: "cpp",
        "c++": "cpp",
        c: "c",
        java: "java",
        python: "py",
        python3: "py",
        javascript: "js",
        js: "js",
        typescript: "ts",
        ts: "ts",
        csharp: "cs",
        "c#": "cs",
        go: "go",
        rust: "rs",
        kotlin: "kt",
        swift: "swift",
        php: "php",
        ruby: "rb",
        scala: "scala",
        dart: "dart"
    };
    return (extensions[normalized] ??
        normalized.replace(/[^a-z0-9]+/g, "")) ||
        "txt";
}
/**
 * Get the current LeetCode problem information from the page.
 */
function getProblemInfo() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    if (!match) {
        console.error("❌ Could not find problem slug");
        return null;
    }
    const slug = match[1];
    const titleElement = document.querySelector(`a[href="/problems/${slug}/"]`);
    const fullTitle = titleElement?.textContent?.trim();
    if (!fullTitle) {
        console.error("❌ Could not find problem title");
        return null;
    }
    const titleMatch = fullTitle.match(/^([0-9]+)\.\s*(.+)$/);
    if (!titleMatch) {
        console.error("❌ Could not separate problem number and title");
        return null;
    }
    const number = Number(titleMatch[1]);
    const title = titleMatch[2];
    const descriptionElement = document.querySelector('[data-track-load="description_content"]');
    const description = descriptionElement?.textContent?.trim();
    const descriptionHtml = descriptionElement?.innerHTML ?? "";
    if (!description) {
        console.error("❌ Could not find problem description");
        return null;
    }
    return {
        number,
        title,
        slug,
        description,
        descriptionHtml
    };
}
/**
 * Show a temporary status notification.
 */
function showNotification(message, success) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.zIndex = "999999";
    notification.style.maxWidth = "420px";
    notification.style.padding = "15px 20px";
    notification.style.borderRadius = "8px";
    notification.style.background = success ? "#22c55e" : "#dc2626";
    notification.style.color = "white";
    notification.style.fontSize = "14px";
    notification.style.fontWeight = "bold";
    notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
/**
 * Start detecting Submit button clicks.
 */
detectSubmitClick();
console.log("👀 Waiting for Submit...");
/**
 * GitHub connection button.
 */
const connectButton = document.createElement("button");
connectButton.textContent = "Connect GitHub";
connectButton.style.position = "fixed";
connectButton.style.bottom = "20px";
connectButton.style.right = "20px";
connectButton.style.zIndex = "999999";
connectButton.style.padding = "10px 16px";
connectButton.style.background = "#24292e";
connectButton.style.color = "white";
connectButton.style.border = "none";
connectButton.style.borderRadius = "6px";
connectButton.style.cursor = "pointer";
connectButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CONNECT_GITHUB" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("❌ GitHub connection request failed:", chrome.runtime.lastError.message);
            alert("GitHub connection failed.");
            return;
        }
        console.log("GitHub connection response:", response);
        if (response?.success) {
            alert("GitHub connected successfully!");
        }
        else {
            alert("GitHub connection failed: " +
                (response?.error ?? "Unknown error"));
        }
    });
});
document.body.appendChild(connectButton);
