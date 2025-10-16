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
        console.log('Generating script using cloud AI...');
        
        // Call backend API which uses Replit AI Integrations
        const response = await fetch('/api/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: topic,
                duration: duration,
                tone: tone
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        console.log('Script generated successfully!');
        
        currentScript = data.script.trim();
        scriptText.textContent = currentScript;
        scriptResult.style.display = 'block';
        loadingIndicator.style.display = 'none';
        
    } catch (error) {
        console.error('Error generating script:', error);
        const errorMessage = error.message || error.toString();
        alert(`Failed to generate script:\n\n${errorMessage}`);
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
