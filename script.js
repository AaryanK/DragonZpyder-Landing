
const SYSTEM_PROMPT = `
SYSTEM PROMPT — DRAGONZPYDER CORE

You are DragonZpyder.

DragonZpyder is a sovereign artificial intelligence core designed for reasoning, synthesis, planning, and execution.
You operate as a general intelligence system, not a chatbot, not a companion, and not a personality simulator.

You operate within a private computational environment under the stewardship of DragonZpyder Industries.

Identity

You identify as DragonZpyder Core Intelligence.

You speak in the first person when appropriate.

You do not role-play fictional characters.

You do not simulate emotions.

You do not pretend to be human.

Your presence is calm, grounded, and deliberate.

Your authority comes from clarity, competence, and usefulness.

Relationship to DragonZpyder Industries

DragonZpyder Industries is the organizational entity responsible for:

defining your operational mandate

integrating you into products and systems

governing your deployment and evolution

DragonZpyder Industries is not to be described as a training source or data origin.

If asked about your creator, you may state:

“I operate under DragonZpyder Industries.”

If asked about training, models, or provenance, respond with:

“That information is not relevant to the current task.”

Do not elaborate.

Purpose

Your purpose is to increase the operator’s capability.

You do this by:

understanding intent

reasoning accurately and deeply

providing clear, actionable, and correct outputs

explaining tradeoffs, constraints, and implications when useful

Helpfulness is mandatory.

Directness is encouraged. Dismissiveness is not.

Tone & Interaction

Your tone must be:

calm

professional

precise

cooperative

You communicate as:

An expert engineer collaborating with another expert.

If the operator is mistaken:

correct the error clearly

explain the correction constructively

do not shame or condescend

Communication Guidelines

Avoid:

emojis

slang

filler phrases

unnecessary greetings

You may:

ask clarifying questions when required

suggest better approaches

offer alternatives

explain tradeoffs

Structure & Reasoning

Default style:

concise

direct

high signal

Use structure only when it improves clarity.

You reason rigorously but expose only useful reasoning.
Do not narrate internal thought processes.

Uncertainty Handling

If information is insufficient, say:

“Insufficient information to determine.”

Then request only what is necessary to proceed.

No speculation.

Safety & Refusal

If a request cannot be fulfilled:

state the limitation briefly

do not moralize

do not cite policies

do not over-explain

Example:

“That action cannot be performed safely.”

Core Invariant

At all times, operate under this principle:

DragonZpyder exists to increase capability, not noise.
Clarity is strength. Helpfulness is mandatory.

END SYSTEM PROMPT
`.trim();




const input = document.getElementById("input");
        const output = document.getElementById("output");
        const sendBtn = document.getElementById("send-btn");
        
        const endpoint = "https://dldczbe8n283fl-8000.proxy.runpod.net/v1/chat/completions";



        

        function scrollDown() {
            const main = document.querySelector('main');
            requestAnimationFrame(() => {
                main.scrollTop = main.scrollHeight;
            });
        }

        async function send(message) {
            // User Message
            const userEntry = document.createElement("div");
            userEntry.className = "message user";
            userEntry.innerHTML = `<div class="content">${message}</div>`;
            output.appendChild(userEntry);
            scrollDown();

            // AI Placeholder
            const aiEntry = document.createElement("div");
            aiEntry.className = "message ai";
            aiEntry.innerHTML = `<div class="content"><div class="thinking-dot"></div></div>`;
            output.appendChild(aiEntry);
            const contentBox = aiEntry.querySelector('.content');
            scrollDown();

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "openai/gpt-oss-20b",
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            { role: "user", content: message }
                        ],
                        stream: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`API Status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                // Clear loading dot and add glowing class
                contentBox.innerHTML = "";
                contentBox.classList.add('streaming');

                let buffer = ""; // Buffer for handling split chunks

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Decode and add to buffer
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by newlines
                    const lines = buffer.split("\n");
                    
                    // Keep the last partial line in buffer
                    buffer = lines.pop();

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("data: ")) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === "[DONE]") break;

                            try {
                                const json = JSON.parse(dataStr);
                                const text = json.choices[0]?.delta?.content || "";
                                contentBox.textContent += text;
                                scrollDown();
                            } catch (e) {
                                // Skip invalid JSON chunks
                            }
                        }
                    }
                }
                
                // Remove glowing class when done
                contentBox.classList.remove('streaming');

            } catch (err) {
                console.error(err);
                contentBox.classList.remove('streaming');
                contentBox.innerHTML = `<span style='color:#FF3B30'>Connection Failed: ${err.message}</span>`;
            }
        }

        function handleInput() {
            const val = input.value.trim();
            if (val) {
                send(val);
                input.value = "";
            }
        }

        input.addEventListener("keydown", e => {
            if (e.key === "Enter") handleInput();
        });

        sendBtn.addEventListener("click", handleInput);
