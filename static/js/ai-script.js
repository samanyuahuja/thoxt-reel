// AI Script Generator

const topicInput = document.getElementById('topic-input');
const durationSelect = document.getElementById('duration-select');
const toneSelect = document.getElementById('tone-select');
const generateBtn = document.getElementById('generate-btn');
const scriptResult = document.getElementById('script-result');
const scriptText = document.getElementById('script-text');
const useScriptBtn = document.getElementById('use-script-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const loadingIndicator = document.getElementById('loading-indicator');

let currentScript = '';

// Generate script
generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        alert('Please enter a topic for your video');
        return;
    }
    
    // Show loading
    loadingIndicator.style.display = 'block';
    scriptResult.style.display = 'none';
    generateBtn.disabled = true;
    
    const duration = parseInt(durationSelect.value);
    const tone = toneSelect.value;
    
    // Create prompt based on parameters
    const prompt = `Generate a ${duration}-second video script about: ${topic}

Requirements:
- Tone: ${tone}
- Duration: approximately ${duration} seconds when spoken
- Format: Just the script text, no extra formatting
- Make it perfect for a social media reel/short video
- Keep it concise and engaging

Script:`;
    
    try {
        console.log('Calling LM Studio directly from browser at 192.168.1.188:1234...');
        
        // Call LM Studio API directly from browser (client-side)
        const response = await fetch('http://192.168.1.188:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.2-1b-instruct',
                messages: [
                    { role: 'system', content: 'You are a professional script writer for social media videos. Create concise, engaging scripts.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        
        if (!response.ok) {
            throw new Error(`LM Studio API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('LM Studio response received:', data);
        
        currentScript = data.choices[0].message.content.trim();
        scriptText.textContent = currentScript;
        scriptResult.style.display = 'block';
        loadingIndicator.style.display = 'none';
        
    } catch (error) {
        console.error('Error generating script:', error);
        const errorMessage = error.message || error.toString();
        alert(`Failed to generate script:\n\n${errorMessage}\n\nMake sure:\n1. LM Studio is running on 192.168.1.188:1234\n2. Model loaded: Llama-3.2-1B-Instruct-Q8_0.gguf\n3. CORS is enabled in LM Studio settings`);
        loadingIndicator.style.display = 'none';
    } finally {
        generateBtn.disabled = false;
    }
});

// Use script with teleprompter
useScriptBtn.addEventListener('click', () => {
    if (currentScript) {
        // Store script in sessionStorage
        sessionStorage.setItem('teleprompterScript', currentScript);
        // Navigate to recorder with teleprompter enabled
        window.location.href = '/recorder?teleprompter=true';
    }
});

// Regenerate script
regenerateBtn.addEventListener('click', () => {
    generateBtn.click();
});
