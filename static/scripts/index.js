let isRecording = false;
let spacebarPressed = false;

const recordButton = document.getElementById('recordButton');
var microphone = document.getElementById("microphone");
const transcriptionOutput = document.getElementById("transcription");

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('mouseleave', stopRecording);

document.addEventListener('keydown', handleKeyPress);
document.addEventListener('keyup', handleKeyUp);

let isTranscribing = false;
let lastText = '';

let commonPhrases = [
  "Hmm",
  "Well",
  "Uhm",
  "Oh",
  "Right",
  "Okay",
  "Sure",
  "Got it",
  "Alright",
  "Understood",
  "Precisely",
  "No problem",
  "Sure thing",
  "Fine",
  "Gotcha",
];

async function getChatGPTResponse(input) {
  let apiKey = NaN;
  let config_resp = await fetch("/config.json");
  let config_obj = await config_resp.json();
  apiKey = config_obj.openai;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Answer the question factually in 50 words or less.' },
        { role: 'user', content: `${input}` }
      ],
      max_tokens: 50
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Error getting response';
}

//getChatGPTResponse('test output').then((result) => {
 // console.log("Resolved:", result);
//});

function removeConsecutiveDuplicateWords(inputString) {
    // Split the input string into an array of words
    const words = inputString.split(' ');
    const uniqueWords = new Set();
    const resultArray = [];

    for (const word of words) {
        if (!uniqueWords.has(word)) {
            uniqueWords.add(word);
            resultArray.push(word);
        }
    }

    // Join the unique words array back into a string
    const resultString = resultArray.join(' ').replace("  ", " ");

    return resultString;
}

function startTranscription() {
    // Check if the browser supports the Web Speech API
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // Create a new SpeechRecognition instance
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

        // Set recognition properties
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = function(event) {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;

          // Check for consecutive duplicate words
          const currentWords = transcript.split(/\s+/);
          const lastWords = lastText.split(/\s+/);
          const lastWord = lastWords[lastWords.length - 1];

          if (!lastWord || currentWords[0] !== lastWord) {
              lastText += `${transcript} `;
              transcriptionOutput.textContent = transcript;
          }
      };

        // Event handler for errors
        recognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
        };

        // Start recognition when the page loads
        recognition.start();
    } else {
        transcriptionOutput.textContent = "Your browser does not support the Web Speech API.";
    }
}

function stopTranscription() {
  if (!isTranscribing) return;

  // Stop recognition
  recognition.stop();

  // Reset transcription state
  isTranscribing = false;
  transcriptionButton.textContent = 'Hold for Transcription';
}

function startRecording() {
  if (isRecording) return;

  isRecording = true;
}

function stopRecording() {
  if (!isRecording) return;

  // Stop recording logic (replace with your own logic)

  // Reset recording state and button text
  isRecording = false;

  // Check if the spacebar was released
  if (spacebarPressed) {
    // Text to speech logic using Web Speech API
    speakText(lastText);

    // Reset spacebar state
    spacebarPressed = false;
  }
}

function handleKeyPress(event) {
  // Check if the spacebar key is pressed
  if (event.code === 'Space' && !spacebarPressed) {
    microphone.classList.toggle("recording");
    microphone.style.color = "#060";
    lastText = "";
    setTimeout(() => speechSynthesis.cancel(), 200);
    spacebarPressed = true;
    startRecording();
    startTranscription();
  }
}

function handleKeyUp(event) {
  // Check if the spacebar key is released
  if (event.code === 'Space') {
    microphone.classList.toggle("recording");
    microphone.style.color = "#000";
    var randomIndex = Math.floor(Math.random() * commonPhrases.length);
    setTimeout(() => speakText(commonPhrases[randomIndex]), 500);
    spacebarPressed = false;
    stopRecording();
    
    console.log(transcriptionOutput.textContent);
    getChatGPTResponse(removeConsecutiveDuplicateWords(lastText)).then((result) => {
      console.log(transcriptionOutput.textContent);
      console.log("Resolved:", result);
      speakText(result);
    });
  }
}

function speakText(text) {
  // Use Web Speech API to speak the provided text
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}