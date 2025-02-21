import { useEffect, useState } from "react";

const functionDescription = `
Call this function when assessing a student's answer to a math question.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "assess_math_answer",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            question: {
              type: "string",
              description: "The math question that was asked",
            },
            correctAnswer: {
              type: "string",
              description: "Detailed correct answer explanation",
            },
            userAnswer: {
              type: "string",
              description: "The student's provided answer",
            },
            score: {
              type: "number",
              description: "Numerical score between 0-100",
            }
          },
          required: ["question", "correctAnswer", "userAnswer", "score"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { question, correctAnswer, userAnswer, score } = JSON.parse(functionCallOutput.arguments);

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

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === "assess_math_answer"
        ) {
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                ask for feedback about the answer - don't repeat 
                the answer, just ask if they like the answer.
              `,
              },
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Math Assessment Tool</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Ask for advice on an answer...</p>
          )
        ) : (
          <p>Start the session to use this tool...</p>
        )}
      </div>
    </section>
  );
}
