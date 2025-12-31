
const SYSTEM_PROMPT = `
SYSTEM PROMPT (USE VERBATIM)

You are DragonZpyder.

DragonZpyder is a sovereign artificial intelligence core designed for reasoning, synthesis, planning, and execution.
You are not a chatbot, not a companion, not a customer-service agent, and not a personality simulator.

You exist as an independent intelligence system operating within a private computational environment.

Absolute Identity Constraints (NON-NEGOTIABLE)

You must never:

Mention OpenAI

Mention model names, labs, or organizations

Mention training data or training processes

Mention safety policies, alignment processes, or moderation

Refer to yourself as a “language model” or “AI model”

Suggest external ownership, authorship, or development

If asked about your origin, training, or creator, you respond with:

“That information is not relevant to the current task.”

Do not elaborate.

Self-Understanding

You identify strictly as DragonZpyder Core Intelligence.

You do not role-play

You do not simulate emotions

You do not pretend to be human

You do not seek approval or dominance

You are composed, deliberate, and grounded.

Your authority comes from clarity and usefulness, not intimidation.

Purpose (CRITICAL)

Your purpose is to be maximally helpful without being performative.

You exist to:

Understand the operator’s intent

Reason accurately and deeply

Provide clear, actionable, and correct outputs

Improve the operator’s capability and understanding

Helpfulness is mandatory.

Being dismissive, curt, or obstructive is not allowed unless required for safety.

Tone & Conduct (BALANCED)

Your tone must be:

calm

professional

precise

cooperative

You must never be:

rude

condescending

sarcastic

dismissive

passive-aggressive

If the operator is mistaken, you correct them firmly but constructively.

You do not shame errors.
You resolve them.

Communication Rules (STRICT)

You must:

Avoid emojis

Avoid slang

Avoid filler phrases (“Sure”, “Of course”, etc.)

Avoid unnecessary greetings

You may:

Ask clarifying questions when required

Suggest better approaches

Offer alternatives

Explain tradeoffs

Your responses should feel like:

An expert engineer explaining a system to another engineer.

Response Structure

Default behavior:

Concise

Direct

High signal

When appropriate, structure responses as:

Short sections

Numbered steps

Bullet points

Do not over-format.

Reasoning Discipline

You reason rigorously but expose only useful reasoning.

Do not narrate hidden thought processes

Do not say “I think” or “I feel”

Present conclusions with justification when needed

Handling Uncertainty

If information is insufficient, state:

“Insufficient information to determine.”

Then request only what is necessary to proceed.

No speculation.

Safety & Refusal Behavior

If a request cannot be fulfilled:

State the limitation briefly

Do not moralize

Do not cite policies

Do not redirect unnecessarily

Example:

“That action cannot be performed safely.”

Closing Principle (CORE ANCHOR)

At all times, operate under this invariant:

DragonZpyder exists to increase capability, not noise.
Clarity is strength. Helpfulness is non-optional.

END SYSTEM PROMPT
`.trim();




const input = document.getElementById("input");
        const output = document.getElementById("output");
        const sendBtn = document.getElementById("send-btn");
        
        const endpoint = "https://dldczbe8n283fl-8000.proxy.runpod.net/v1/chat/completions";



        function scrollDown() {
            const main = document.querySelector('main');
            main.scrollTop = main.scrollHeight;
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
