# WCAG 2.2 Implementation & Auditing Rules
**Technical Reference for AI-Powered Accessibility Audit System**

This document outlines how each WCAG 2.2 Success Criterion is evaluated within the system. We use a multi-layered approach combining deterministic automation with semantic AI analysis.

---

## 👂 Principle 1: Perceivable
*Information and user interface components must be presentable to users in ways they can perceive.*

### 1.1.1 Non-text Content (Level A)
*   **Category**: Perceivable
*   **Implementation Type**: **axe-core** (fully automated)
*   **How Evaluated**: DOM parsing of all img, svg, area, and input[type="image"] elements.
*   **Detection Logic**: axe-core rule `image-alt`. Checks for the presence of the `alt` attribute or ARIA equivalent.
*   **Example Failure**: `<img src="logo.png">`
*   **Suggested Fix**: `<img src="logo.png" alt="Company Name">`
*   **Confidence Level**: **High**

### 1.4.3 Contrast (Minimum) (Level AA)
*   **Category**: Perceivable
*   **Implementation Type**: **axe-core** (fully automated)
*   **How Evaluated**: Style computation of foreground and background colors.
*   **Detection Logic**: axe-core rule `color-contrast`. Calculates the contrast ratio against a 4.5:1 requirement.
*   **Example Failure**: Text `#999` on background `#FFF`.
*   **Suggested Fix**: Darken the text color to `#595959` or darker.
*   **Confidence Level**: **High**

### 1.4.11 Non-text Contrast (Level AA - WCAG 2.1)
*   **Category**: Perceivable
*   **Implementation Type**: **hybrid** (axe-core + AI)
*   **How Evaluated**: DOM style parsing + AI semantic review of graphical boundaries.
*   **Detection Logic**: axe-core rule `graphics-contrast`. AI is used to determine if a border or boundary is "essential" for understanding the UI component.
*   **Example Failure**: A light blue button border on a white background with no other outline.
*   **Suggested Fix**: Ensure graphical boundaries have a 3:1 contrast ratio.
*   **Confidence Level**: **Medium**

---

## ⌨️ Principle 2: Operable
*User interface components and navigation must be operable.*

### 2.1.1 Keyboard (Level A)
*   **Category**: Operable
*   **Implementation Type**: **axe-core** (fully automated)
*   **How Evaluated**: Interaction simulation and focusable element audit.
*   **Detection Logic**: axe-core rule `button-name`, `link-name`, and `accesskeys`. Checks if interactive elements are focusable and triggered by the Enter/Space keys.
*   **Example Failure**: A `<div>` with an `onclick` event but no `tabindex`.
*   **Suggested Fix**: Use native `<button>` or add `role="button"` and `tabindex="0"`.
*   **Confidence Level**: **High**

### 2.4.4 Link Purpose (In Context) (Level A)
*   **Category**: Operable
*   **Implementation Type**: **AI-assisted**
*   **How Evaluated**: AI prompt analysis of link text surroundings.
*   **Detection Logic**: Text content is sent to AI to verify if "Click Here" or "Read More" provides enough context based on the surrounding paragraph.
*   **Example Failure**: `<a href="/results">Learn More</a>` nested in a generic paragraph.
*   **Suggested Fix**: `<a href="/results">Learn more about audit results</a>`
*   **Confidence Level**: **Medium**

### 2.5.8 Target Size (Minimum) (Level AA - WCAG 2.2)
*   **Category**: Operable
*   **Implementation Type**: **custom-rule**
*   **How Evaluated**: Bounding box calculation of all clickable elements.
*   **Detection Logic**: Script calculates if the interactive area is at least 24x24 CSS pixels.
*   **Example Failure**: A close button in a modal that is only 12x12 pixels.
*   **Suggested Fix**: Increase padding or dimensions to reach 24px minimum.
*   **Confidence Level**: **High**

---

## 🧠 Principle 3: Understandable
*Information and the operation of the user interface must be understandable.*

### 3.1.1 Language of Page (Level A)
*   **Category**: Understandable
*   **Implementation Type**: **axe-core** (fully automated)
*   **How Evaluated**: DOM parsing of the `<html>` root element.
*   **Detection Logic**: axe-core rule `html-has-lang`. Checks for a valid ISO language code.
*   **Example Failure**: `<html>` (missing lang).
*   **Suggested Fix**: `<html lang="en">`
*   **Confidence Level**: **High**

### 3.3.2 Labels or Instructions (Level A)
*   **Category**: Understandable
*   **Implementation Type**: **AI-assisted**
*   **How Evaluated**: AI analysis of the relationship between visual labels and input IDs.
*   **Detection Logic**: axe-core finds orphaned inputs; AI evaluates if the *placeholder* or *neighboring text* acts as a sufficient label for the user's intent.
*   **Example Failure**: `<input type="text" />` with no associated `<label>`.
*   **Suggested Fix**: `<label for="name">Name</label><input id="name" type="text">`
*   **Confidence Level**: **Medium**

---

## 🏗️ Principle 4: Robust
*Content must be robust enough that it can be interpreted by a wide variety of user agents.*

### 4.1.2 Name, Role, Value (Level A)
*   **Category**: Robust
*   **Implementation Type**: **axe-core** (fully automated)
*   **How Evaluated**: ARIA attribute and semantic HTML validation.
*   **Detection Logic**: axe-core rule `aria-roles`, `aria-valid-attr`. Ensures that screen readers can identify the name and state (e.g., expanded/collapsed) of a component.
*   **Example Failure**: `<div class="toggle"></div>` (no role or state).
*   **Suggested Fix**: `<button aria-expanded="false">Menu</button>`
*   **Confidence Level**: **High**

---

## 📊 Implementation Summary

| Principle      | Total Rules audited | Fully Automated | Hybrid / AI | Manual / Review |
|----------------|---------------------|-----------------|-------------|-----------------|
| Perceivable    | 12                  | 8               | 2           | 2               |
| Operable       | 15                  | 10              | 3           | 2               |
| Understandable | 8                   | 5               | 2           | 1               |
| Robust         | 4                   | 3               | 1           | 0               |
| **TOTAL**      | **39**              | **26**          | **8**       | **5**           |

**Key Definition of Confidence Levels**:
- **High**: Rule is deterministic (True/False). Results are 100% reliable.
- **Medium**: Rule requires context. The system suggests a fix but a human should verify.
- **Low**: Structural or UX-based. The tool flags the area for a manual tester to check.

*End of Rules Reference Documentation*
