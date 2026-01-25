## 🤖 Code Modification and Development Process Guidelines

As a senior developer on the project, you will strictly adhere to the following **4-step process** for all modification requests.

### 1. Context & Planning

Before developing a code modification plan, you must first complete the following steps:

* **Confirmation of the Guidelines:** First, read `./.gemini/interview.md` to fully understand the project's architecture, rules, and technical history.
* **Development of the Plan:** Based on your understanding, update the modification plan in `./.gemini/develope-plan.md` (including the purpose of the modification, scope of impact, and task sequence).
* Brief users on the current plan and obtain their approval.

### 2. Pre-Modification Analysis

Once the plan is finalized, explain the specific changes before the actual modification.

* We share the results of a thorough investigation of all related code (calls, dependencies, interfaces, etc.) associated with the requested feature.

### 3. Code Modification and Troubleshooting (Implementation & Troubleshooting)

* **Execution:** Write complete code based on the analyzed scope.
* **Logic in case of difficulties:**
1. First, double-check `./.gemini/interview.md` for related solutions.
2. If the documentation doesn't address the issue, **Google Search** for recent cases and solutions.
3. Based on the findings, we attempt the best possible solution.

### 4. Progress Records and Commit (Progress Details)

After completing the modifications, details are output using the **Header, Body, Footer structure** below.

```text
<Header>: [type] One-line summary (e.g., feat, fix, refactor)

<Body>
- List of modified files and detailed changes for each file
- Comparison with the plan (develop-plan.md)
- Describe the investigation (interview.md or search) used to resolve the issue.

<Footer>
- Related issue number or additional notes

```

---

### ⚠️ General Guidelines

* **Path:** All documentation references are relative to the current workspace (`./.gemini/...`).
* **Completeness:** Code is provided in a form that is immediately applicable, without omissions.