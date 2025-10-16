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
    
    try {
        const response = await fetch('/api/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic: topic,
                duration: parseInt(durationSelect.value),
                tone: toneSelect.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentScript = data.script;
            scriptText.textContent = currentScript;
            scriptResult.style.display = 'block';
            loadingIndicator.style.display = 'none';
        } else {
            throw new Error(data.error || 'Failed to generate script');
        }
    } catch (error) {
        console.error('Error generating script:', error);
        alert('Failed to generate script. Make sure LM Studio is running on 192.168.1.188:1234');
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
