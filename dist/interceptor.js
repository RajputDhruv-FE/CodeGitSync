"use strict";
console.log("🔌 LeetCode network interceptor loaded");
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
    const response = await originalFetch.call(window, input, init);
    try {
        const url = typeof input === "string"
            ? input
            : input instanceof Request
                ? input.url
                : input.toString();
        /*
         * Capture the submission request
         */
        if (url.includes("/submit/")) {
            let body = init?.body;
            if (body instanceof Request) {
                body = await body.clone().text();
            }
            console.log("📤 LeetCode submit request detected");
            console.log("Submit URL:", url);
            console.log("Submit body:", body);
            let parsedBody = body;
            if (typeof body === "string") {
                try {
                    parsedBody = JSON.parse(body);
                }
                catch {
                    // Body may not be JSON
                }
            }
            const responseClone = response.clone();
            try {
                const data = await responseClone.json();
                console.log("📥 Submit response:", data);
                window.postMessage({
                    source: "leetcode-github-sync",
                    type: "SUBMISSION_CREATED",
                    payload: {
                        request: parsedBody,
                        response: data
                    }
                }, "*");
            }
            catch (error) {
                console.error("❌ Could not parse submit response", error);
            }
        }
        /*
         * Capture submission status checks
         */
        if (url.includes("/check/")) {
            const responseClone = response.clone();
            try {
                const data = await responseClone.json();
                console.log("📥 Submission check:", data);
                window.postMessage({
                    source: "leetcode-github-sync",
                    type: "SUBMISSION_CHECK",
                    payload: data
                }, "*");
            }
            catch (error) {
                console.error("❌ Could not parse check response", error);
            }
        }
    }
    catch (error) {
        console.error("❌ Network interceptor error:", error);
    }
    return response;
};
