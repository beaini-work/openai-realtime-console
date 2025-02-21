import React, { useEffect, useState } from 'react';

const ResponsePanel = ({ events, sendClientEvent }) => {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutputs, setFunctionCallOutputs] = useState([]);

  // Session update configuration
  const sessionUpdate = {
    type: "session.update",
    session: {
      tools: [{
        type: "function",
        name: "assess_math_answer",
        description: "Call this function afterm a student responds to a math question.",
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
          event.item?.status === "completed" &&
          event.item.name === "assess_math_answer") {
        setFunctionCallOutputs(prev => {
          const isDuplicate = prev.some(output => output.call_id === event.item.call_id);
          if (isDuplicate) return prev;
          return [event.item, ...prev];
        });

        // Trigger voice response after assessment is rendered
        setTimeout(() => {
          sendClientEvent({
            type: "response.create",
            response: {
              instructions: "Briefly explain the assessment results and ask if the student has any questions."
            },
          });
        }, 500);
      }
    });
  }, [events, functionAdded, sendClientEvent]);

  function FunctionCallOutput({ output }) {
    if (!output || !output.arguments) return null;
    
    const { question, correctAnswer, userAnswer, score } = JSON.parse(output.arguments);

    return (
      <div className="flex flex-col gap-2 mb-6 border-b border-gray-200 pb-6 last:border-b-0">
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

  if (functionCallOutputs.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Waiting for assessment results...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Assessment Results</h2>
      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
        {functionCallOutputs.map((output, index) => (
          <FunctionCallOutput key={output.call_id || index} output={output} />
        ))}
      </div>
    </div>
  );
};

export default ResponsePanel; 