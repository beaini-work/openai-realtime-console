**Core MVP Stories**

1. `[FEAT] GCP Speech-to-Text Transcription Service`

   - Implement chunked audio processing pipeline
   - Add retry logic with exponential backoff
   - Store transcripts as VTT files with timestamps
   - **Risk**: Audio/video format compatibility

   ```javascript
   // Potential integration with existing audio processing
   const { audioMetadataManager } = require('../managers/AudioMetadataManager')

   class TranscriptionService {
     async transcribeLibraryItem(libraryItem) {
       const audioFiles = libraryItem.media.includedAudioFiles
       return Promise.all(audioFiles.map((file) => this._processAudioFile(file.path)))
     }

     _processAudioFile(filePath) {
       return audioMetadataManager.extractAudioStream(filePath).then((stream) => this.gcpSpeechClient.longRunningRecognize(stream))
     }
   }
   ```

2. `[FEAT] Transcript Display & Seek Synchronization`

   - Extend existing player UI components
   - Add timestamp-based seek functionality
   - **Risk**: Cross-browser text rendering consistency

3. `[FEAT] Knowledge Test Generation API`

   - Direct Google LLM integration
   - Question template system
   - **Risk**: LLM prompt engineering stability

   ```javascript
   // Sample direct API call pattern
   const { TextServiceClient } = require('@google-ai/generativelanguage')

   class QuizGenerator {
     generateQuestions(transcript) {
       const prompt = `Generate 5 quiz questions from: ${transcript.substring(0, 3000)}`

       return this.textClient.generateText({
         model: 'models/text-bison-001',
         temperature: 0.3,
         candidateCount: 1,
         prompt: { text: prompt }
       })
     }
   }
   ```

**Optional/Bonus Features**

4. `[FEAT] Voice-Based Knowledge Test Modality`

   - Google Text-to-Speech integration
   - Voice response processing
   - **Risk**: Speech recognition accuracy

   ```javascript
   // Potential integration with existing playback system
   const { playbackSessionManager } = require('../managers/PlaybackSessionManager')

   class VoiceTestService {
     async presentQuestion(question) {
       const audioConfig = {
         audioEncoding: 'MP3',
         speakingRate: 1.0,
         pitch: 0
       }

       const audioContent = await this.textToSpeechClient.synthesizeSpeech({
         input: { text: question },
         voice: { languageCode: 'en-US' },
         audioConfig
       })

       return playbackSessionManager.streamAudioBuffer(audioContent)
     }
   }
   ```

5. `[FEAT] AI-Powered Summary Generation`
   - Configurable summary lengths
   - Cache system for generated content
   - **Risk**: Hallucination mitigation

**Risk Assessment Update**

1. **Voice Modality Integration** (Bonus Feature #4)

   - Critical Unknowns:
   - Real-time voice response latency
   - Multi-language support complexity
   - Audio session management

2. **Direct LLM Integration** (Core #3)
   - New Risks:
   - API rate limiting
   - Response format validation
   - Cost per query estimation

**Phased Delivery Plan**

| Phase | Features                      | Duration  | Dependencies       |
| ----- | ----------------------------- | --------- | ------------------ |
| 1     | Core Transcription + Basic UI | 1.5 weeks | GCP API Access     |
| 2     | Text-Based Knowledge Tests    | 1 week    | Phase 1 completion |
| 3\*   | Voice Test Modality           | 2 weeks   | Phase 2 + TTS API  |
| 4\*   | Summary Generation            | 1 week    | Phase 2 completion |

**Cost Monitoring Requirements**

- Add audio duration tracking to `ServerSettings.js`
- Implement query counters in `ApiRouter.js`
- Add user-facing quota warnings

Would you like me to prototype any specific component's implementation details?
