import React, { useState, useEffect } from 'react';
import Button from './Button';

const LearningAssessment = ({ 
  isConnected,
  onStartRecording,
  onStopRecording,
  isRecording,
  transcript,
  lastUtterance,
  speak 
}) => {
  const [sessionState, setSessionState] = useState('ready'); // ready, active
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentTopic, setCurrentTopic] = useState(null); // algebra, geometry, trigonometry
  
  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    // Detect current topic from AI's last utterance
    if (lastUtterance) {
      if (lastUtterance.toLowerCase().includes('algebra')) setCurrentTopic('algebra');
      else if (lastUtterance.toLowerCase().includes('geometry')) setCurrentTopic('geometry');
      else if (lastUtterance.toLowerCase().includes('trigonometry')) setCurrentTopic('trigonometry');
    }
  }, [lastUtterance]);

  const startAssessment = () => {
    setSessionState('active');
    // Let the AI start the conversation
    speak(`Hi! I'm your math teacher for today's assessment. We'll be discussing concepts from algebra, 
           geometry, and trigonometry. I'll ask you questions to understand your knowledge of these topics, 
           and provide feedback to help you learn. Don't worry about getting everything perfect - 
           this is a learning opportunity. Are you ready to begin?`);
    
    onStartRecording();
  };

  const handleResponse = () => {
    onStopRecording();
    setSessionState('active');
  };

  // Helper function to get topic-specific styling
  const getTopicStyle = () => {
    switch (currentTopic) {
      case 'algebra':
        return 'border-blue-500 bg-blue-50';
      case 'geometry':
        return 'border-purple-500 bg-purple-50';
      case 'trigonometry':
        return 'border-indigo-500 bg-indigo-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Math Assessment</h2>
        <p className="text-gray-600">
          {isConnected ? "Connected and ready" : "Connecting..."}
        </p>
        {currentTopic && (
          <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
            currentTopic === 'algebra' ? 'bg-blue-100 text-blue-800' :
            currentTopic === 'geometry' ? 'bg-purple-100 text-purple-800' :
            'bg-indigo-100 text-indigo-800'
          }`}>
            Current Topic: {currentTopic.charAt(0).toUpperCase() + currentTopic.slice(1)}
          </div>
        )}
      </div>

      {sessionState === 'ready' && (
        <div className="space-y-4">
          <Button
            onClick={startAssessment}
            disabled={!isConnected}
            className="w-full"
          >
            Start Math Assessment
          </Button>
          <div className="text-sm text-gray-500 text-center">
            Topics covered: Algebra, Geometry, and Trigonometry
          </div>
        </div>
      )}

      {sessionState === 'active' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-l-4 ${getTopicStyle()}`}>
            <div className="mb-2">
              <h3 className="font-semibold mb-1">Last Question/Response:</h3>
              <p className="text-gray-700">{lastUtterance}</p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Your Response:</h3>
              <p className="text-gray-700">{currentTranscript || 'Listening...'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {isRecording ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording...
                </div>
              ) : "Click 'Submit Response' when you're done speaking"}
            </div>
            <Button
              onClick={handleResponse}
              disabled={!currentTranscript}
              className="px-6"
            >
              Submit Response
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        Tip: Speak clearly and take your time to explain your understanding
      </div>
    </div>
  );
};

export default LearningAssessment; 