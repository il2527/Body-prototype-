# Listen to Your Body

An interactive media prototype for dancers to pause, notice, and reflect on how their body feels before moving. It is intentionally not a medical tracker or diagnostic tool. Instead, it frames check-in as a small, quiet ritual.

## Original idea

When someone selects the places in their body that feel uncomfortable, the experience should guide them to describe and rate those feelings, then show a calm visual summary of their body today.
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

The final experience met my goal of helping users identify sore areas, rate intensity, and visualize how their body feels each day. However, the feedback after symptoms were reported did not always feel medically professional. Since this is a self-awareness tool rather than a diagnostic system, future versions should use validated health information or keep feedback neutral and encourage professional support when needed.

I also improved the interaction flow during development. Instead of asking users to complete questions one body part at a time, users now select all relevant areas first and then describe them together. AI helped me generate ideas and implement changes quickly, but I learned that I still need to guide the concept and design decisions clearly. I have not yet tested the weekly view with real data, so evaluating whether it communicates long-term patterns is an important next step.
