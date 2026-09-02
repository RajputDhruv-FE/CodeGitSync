interface ProblemInfo {
  number: number;
  title: string;
  slug: string;
  description: string;
  descriptionHtml: string;
}

interface Submission {
  submissionId: string;
  questionId: string;
  language: string;
  code: string;
  status: string;
  problem: ProblemInfo;
}

interface CurrentSubmission {
  submissionId: string;
  questionId: string;
  language: string;
  code: string;
}

interface PackageFile {
  path: string;
  content: string;
}

let currentSubmission: CurrentSubmission | null = null;

console.log("🚀 LeetCode GitHub Sync loaded");

let waitingForSubmission = false;
let acceptedDetected = false;

/**
 * Detect when the user clicks the Submit button.
 *
 * This is mainly used to reset the state before
 * a new submission starts.
 */
function detectSubmitClick(): void {
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement | null;

      if (!target) {
        return;
      }

      const button =
        target.closest("button");

      if (!button) {
        return;
      }

      const buttonText =
        button.innerText
          .trim()
          .toLowerCase();

      if (buttonText !== "submit") {
        return;
      }

      console.log(
        "📤 Submit button clicked"
      );

      waitingForSubmission = true;
      acceptedDetected = false;

      // Clear the previous submission.
      currentSubmission = null;

      console.log(
        "⏳ Waiting for NEW submission result..."
      );
    },
    true
  );
}

/**
 * Handle messages coming from interceptor.ts.
 *
 * interceptor.ts runs in the MAIN world and captures
 * LeetCode's actual network requests.
 */
window.addEventListener(
  "message",
  (event: MessageEvent) => {
    // Only accept messages coming from this page itself.
    if (event.source !== window) {
      return;
    }

    const data = event.data;

    if (
      !data ||
      data.source !==
        "leetcode-github-sync"
    ) {
      return;
    }

    /**
     * A new submission was created.
     *
     * Contains:
     *
     * request:
     *   lang
     *   question_id
     *   typed_code
     *
     * response:
     *   submission_id
     */
    if (
      data.type ===
      "SUBMISSION_CREATED"
    ) {
      handleSubmissionCreated(
        data.payload
      );
    }

    /**
     * LeetCode sends multiple submission
     * status updates:
     *
     * PENDING
     * PENDING
     * COMPILING
     * ...
     * Accepted
     */
    if (
      data.type ===
      "SUBMISSION_CHECK"
    ) {
      handleSubmissionCheck(
        data.payload
      );
    }
  }
);

/**
 * Handle the initial submission request.
 *
 * This captures:
 *
 * - submission ID
 * - question ID
 * - programming language
 * - submitted code
 */
function handleSubmissionCreated(
  payload: {
    request?: Record<
      string,
      unknown
    >;
    response?: Record<
      string,
      unknown
    >;
  }
): void {
  const request =
    payload?.request;

  const response =
    payload?.response;

  if (!request || !response) {
    console.error(
      "❌ Submission data is missing"
    );

    return;
  }

  const submissionId =
    response.submission_id;

  const questionId =
    request.question_id;

  const language =
    request.lang;

  const code =
    request.typed_code;

  if (
    submissionId === undefined ||
    questionId === undefined ||
    language === undefined ||
    code === undefined
  ) {
    console.error(
      "❌ Required submission information is missing",
      {
        submissionId,
        questionId,
        language,
        code
      }
    );

    return;
  }

  currentSubmission = {
    submissionId:
      String(submissionId),

    questionId:
      String(questionId),

    language:
      String(language),

    code:
      String(code)
  };

  console.log(
    "🎯 Submission captured!"
  );

  console.log(
    "📦 Current submission:",
    currentSubmission
  );

  console.log(
    "📝 Submitted code:",
    currentSubmission.code
  );
}

/**
 * Handle a submission status response.
 */
function handleSubmissionCheck(
  result: Record<string, unknown>
): void {
  if (!result) {
    return;
  }

  const status =
    result.status_msg ??
    result.state;

  console.log(
    "🔍 Submission status:",
    status
  );

  /**
   * We only process the submission when:
   *
   * 1. LeetCode has finished judging it
   * 2. The result is Accepted
   */
  if (
    result.finished === true &&
    result.status_msg === "Accepted"
  ) {
    handleAcceptedSubmission(
      result
    );
  }
}

/**
 * Handle a successfully accepted submission.
 */
