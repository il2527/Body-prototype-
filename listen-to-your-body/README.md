# Listen to Your Body

An interactive media prototype for dancers to pause, notice, and reflect on how their body feels before moving. It is intentionally not a medical tracker or diagnostic tool. Instead, it frames check-in as a small, quiet ritual.

## Original idea

The experience follows a gentle sequence:

**Arrive → Breathe → Sleep → Listen → Describe → Rate → Reflect → Return**

The dancer silhouette is the main interface. After choosing how they slept, a user sees one full body-scan page with a visual figure and a detailed list of body areas. They can select multiple places, describe what they notice, give each area an intensity, and see a body map and an affirming reflection.

The central design question was: *How can technology help dancers listen to their bodies instead of treating their bodies as something to correct, optimize, or push through?*

## How to open the prototype

No installation is required.

1. Download or clone this repository.
2. Open the `listen-to-your-body` folder.
3. Double-click `index.html` to open it in a modern browser such as Chrome, Safari, or Firefox.
4. Choose **Begin check-in** and follow the on-screen flow.

For the best viewing experience, use a phone-sized browser window or a desktop browser. The page is responsive and supports mouse, touch, and keyboard interactions.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and the dancer illustration template. |
| `styles.css` | Warm visual system, responsive layout, and gentle movement. |
| `app.js` | Check-in flow, selectable body points, responses, and reflection logic. |

## AI tool and selected prompts

**AI tool used:** OpenAI Codex

The prototype was developed through an iterative conversation with Codex. Selected prompts included:

> “please help me to build this prototype in html/css/js script”

> “There are few changes I want you to make. Can you please just show this page once while asking the body after the answering how did you sleep.”

> “Head … Neck … Toes all of these into one long page. Then, for the figure, can you lets of points full of human's body.”

These prompts guided the translation of the concept into a standalone HTML, CSS, and JavaScript experience. I reviewed the interaction flow and requested revisions to make the body scan more complete and easier to use.

## Reflection

This project helped me think about the difference between collecting body data and creating a moment of attention. The most important decision was to avoid clinical language and alarming feedback. Instead of telling a dancer that something is “wrong,” the experience says, “Thank you for noticing.”

I also learned that a visual interface can shape emotional tone. The warm colors, slow breathing motion, and soft body points make the check-in feel less like a form and more like a personal ritual. Adding the full body-area list made the prototype more specific and usable, while keeping the dancer figure central. If I continued the project, I would test it with dancers to learn which body areas, words, and reflection messages feel most supportive.
