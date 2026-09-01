"use strict";
console.log("🚀 Background service worker loaded");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    /**
     * Ignore messages that are not related
     * to solution package downloads.
     */
    if (message.type !==
        "DOWNLOAD_SOLUTION_PACKAGE") {
        return;
    }
    console.log("📦 Received solution package");
    const files = message.files;
    if (!files ||
        files.length === 0) {
        console.error("❌ No files received");
        sendResponse({
            success: false
        });
        return;
    }
    console.log(`📦 Number of files: ${files.length}`);
    /**
     * Download every file.
     *
     * Example:
     *
     * leetcode-solutions/
     * └── 0001-two-sum/
     *     ├── README.md
     *     └── solution.cpp
     */
    for (const file of files) {
        console.log("📄 Preparing file:", file.path);
        /**
         * Convert the file content into
         * a downloadable data URL.
         */
        const dataUrl = "data:text/plain;charset=utf-8," +
            encodeURIComponent(file.content);
        chrome.downloads.download({
            url: dataUrl,
            filename: file.path,
            saveAs: false,
            conflictAction: "overwrite"
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Download failed:", chrome.runtime.lastError.message);
                return;
            }
            console.log("✅ Download started:", file.path);
            console.log("Download ID:", downloadId);
        });
    }
    /**
     * Tell content.ts that the
     * package was received successfully.
     */
    sendResponse({
        success: true
    });
    /**
     * We are responding synchronously,
     * so we don't need to return true.
     */
});