function handleAcceptedSubmission(
  result: Record<string, unknown>
): void {
  /**
   * Prevent the same Accepted result
   * from being processed more than once.
   */
  if (acceptedDetected) {
    return;
  }

  acceptedDetected = true;
  waitingForSubmission = false;

  /**
   * Make sure we captured the submitted
   * code first.
   */
  if (!currentSubmission) {
    console.error(
      "❌ Accepted submission received, but submission data is missing."
    );

    return;
  }

  /**
   * Get the problem information from
   * the current LeetCode page.
   */
  const problemInfo =
    getProblemInfo();

  if (!problemInfo) {
    console.error(
      "❌ Could not get problem information."
    );

    return;
  }

  /**
   * Build the complete submission object.
   */
  const submission: Submission = {
    submissionId:
      currentSubmission.submissionId,

    questionId:
      currentSubmission.questionId,

    language:
      currentSubmission.language,

    code:
      currentSubmission.code,

    status:
      String(result.status_msg),

    problem:
      problemInfo
  };

  console.log(
    "🎉 ACCEPTED SUBMISSION"
  );

  console.log(
    "📦 Complete submission:",
    submission
  );

  /**
   * Create the solution package.
   */
  createSolutionPackage(
    submission
  );

  /**
   * Show success notification.
   */
  showNotification();
}

/**
 * Create the files that will make up
 * the LeetCode solution package.
 *
 * Example:
 *
 * leetcode-solutions/
 * └── 0001-two-sum/
 *     ├── README.md
 *     └── solution.cpp
 */
function createSolutionPackage(
  submission: Submission
): void {
  console.log(
    "📁 Creating solution package..."
  );

  const problem =
    submission.problem;

  /**
   * Create a safe folder name.
   *
   * Example:
   *
   * 1 + two-sum
   *
   * becomes:
   *
   * 0001-two-sum
   */
  const folderName =
    createFolderName(
      problem.number,
      problem.slug
    );

  /**
   * Determine the source-code
   * file extension.
   */
  const extension =
    getFileExtension(
      submission.language
    );

  /**
   * Create the paths.
   */
  const solutionPath =
    `leetcode-solutions/${folderName}/solution.${extension}`;

  const readmePath =
    `leetcode-solutions/${folderName}/README.md`;

  /**
   * For Version 1, the README contains
   * only the LeetCode problem description.
   */
  const readmeContent =
    problem.description;

  const files: PackageFile[] = [
    {
      path: readmePath,
      content: readmeContent
    },
    {
      path: solutionPath,
      content: submission.code
    }
  ];

  console.log(
    "📦 Package folder:",
    folderName
  );

  console.log(
    "📄 README path:",
    readmePath
  );

  console.log(
    "💻 Solution path:",
    solutionPath
  );

  console.log(
    "📦 Files:",
    files
  );

  /**
   * Send the files to background.ts.
   *
   * background.ts is responsible for
   * downloading them.
   */
  chrome.runtime.sendMessage(
    {
      type:
        "DOWNLOAD_SOLUTION_PACKAGE",

      files
    },
    (response) => {
      if (
        chrome.runtime.lastError
      ) {
        console.error(
          "❌ Failed to communicate with background worker:",
          chrome.runtime.lastError.message
        );

        return;
      }

      console.log(
        "✅ Solution package sent to background worker.",
        response
      );
    }
  );
}

/**
 * Create the solution folder name.
 *
 * Example:
 *
 * number = 1
 * slug   = two-sum
 *
 * result:
 *
 * 0001-two-sum
 */
