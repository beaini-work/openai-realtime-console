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
  
  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
    }
  }, [transcript]);

  const startAssessment = () => {
    setSessionState('active');
    // Initial greeting and explanation
    speak(`Hi! I'll be testing your knowledge of basic astronomy today. 
           I'll ask you questions about the solar system and related topics. 
           Feel free to take your time with your answers, and I'll provide feedback 
           to help you learn. Let's begin with our first question: 
           Can you explain the structure of our Solar System, focusing on the 
           different types of planets we have and their arrangement?`);
    
    // Start listening for the response
    onStartRecording();
  };

  const handleResponse = () => {
    // The user has finished speaking, let's process their response
    onStopRecording();
    
    // Send a thoughtful response based on their answer
    speak(`Thank you for that answer. Let me provide some feedback. 
           ${generateFeedback(currentTranscript)}
           Would you like to try another question?`);
    
    // Start listening again for their response to continue
    onStartRecording();
  };

  // Helper function to generate contextual feedback
  const generateFeedback = (answer) => {
    if (answer.toLowerCase().includes('eight planets')) {
      return "You correctly mentioned that there are eight planets. ";
    }
    if (answer.toLowerCase().includes('mercury') && 
        answer.toLowerCase().includes('venus') && 
        answer.toLowerCase().includes('earth') && 
        answer.toLowerCase().includes('mars')) {
      return "Great job identifying the inner planets! ";
    }
    return "Remember that our Solar System has eight planets, divided into inner and outer planets. ";
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Learning Assessment</h2>
        <p className="text-gray-600">
          {isConnected ? "Connected and ready" : "Connecting..."}
        </p>
      </div>

      {sessionState === 'ready' && (
        <Button
          onClick={startAssessment}
          disabled={!isConnected}
          className="w-full"
        >
          Start Assessment
        </Button>
      )}

      {sessionState === 'active' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Your Response:</h3>
            <p>{currentTranscript || 'Listening...'}</p>
          </div>
          
          <Button
            onClick={handleResponse}
            disabled={!currentTranscript}
            className="w-full"
          >
            Submit Response
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        {isRecording ? "Listening..." : "Click 'Submit Response' when you're done speaking"}
      </div>
    </div>
  );
};

export default LearningAssessment; 