const input = document.getElementById("input");
const output = document.getElementById("output");

const endpoint = "https://qbf3vu1p9exu8c-8000.proxy.runpod.net/v1/chat/completions";

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

function scrollDown() {
    output.scrollTop = output.scrollHeight;
}

async function send(message) {
    // User block
    const userBlock = document.createElement("div");
    userBlock.className = "msg-block user";
    userBlock.innerHTML = `
        <span class="label">Administrator</span>
        <div class="content">${message}</div>
    `;
    output.appendChild(userBlock);
    scrollDown();

    // AI placeholder
    const aiBlock = document.createElement("div");
    aiBlock.className = "msg-block ai";
    aiBlock.innerHTML = `
        <span class="label">DragonZpyder</span>
        <div class="thinking">Synthesizing neural pathways...</div>
    `;
    output.appendChild(aiBlock);
    scrollDown();

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "dragonzpyder-core",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: message }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error("Signal decayed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Replace thinking indicator
        aiBlock.querySelector(".thinking").remove();
        const contentDiv = document.createElement("div");
        contentDiv.className = "content";
        aiBlock.appendChild(contentDiv);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;

                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") return;

                try {
                    const json = JSON.parse(dataStr);
                    const text = json.choices?.[0]?.delta?.content || "";
                    contentDiv.textContent += text;
                    scrollDown();
                } catch {
                    // ignore malformed chunks
                }
            }
        }

    } catch (err) {
        console.error(err);

        if (aiBlock.querySelector(".thinking")) {
            aiBlock.querySelector(".thinking").remove();
        }

        const errorDiv = document.createElement("div");
        errorDiv.className = "content";
        errorDiv.style.color = "var(--neon-magenta)";
        errorDiv.textContent =
            "[CONNECTION TERMINATED: SIGNAL DECAY DETECTED]";
        aiBlock.appendChild(errorDiv);
        scrollDown();
    }
}

input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
        send(input.value.trim());
        input.value = "";
    }
});