function createFolderName(
  number: number,
  slug: string
): string {
  const paddedNumber =
    String(number).padStart(
      4,
      "0"
    );

  const safeSlug =
    slug
      .toLowerCase()
      .replace(
        /[^a-z0-9-]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return `${paddedNumber}-${safeSlug}`;
}

/**
 * Convert LeetCode's language name
 * into a file extension.
 */
function getFileExtension(
  language: string
): string {
  const normalized =
    language
      .toLowerCase()
      .trim();

  const extensions: Record<
    string,
    string
  > = {
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

  /**
   * Use the known extension if available.
   */
  if (extensions[normalized]) {
    return extensions[normalized];
  }

  /**
   * Fallback:
   *
   * Convert unknown language names
   * into a reasonably safe extension.
   */
  return normalized
    .replace(
      /[^a-z0-9]+/g,
      ""
    ) || "txt";
}

/**
 * Get the current LeetCode problem
 * information from the page.
 */
function getProblemInfo():
  | ProblemInfo
  | null {
  /**
   * Get problem slug from URL.
   *
   * Example:
   *
   * /problems/two-sum/
   *
   * becomes:
   *
   * two-sum
   */
  const match =
    window.location.pathname.match(
      /\/problems\/([^/]+)/
    );

  if (!match) {
    console.error(
      "❌ Could not find problem slug"
    );

    return null;
  }

  const slug =
    match[1];

  /**
   * Get problem title.
   *
   * Example:
   *
   * 1. Two Sum
   */
  const titleElement =
    document.querySelector(
      `a[href="/problems/${slug}/"]`
    );

  const fullTitle =
    titleElement
      ?.textContent
      ?.trim();

  if (!fullTitle) {
    console.error(
      "❌ Could not find problem title"
    );

    return null;
  }

  /**
   * Separate problem number
   * and title.
   *
   * "1. Two Sum"
   *
   * becomes:
   *
   * number = 1
   * title = "Two Sum"
   */
  const titleMatch =
    fullTitle.match(
      /^(\d+)\.\s*(.+)$/
    );

  if (!titleMatch) {
    console.error(
      "❌ Could not separate problem number and title"
    );

    return null;
  }

  const number =
    Number(titleMatch[1]);

  const title =
    titleMatch[2];

  /**
   * Get the problem description.
   *
   * We use the stable
   * data-track-load attribute instead
   * of generated CSS class names.
   */
  const descriptionElement =
    document.querySelector(
      '[data-track-load="description_content"]'
    );

  const description =
    descriptionElement
      ?.textContent
      ?.trim();

  const descriptionHtml =
    descriptionElement
      ?.innerHTML ?? "";

  if (!description) {
    console.error(
      "❌ Could not find problem description"
    );

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
 * Show success notification.
 */
function showNotification(): void {
  const notification =
    document.createElement(
      "div"
    );

  notification.textContent =
    "🎉 LeetCode submission accepted!";

  notification.style.position =
    "fixed";

  notification.style.top =
    "20px";

  notification.style.right =
    "20px";

  notification.style.zIndex =
    "999999";

  notification.style.padding =
    "15px 20px";

  notification.style.borderRadius =
    "8px";

  notification.style.background =
    "#22c55e";

  notification.style.color =
    "white";

  notification.style.fontSize =
    "16px";

  notification.style.fontWeight =
    "bold";

  document.body.appendChild(
    notification
  );

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Start detecting Submit button clicks.
 */
detectSubmitClick();

console.log(
  "👀 Waiting for Submit..."
);

/**
 * Get problem information once
 * when the page loads.
 */
const problemInfo =
  getProblemInfo();

console.log(
  "📚 Problem Information:"
);

console.log(
  problemInfo
);

const button =
  document.createElement("button");

button.textContent =
  "Connect GitHub";

button.style.position =
  "fixed";

button.style.bottom =
  "20px";

button.style.right =
  "20px";

button.style.zIndex =
  "999999";

button.style.padding =
  "10px 16px";

button.style.background =
  "#24292e";

button.style.color =
  "white";

button.style.border =
  "none";

button.style.borderRadius =
  "6px";

button.style.cursor =
  "pointer";


button.addEventListener(
  "click",
  () => {

    chrome.runtime.sendMessage(
      {
        type: "CONNECT_GITHUB"
      },
      (response) => {

        console.log(
          "GitHub connection response:",
          response
        );


        if (
          response?.success
        ) {

          alert(
            "GitHub connected successfully!"
          );

        } else {

          alert(
            "GitHub connection failed: " +
            response?.error
          );

        }

      }
    );

  }
);


document.body.appendChild(button);


const githubTestButton =
  document.createElement("button");

githubTestButton.textContent =
  "🚀 Test GitHub Push";

githubTestButton.style.position =
  "fixed";

githubTestButton.style.bottom =
  "70px";

githubTestButton.style.right =
  "20px";

githubTestButton.style.zIndex =
  "999999";

githubTestButton.style.padding =
  "12px 18px";

githubTestButton.style.background =
  "#238636";

githubTestButton.style.color =
  "white";

githubTestButton.style.border =
  "none";

githubTestButton.style.borderRadius =
  "8px";

githubTestButton.style.cursor =
  "pointer";

githubTestButton.addEventListener(
  "click",
  () => {
    const files: PackageFile[] = [
      {
        path: "0001-two-sum/README.md",
        content:
          "# Two Sum\n\nTest repository push."
      },
      {
        path: "0001-two-sum/solution.cpp",
        content:
          "#include <iostream>\n\nint main() {\n    return 0;\n}\n"
      }
    ];

    chrome.runtime.sendMessage(
      {
        type: "PUSH_SOLUTION",

        // Repository we want
        repoName: "leetcode-solutions",

        files,

        // Change to true if you want private
        privateRepo: false
      },
      (response) => {
        console.log(
          "GitHub push response:",
          response
        );

        if (response?.success) {
          alert(
            `Successfully pushed to ${response.repository}`
          );
        } else {
          alert(
            `GitHub push failed: ${response?.error}`
          );
        }
      }
    );
  }
);

document.body.appendChild(
  githubTestButton
);