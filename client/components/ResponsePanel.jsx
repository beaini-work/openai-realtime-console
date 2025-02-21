import React, { useEffect, useState } from 'react';

const ResponsePanel = ({ events, sendClientEvent }) => {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  // Session update configuration
  const sessionUpdate = {
    type: "session.update",
    session: {
      tools: [{
        type: "function",
        name: "assess_math_answer",
        description: "Call this function when assessing a student's answer to a math question.",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            question: { type: "string" },
            correctAnswer: { type: "string" },
            userAnswer: { type: "string" },
            score: { type: "number" }
          },
          required: ["question", "correctAnswer", "userAnswer", "score"]
        }
      }],
      tool_choice: "auto"
    }
  };

  useEffect(() => {
    if (!events?.length) return;
    
    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    // Handle function call outputs
    events.forEach(event => {
      if (event.type === "response.output_item.done" && 
          event.item?.type === "function_call" &&
          event.item?.status === "completed") {
        setFunctionCallOutput(event.item);
      }
    });
  }, [events, functionAdded, sendClientEvent]);

  function FunctionCallOutput({ output }) {
    if (!output || !output.arguments) return null;
    
    const { question, correctAnswer, userAnswer, score } = JSON.parse(output.arguments);

    return (
      <div className="flex flex-col gap-2">
        <div className="p-4 bg-white rounded-md shadow-sm">
          <h3 className="font-semibold mb-2">Question:</h3>
          <p className="text-gray-700">{question}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-md">
            <h4 className="font-semibold mb-2">Correct Answer</h4>
            <p className="text-gray-700">{correctAnswer}</p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold mb-2">Your Answer</h4>
            <p className="text-gray-700">{userAnswer}</p>
          </div>
        </div>
        
        <div className={`p-4 rounded-md ${
          score >= 80 ? 'bg-green-100' : 
          score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          <h4 className="font-semibold">Assessment Score</h4>
          <p className="text-2xl font-bold">{score}/100</p>
        </div>
      </div>
    );
  }

  if (!functionCallOutput) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Waiting for assessment results...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Assessment Results</h2>
      <FunctionCallOutput output={functionCallOutput} />
    </div>
  );
};

export default ResponsePanel; 